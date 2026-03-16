import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  // Leer env vars dentro del handler para garantizar valores de runtime (no baked en build)
  const stripeKey        = import.meta.env.STRIPE_SECRET_KEY        ?? process.env.STRIPE_SECRET_KEY
  const supabaseUrl      = import.meta.env.PUBLIC_SUPABASE_URL      ?? process.env.PUBLIC_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  const baseUrl          = import.meta.env.PUBLIC_BASE_URL           ?? process.env.PUBLIC_BASE_URL ?? 'http://localhost:4321'

  const PLANS = {
    basico: { priceId: import.meta.env.STRIPE_PRICE_BASICO ?? process.env.STRIPE_PRICE_BASICO, name: 'Plan Básico' },
    pro:    { priceId: import.meta.env.STRIPE_PRICE_PRO    ?? process.env.STRIPE_PRICE_PRO,    name: 'Plan Pro' },
  } as const

  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe no configurado' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  // Verificar autenticación
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey || '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    console.error('[create-checkout] Auth failed:', authError?.message)
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const body = await request.json()
  const tier = body.tier as 'basico' | 'pro'
  const plan = PLANS[tier]

  if (!plan?.priceId) {
    console.error(`[create-checkout] Missing env var STRIPE_PRICE_${tier?.toUpperCase()}`)
    return new Response(JSON.stringify({ error: `Plan "${tier}" no disponible. Contacta con soporte.` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const stripe = new Stripe(stripeKey)

    // Buscar o crear customer de Stripe
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Usar el origin de la request para que funcione en local y en producción
    const requestOrigin = request.headers.get('origin') || baseUrl

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${requestOrigin}/escanear-factura?payment=success`,
      cancel_url: `${requestOrigin}/escanear-factura?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        tier,
      },
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
      },
      locale: 'es',
      allow_promotion_codes: true,
    })

    console.log(`[create-checkout] OK tier=${tier} session=${session.id}`)
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('[create-checkout] Stripe error:', err?.raw?.message || err?.message, '| tier:', tier, '| priceId:', plan?.priceId)
    const userMsg = err?.raw?.code === 'resource_missing'
      ? 'El precio de Stripe no existe. Contacta con soporte.'
      : 'Error al crear sesión de pago'
    return new Response(JSON.stringify({ error: userMsg }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
