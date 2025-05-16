import supabase from "../../lib/supabaseClient";

export const prerender = false;   

export const GET: APIRoute = async ({ request }) => {
  const url   = new URL(request.url);
  const token = url.searchParams.get("token");

  // 1. Actualizar estado en Supabase
  const { data, error } = await supabase
    .from("subscribers")
    .update({ confirmed: true })
    .eq("token", token);

  console.log("confirm", { token, data, error });
  if (error) {
    return new Response("Error al confirmar el email", { status: 500 });
  }

  // 2. Redirigir al “gracias”
  return new Response(null, {
    status: 302,
    headers: { Location: "/gracias" },
  });
};
