import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SCAN_LIMITS = { basico: 20, pro: 50 } as const
type Tier = keyof typeof SCAN_LIMITS

// Rate limiting por IP: máx 10 intentos por minuto
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Limpiar entradas expiradas cada 5 min para evitar memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 300_000)

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting por IP
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Demasiadas peticiones. Espera un momento.' }), {
      status: 429, headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY

  if (!openaiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey || '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token invalido' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('free_scans_used, is_subscribed, subscription_end, subscription_tier, monthly_scans_used, monthly_scans_reset_at, is_unlimited')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return new Response(JSON.stringify({ error: 'Perfil no encontrado. Recarga la página e inicia sesión de nuevo.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const isSubscriptionActive = profile.is_subscribed &&
    (!profile.subscription_end || new Date(profile.subscription_end) > new Date())

  // ── Usuario ilimitado (test / admin) — saltarse todos los límites
  const isUnlimited = profile.is_unlimited === true

  // ── Verificar límite de escaneos ──────────────────────────────
  const isFreeAvailable = profile.free_scans_used < 1

  if (!isUnlimited && !isFreeAvailable) {
    if (!isSubscriptionActive) {
      return new Response(JSON.stringify({
        error: 'Has usado tu escaneo gratuito. Suscríbete para continuar.',
        requiresSubscription: true
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Verificar límite mensual: resetear contador si cambió el mes
    const tier = profile.subscription_tier as Tier | null
    const monthlyLimit = tier ? (SCAN_LIMITS[tier] ?? 0) : 0

    // Comprobar si hay que resetear el contador mensual
    let monthlyUsed = profile.monthly_scans_used ?? 0
    const now = new Date()
    if (profile.monthly_scans_reset_at) {
      const resetAt = new Date(profile.monthly_scans_reset_at)
      const sameMonth = resetAt.getFullYear() === now.getFullYear() &&
        resetAt.getMonth() === now.getMonth()
      if (!sameMonth) {
        // Nuevo mes: resetear contador en DB
        await supabase
          .from('user_profiles')
          .update({ monthly_scans_used: 0, monthly_scans_reset_at: now.toISOString() })
          .eq('id', user.id)
        monthlyUsed = 0
      }
    } else {
      // Primera vez: inicializar fecha de reset
      await supabase
        .from('user_profiles')
        .update({ monthly_scans_reset_at: now.toISOString() })
        .eq('id', user.id)
    }

    if (monthlyUsed >= monthlyLimit) {
      return new Response(JSON.stringify({
        error: `Has alcanzado el límite de ${monthlyLimit} escaneos este mes. Se renueva el próximo mes.`,
        limitReached: true,
        monthlyLimit,
        monthlyUsed,
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // ── Verificar límite de facturas almacenadas ──────────────
  if (!isUnlimited) {
    const storageLimit = isSubscriptionActive
      ? (profile.subscription_tier === 'pro' ? 100 : 30)
      : 5  // usuarios en periodo gratuito: 5 facturas máx
    const { count } = await supabase
      .from('scanned_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= storageLimit) {
      return new Response(JSON.stringify({
        error: `Has alcanzado el límite de ${storageLimit} facturas almacenadas de tu plan.`,
        storageLimitReached: true,
      }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const invoiceType = (formData.get('invoiceType') as string) || 'luz'
    const fileHash = (formData.get('fileHash') as string) || null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se envio imagen' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ── Cache hit: misma imagen ya procesada por este usuario ────────────────
    if (fileHash) {
      try {
        const { data: cached } = await supabase
          .from('scanned_invoices')
          .select('*')
          .eq('user_id', user.id)
          .eq('file_hash', fileHash)
          .maybeSingle()

        if (cached) {
          const tier = profile.subscription_tier as Tier | null
          const monthlyLimit = tier ? (SCAN_LIMITS[tier] ?? 0) : 0
          const scansLeft = profile.is_subscribed
            ? Math.max(0, monthlyLimit - (profile.monthly_scans_used ?? 0))
            : 0
          return new Response(JSON.stringify({
            success: true,
            invoice: cached,
            extracted: cached.extracted_data,
            imageUrl: cached.image_url,
            cached: true,
            scansLeft,
            monthlyLimit,
          }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
      } catch {
        // Column may not exist yet — continue with full scan
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Subir imagen a Supabase Storage
    let imageUrl: string | null = null
    let imagePath: string | null = null
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, buffer, { contentType: mimeType, upsert: false })

      if (!uploadError && uploadData) {
        imagePath = uploadData.path
        // Bucket privado → signed URL de 1 año (31536000 s)
        const { data: signedData } = await supabase.storage
          .from('invoices')
          .createSignedUrl(uploadData.path, 31536000)
        imageUrl = signedData?.signedUrl ?? null
      }
    } catch (e) {
      console.error('Error uploading to storage:', e)
    }

    const systemPrompt = getSystemPrompt(invoiceType)

    const openai = new OpenAI({ apiKey: openaiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analiza esta factura de ${invoiceType} y extrae toda la informacion:` },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content?.trim() || ''

    let parsed
    try {
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      parsed = { ocrText: content, error: 'No se pudo parsear la respuesta' }
    }

    const invoiceData = {
      user_id: user.id,
      invoice_type: invoiceType,
      file_hash: fileHash,
      total_amount: parsed.total_amount || null,
      billing_period_start: parsed.billing_period_start || null,
      billing_period_end: parsed.billing_period_end || null,
      provider: parsed.provider || null,
      contract_number: parsed.contract_number || null,
      consumption_kwh: parsed.consumption_kwh || null,
      price_per_kwh: parsed.price_per_kwh || null,
      power_term: parsed.power_term || null,
      energy_term: parsed.energy_term || null,
      taxes: parsed.taxes || null,
      ocr_text: parsed.ocrText || content,
      extracted_data: parsed,
      image_url: imageUrl,
      image_path: imagePath,
      status: 'processed'
    }

    const { data: invoice, error: insertError } = await supabase
      .from('scanned_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (insertError) {
      console.error('Error saving invoice:', insertError)
    }

    // Actualizar contadores
    if (isFreeAvailable) {
      // Usar el escaneo gratuito
      await supabase
        .from('user_profiles')
        .update({ free_scans_used: profile.free_scans_used + 1 })
        .eq('id', user.id)
    } else if (isSubscriptionActive) {
      // Incrementar contador mensual
      const newMonthlyUsed = (profile.monthly_scans_used ?? 0) + 1
      await supabase
        .from('user_profiles')
        .update({ monthly_scans_used: newMonthlyUsed })
        .eq('id', user.id)
    }

    const tier = profile.subscription_tier as Tier | null
    const monthlyLimit = tier ? (SCAN_LIMITS[tier] ?? 0) : 0
    const newMonthlyUsed = isSubscriptionActive ? (profile.monthly_scans_used ?? 0) + 1 : 0
    const scansLeft = isSubscriptionActive
      ? Math.max(0, monthlyLimit - newMonthlyUsed)
      : isFreeAvailable ? 0 : 0

    return new Response(JSON.stringify({
      success: true,
      invoice: invoice || invoiceData,
      extracted: parsed,
      imageUrl,
      scansLeft,
      monthlyLimit,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('OCR error:', error)

    // Error de OpenAI por créditos insuficientes
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return new Response(JSON.stringify({
        error: 'La API de OpenAI no tiene créditos. Añade saldo en platform.openai.com.'
      }), { status: 402, headers: { 'Content-Type': 'application/json' } })
    }

    // Clave de OpenAI inválida
    if (error?.status === 401) {
      return new Response(JSON.stringify({
        error: 'Clave de OpenAI inválida. Comprueba OPENAI_API_KEY en el .env.'
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const message = error?.message || 'Error al procesar la imagen'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function getSystemPrompt(type: string): string {
  const baseFields = `
  "ocrText": "texto completo extraido de la factura",
  "total_amount": numero total de la factura en euros,
  "billing_period_start": "fecha inicio periodo en formato YYYY-MM-DD",
  "billing_period_end": "fecha fin periodo en formato YYYY-MM-DD",
  "provider": "nombre de la comercializadora",
  "contract_number": "numero de contrato o referencia",
  "cups": "codigo CUPS completo (ES + 20 caracteres)",
  "holder_name": "nombre completo del titular del contrato",
  "taxes": importe total de impuestos en euros,
  "iva_rate": tipo de IVA aplicado en porcentaje (ej: 21),
  "distributor": "nombre de la empresa distribuidora de la red"`

  if (type === 'luz') {
    return `Eres un experto analizando facturas de electricidad espanolas. Extrae la informacion y responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
{
  ${baseFields},
  "consumption_kwh": consumo total en kWh,
  "price_per_kwh": precio medio por kWh en euros,
  "power_term": importe del termino de potencia en euros,
  "energy_term": importe del termino de energia en euros,
  "meter_rental": importe del alquiler del contador en euros (si aparece),
  "electricity_tax": importe del impuesto sobre la electricidad en euros,
  "electricity_tax_rate": tipo del impuesto electrico en porcentaje (habitualmente 5.11),
  "contracted_power_p1": potencia contratada punta en kW,
  "contracted_power_p2": potencia contratada valle en kW,
  "consumption_p1": consumo punta en kWh,
  "consumption_p2": consumo llano en kWh,
  "consumption_p3": consumo valle en kWh,
  "price_p1": precio kWh en periodo punta en euros,
  "price_p2": precio kWh en periodo llano en euros,
  "price_p3": precio kWh en periodo valle en euros,
  "tariff_type": "PVPC o Mercado Libre",
  "access_tariff": "tarifa de acceso (ej: 2.0TD)",
  "meter_reading_start": lectura contador inicio en kWh,
  "meter_reading_end": lectura contador fin en kWh,
  "contract_end_date": "fecha fin de contrato en formato YYYY-MM-DD si aparece",
  "tips": ["consejo 1 para ahorrar basado en esta factura", "consejo 2", "consejo 3"]
}
Si no puedes extraer algun campo, usa null. Analiza si el consumo es alto o bajo para el periodo y da consejos personalizados.`
  }

  if (type === 'gas') {
    return `Eres un experto analizando facturas de gas natural espanolas. Extrae la informacion y responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
{
  ${baseFields},
  "access_tariff": "tarifa de acceso al gas (ej: RL.1, RL.2, RL.3)",
  "consumption_kwh": consumo total en kWh,
  "consumption_m3": consumo en metros cubicos,
  "conversion_factor": factor de conversion de m3 a kWh si aparece,
  "reading_current": lectura del contador actual,
  "reading_previous": lectura del contador anterior,
  "reading_type": "real o estimada",
  "price_per_kwh": precio por kWh del termino variable en euros,
  "power_term": importe del termino fijo mensual en euros,
  "energy_term": importe del termino variable de energia en euros,
  "meter_rental": importe del alquiler del contador en euros (si aparece),
  "hydrocarbon_tax": importe del impuesto especial sobre hidrocarburos en euros,
  "hydrocarbon_tax_rate": tipo del impuesto sobre hidrocarburos en euros/kWh (habitualmente 0.00234),
  "tariff_type": "TUR (mercado regulado) o Mercado Libre",
  "tips": ["consejo 1 para ahorrar en gas", "consejo 2", "consejo 3"]
}
Si no puedes extraer algun campo, usa null. Indica si la lectura es estimada o real. Da consejos personalizados de ahorro.`
  }

  return `Eres un asistente que analiza facturas y recibos. Extrae la informacion y responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
{
  ${baseFields},
  "consumption_kwh": consumo si aplica,
  "price_per_kwh": precio unitario si aplica,
  "power_term": termino fijo si aplica,
  "energy_term": termino variable si aplica,
  "tips": ["consejo 1", "consejo 2"]
}
Si no puedes extraer algun campo, usa null.`
}
