import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabaseClient.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El campo email es obligatorio.' }),
        { status: 400 }
      );
    }

    // Marcar confirmed = false
    const { data, error } = await supabaseAdmin!
      .from('subscribers')
      .update({ confirmed: false, updated_at: new Date().toISOString() })
      .eq('email', email);
      

    if (error) {
      console.error('[unsubscribe] supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la desuscripción.' }),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se encontró ese correo en la lista.' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Te has desuscrito correctamente.' }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[unsubscribe] unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Error inesperado. Vuelve a intentarlo.' }),
      { status: 500 }
    );
  }
};
