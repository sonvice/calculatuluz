import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// 🛑 LISTA NEGRA DE DOMINIOS TEMPORALES
// Puedes ampliar esta lista buscando "disposable email domains list json" en GitHub
const DISPOSABLE_DOMAINS = [
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf', 'courriel.fr.nf',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'hide.biz.st', 'mymail.biz.st',
  '10minutemail.com', '10minutemail.net',
  'guerrillamail.com', 'guerrillamailblock.com',
  'temp-mail.org', 'tempmail.com',
  'mailinator.com',
  'sharklasers.com',
  'superrito.com',
  'teleworm.us',
  'maildrop.cc'
];

// Función auxiliar para validar email
function isValidEmail(email: string): boolean {
  // Regex más estricto
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  const domain = email.split('@')[1].toLowerCase();
  
  // Si el dominio está en la lista negra, es falso
  if (DISPOSABLE_DOMAINS.includes(domain)) return false;

  return true;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, trap } = data; // Recibimos también la trampa

    // 1. CHEQUEO ANTIBOT (HONEYPOT) 🍯
    // Si 'trap' tiene valor, es un bot.
    if (trap && trap.length > 0) {
      // Devolvemos éxito falso para confundir al bot (o error, como prefieras)
      console.warn(`🤖 Bot detectado intentando registrarse: ${email}`);
      return new Response(JSON.stringify({ success: true }), { status: 200 }); 
    }

    // 2. VALIDACIÓN DE CALIDAD DE EMAIL 🛡️
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Introduce un correo válido (no aceptamos temporales)." }),
        { status: 400 }
      );
    }

    // ... A partir de aquí sigue tu lógica normal (Supabase + Resend) ...
    
    // (Asegúrate de comprobar si el email YA existe en Supabase para no duplicar error)
    const { data: existingUser } = await supabase
        .from('subscribers')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
         return new Response(
            JSON.stringify({ error: "Este correo ya está registrado." }),
            { status: 400 }
         );
    }

    const token = crypto.randomUUID();

    // Guardar en Supabase
    const { error: dbError } = await supabase
      .from("subscribers")
      .insert([{ email, token }]);

    if (dbError) {
      console.error("❌ Error Supabase:", dbError);
      return new Response(JSON.stringify({ error: "Error al guardar suscripción" }), { status: 500 });
    }

    const base = import.meta.env.PUBLIC_BASE_URL || new URL(request.url).origin;

    // Enviar Email
    const { error: emailError } = await resend.emails.send({
      from: "CalculaTuLuz <info@calculatuluz.es>",
      to: email,
      subject: "Confirma tu suscripción - CalculaTuLuz",
      html: `
        <h2>¡Casi listo! ⚡</h2>
        <p>Confirma tu suscripción haciendo clic aquí:</p>
        <a href="${base}/api/confirm?token=${token}" style="background:#2563eb;color:fff;padding:10px 20px;text-decoration:none;border-radius:5px">
           Confirmar Email
        </a>
      `
    });

    if (emailError) {
       // ... manejo de errores (borrar de supabase, etc)
       await supabase.from("subscribers").delete().eq("token", token);
       return new Response(JSON.stringify({ error: "Error al enviar email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
};