import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient"; // Asegúrate que la ruta es correcta
import { Resend } from "resend";

export const prerender = false; // OBLIGATORIO: Esto debe ejecutarse en el servidor

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const email = data.email;
    const token = crypto.randomUUID();

    // 1. Guardar en Supabase
    const { error: dbError } = await supabase
      .from("subscribers")
      .insert([{ email, token }]);

    if (dbError) {
      console.error("❌ Error Supabase:", dbError);
      return new Response(JSON.stringify({ error: "Error al guardar en BD" }), { status: 500 });
    }

    const base = import.meta.env.PUBLIC_BASE_URL || new URL(request.url).origin;

    // 2. Enviar email (AHORA CAPTURAMOS LA RESPUESTA)
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "CalculaTuLuz <info@calculatuluz.es>", // Asegúrate de que este remitente coincide con tu dominio verificado
      to: email,
      subject: "Confirma tu suscripción - CalculaTuLuz",
      html: `
        <h2>¡Casi listo! ⚡</h2>
        <p>Haz clic abajo para confirmar tu suscripción:</p>
        <a href="${base}/api/confirm?token=${token}" style="background:#2563eb;color:fff;padding:10px 20px;text-decoration:none;border-radius:5px">
           Confirmar Email
        </a>
      `
    });

    // 3. VERIFICAMOS SI HUBO ERROR EN RESEND
    if (emailError) {
      console.error("❌ Error RESEND:", emailError); // Esto saldrá en los logs de Netlify
      
      // Borramos el usuario de Supabase para no dejar basura
      await supabase.from("subscribers").delete().eq("token", token);

      return new Response(
        JSON.stringify({ error: "Fallo al enviar el email: " + emailError.message }),
        { status: 500 } // Devolvemos error al frontend
      );
    }

    console.log("✅ Email enviado:", emailData);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ Error Servidor:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
};