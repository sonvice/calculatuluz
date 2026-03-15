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
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'No tienes una suscripción activa con Stripe' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const stripe = new Stripe(stripeKey)
    const returnUrl = request.headers.get('origin') + '/escanear-factura'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Customer portal error:', err)
    return new Response(JSON.stringify({ error: 'Error al abrir el portal. Inténtalo de nuevo.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
