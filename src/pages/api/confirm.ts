import type { APIRoute } from "astro";
import { supabaseAdmin } from '../../lib/supabaseClient.js';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token = new URL(request.url).searchParams.get('token');
  console.log('🔎 [confirm] token recibido:', token);

  // Usa supabaseAdmin para saltarte RLS
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .update({ confirmed: true })
    .eq('token', token);

  console.log('🔄 [confirm] resultado update:', { data, error });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/gracias' },
  });
};
