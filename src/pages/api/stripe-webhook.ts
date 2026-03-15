import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe no configurado', { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const supabase = createClient(supabaseUrl, supabaseServiceKey || '')

  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabaseUserId = (event.data.object as any)?.metadata?.supabase_user_id

  switch (event.type) {
    // Suscripción activada o renovada
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id || supabaseUserId
      const tier = sub.metadata?.tier || 'basico'
      const isActive = sub.status === 'active' || sub.status === 'trialing'

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({
            is_subscribed: isActive,
            subscription_tier: isActive ? tier : null,
            subscription_end: isActive
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            stripe_subscription_id: sub.id,
            // Resetear contador mensual al activar
            ...(isActive ? { monthly_scans_used: 0, monthly_scans_reset_at: new Date().toISOString() } : {}),
          })
          .eq('id', userId)
      }
      break
    }

    // Suscripción cancelada o expirada
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id || supabaseUserId

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({
            is_subscribed: false,
            subscription_tier: null,
            subscription_end: new Date().toISOString(),
          })
          .eq('id', userId)
      }
      break
    }

    // Pago fallido
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const userId = (invoice.subscription_details?.metadata as any)?.supabase_user_id
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ is_subscribed: false })
          .eq('id', userId)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  })
}
