import  supabase  from "../../lib/supabaseClient";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const email = data.email;
  const token = crypto.randomUUID();

  // 1. Guardar en Supabase
  const { error } = await supabase
    .from("subscribers")
    .insert([{ email, token }]);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Error al suscribir" }),
      { status: 400 }
    );
  }
  const base = import.meta.env.PUBLIC_BASE_URL || new URL(request.url).origin;
  // 2. Enviar email de confirmación
  await resend.emails.send({
    from: "CalculaTuLuz <info@calculatuluz.es>",
    to: email,
    subject: "Confirma tu suscripción",
    html: `
    <p>Haz clic para confirmar:</p>
       <a href="${base}/api/confirm?token=${token}">
        Confirmar Email
       </a>
    `
  });

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
};