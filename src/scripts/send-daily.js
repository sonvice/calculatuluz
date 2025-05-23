import  {supabase}  from "../lib/supabaseClient.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
    try {
      // 1. Obtener precios
      const priceResponse = await fetch("https://calculatuluz.es/api/prices");
      if (!priceResponse.ok) throw new Error("Error fetching prices");
      const { prices, maxPrice } = await priceResponse.json();
  
      // 2. Filtrar horas
      const bestHours = prices
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map(h => ({
          ...h,
          priceFormatted: h.price.toFixed(4).replace('.', ',') + '€/kWh'
        }));

        // 3. Filtrar horas caras (top 3 a evitar)
        const worstHours = [...prices]
          .sort((a, b) => b.price - a.price)
          .slice(0, 3)
          .map(h => ({
            ...h,
            priceFormatted: h.price.toFixed(4).replace(".", ",") + "€/kWh",
          }));
  
      // 4. Obtener suscriptores
      const { data: subscribers, error } = await supabase
        .from("subscribers")
        .select("email")
        .eq("confirmed", true);
  
      if (error) throw error;
      if (!subscribers.length) return;
  
      // 5. Construir email
      const emailHtml = `
        <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif;">
          <img src="https://calculatuluz.es/logo.png" alt="Logo" style="height: 60px;">
          <h2 style="color: #2c3e50;">⚡ Horas más económicas - ${new Date().toLocaleDateString('es-ES')}</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h3 style="margin-top: 0;">Top 3 horas baratas:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${bestHours.map(h => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px;">${h.hour}</td>
                  <td style="text-align: right; color: #4CAF50; font-weight: bold;">
                    ${h.priceFormatted}
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>

           <div style="background: #ffe6e6; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #c0392b;">🔔 Alertas de picos de precio que debes evitar:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${worstHours.map(h => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px;">${h.hour}</td>
                  <td style="text-align: right; color: #c0392b; font-weight: bold;">
                    ${h.priceFormatted}
                  </td>
                </tr>
              `).join("")}
            </table>
          </div>
  
          <p style="font-size: 14px; margin-top: 25px;">
            💡 Precio máximo hoy: ${maxPrice.value.toFixed(4)}€/kWh (${maxPrice.timeRange})
          </p>
  
          <a href="https://calculatuluz.es" 
             style="display: inline-block; margin: 25px 0; padding: 12px 25px;
                    background: #2c3e50; color: white; text-decoration: none; border-radius: 5px;">
            Calcular consumo ahora
          </a>
  
          <p style="font-size: 12px; color: #666;">
            <a href="%unsubscribe_url%">Desuscribirse</a> | 
            <a href="https://calculatuluz.es/privacidad">Privacidad</a>
          </p>
        </div>
      `;
  
      // 5. Enviar
      await resend.emails.send({
        from: 'CalculaTuLuz <info@calculatuluz.es>',
        to: subscribers.map(s => s.email),
        subject: `💰 Horas luz más baratas - ${new Date().toLocaleDateString('es-ES')}`,
        html: emailHtml
      });
  
    } catch (error) {
      console.error('Error en send-daily:', error);
      // Implementar notificación de error (ej: enviar a Slack)
    }
  }

main();