import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe no configurado' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

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
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, is_subscribed, subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return new Response(JSON.stringify({ synced: false, reason: 'no_customer' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const stripe = new Stripe(stripeKey)

    // Obtener suscripciones activas del customer en Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 5,
    })

    if (subscriptions.data.length === 0) {
      // No hay suscripciones activas — desactivar si estaba activa
      if (profile.is_subscribed) {
        await supabase.from('user_profiles').update({
          is_subscribed: false,
          subscription_tier: null,
          subscription_end: new Date().toISOString(),
        }).eq('id', user.id)
        return new Response(JSON.stringify({ synced: true, is_subscribed: false }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ synced: false, reason: 'no_active_subscription' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Tomar la suscripción activa más reciente
    const sub = subscriptions.data[0]
    const tier = (sub.metadata?.tier as string) || 'basico'
    const periodEnd = new Date((sub.items.data[0].current_period_end ?? 0) * 1000).toISOString()

    // Actualizar Supabase con el estado real de Stripe
    await supabase.from('user_profiles').update({
      is_subscribed: true,
      subscription_tier: tier,
      subscription_end: periodEnd,
      stripe_subscription_id: sub.id,
    }).eq('id', user.id)

    return new Response(JSON.stringify({
      synced: true,
      is_subscribed: true,
      tier,
      subscription_end: periodEnd,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    // Customer borrado o pertenece a otra cuenta/modo Stripe → limpiar y tratar como sin suscripción
    if (err?.code === 'resource_missing' && err?.param === 'customer') {
      await supabase.from('user_profiles').update({
        stripe_customer_id: null,
        is_subscribed: false,
        subscription_tier: null,
      }).eq('id', user.id)
      return new Response(JSON.stringify({ synced: false, reason: 'no_customer' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }
    console.error('Sync subscription error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
