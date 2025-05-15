import type { APIRoute } from "astro";
import  supabase  from "../../lib/supabaseClient";

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // 1. Actualizar estado en Supabase
  const { data, error } = await supabase
    .from("subscribers")
    .update({ confirmed: true })
    .eq("token", token);

  if (error) return redirect("/error", 302);

  // 2. Redirigir a página de éxito
  return redirect("/gracias", 302);
};