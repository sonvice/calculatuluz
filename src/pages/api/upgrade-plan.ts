import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  const stripeKey        = import.meta.env.STRIPE_SECRET_KEY        || process.env.STRIPE_SECRET_KEY
  const proPriceId       = import.meta.env.STRIPE_PRICE_PRO         || process.env.STRIPE_PRICE_PRO
  const supabaseUrl      = import.meta.env.PUBLIC_SUPABASE_URL      || process.env.PUBLIC_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !proPriceId) {
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

  const token    = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey || '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return new Response(JSON.stringify({ error: 'No tienes una suscripción activa' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (profile.subscription_tier === 'pro') {
    return new Response(JSON.stringify({ error: 'Ya tienes el Plan Pro' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const stripe = new Stripe(stripeKey)

    // Obtener la suscripción actual para sacar el item ID
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return new Response(JSON.stringify({ error: 'No se encontró el item de suscripción' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Actualizar la suscripción al precio Pro con prorrateo inmediato
    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: itemId, price: proPriceId }],
      proration_behavior: 'create_prorations',
      metadata: { supabase_user_id: user.id, tier: 'pro' },
    })

    // Actualizar Supabase directamente (el webhook también lo hará, pero esto es instantáneo)
    await supabase.from('user_profiles').update({
      subscription_tier: 'pro',
      subscription_end: new Date(updated.current_period_end * 1000).toISOString(),
    }).eq('id', user.id)

    return new Response(JSON.stringify({ success: true, tier: 'pro' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Upgrade plan error:', err)
    // Error de pago fallido (tarjeta insuficiente, etc.)
    const message = err?.raw?.message || err?.message || 'Error al actualizar el plan'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
