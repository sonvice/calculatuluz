import { supabase } from '../lib/supabaseClient.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Helpers para calcular fecha en Europe/Madrid ---
function madridNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}
function formatDateYYYYMMDDMadrid(date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDateESMadrid(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid'
  }).format(date);
}

async function main() {
  try {
    // calcular "mañana" **en Madrid** y enviar ese day explícito a la API
    const nowMadrid = madridNow();
    const tomorrowMadrid = new Date(nowMadrid);
    tomorrowMadrid.setDate(tomorrowMadrid.getDate() + 1);
    const dayParam = formatDateYYYYMMDDMadrid(tomorrowMadrid); // e.g. "2025-11-01"
    const fmtTomorrow = fmtDateESMadrid(tomorrowMadrid);

    // pedir a la API con day explícito (evita ambigüedades de TZ)
    const priceResponse = await fetch(`https://calculatuluz.es/api/prices?day=${dayParam}`);
    if (!priceResponse.ok) {
      const body = await priceResponse.text().catch(() => null);
      console.error('Error fetching prices, body:', body);
      throw new Error('Error fetching prices');
    }
    const { prices = [], maxPrice = {} } = await priceResponse.json();

    // preparar best/worst (la API ya tiene hour legible)
    const pricesWithFormat = prices.map(p => ({
      ...p,
      priceFormatted: Number(p.price).toFixed(4).replace('.', ',') + '€/kWh'
    }));

    const bestHours = [...pricesWithFormat].sort((a, b) => a.price - b.price).slice(0, 3);
    const worstHours = [...pricesWithFormat].sort((a, b) => b.price - a.price).slice(0, 3);

    // obtener suscriptores
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('confirmed', true);
    if (error) throw error;
    if (!subscribers || subscribers.length === 0) {
      console.log('No hay suscriptores confirmados. Salimos.');
      return;
    }

    // construir label para maxPrice
    const maxPriceValue = (typeof maxPrice.value === 'number') ? maxPrice.value : (maxPrice.value ? Number(maxPrice.value) : null);
    const maxPriceLabel = maxPrice.timeRange || '';

    // construir HTML (uso directamente p.hour)
    const emailHtml = `
      <div style="max-width:600px;margin:20px auto;font-family:Arial,sans-serif">
        <img src="https://calculatuluz.es/logo.png" alt="Logo" style="height:32px;">
        <h2>⚡ Horas más económicas para mañana (${fmtTomorrow})</h2>

        <div style="background:#f8f9fa;padding:20px;border-radius:10px;">
          <h3>Top 3 horas baratas (mañana):</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${bestHours.map(h => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${h.hour}</td>
                <td style="text-align:right;color:#4CAF50;font-weight:bold;">${h.priceFormatted}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div style="background:#ffe6e6;padding:20px;border-radius:10px;margin-top:20px;">
          <h3 style="color:#c0392b;">🔔 Picos de precio mañana que debes evitar:</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${worstHours.map(h => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${h.hour}</td>
                <td style="text-align:right;color:#c0392b;font-weight:bold;">${h.priceFormatted}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <p style="font-size:14px;margin-top:25px;">
          💡 Precio máximo mañana: ${maxPriceValue !== null ? maxPriceValue.toFixed(4).replace('.', ',') + '€/kWh' : '—'} ${maxPriceLabel ? `(${maxPriceLabel})` : ''}
        </p>

        <a href="https://calculatuluz.es" style="display:inline-block;margin:25px 0;padding:12px 25px;background:#2c3e50;color:white;text-decoration:none;border-radius:5px;">
          Calcular consumo ahora
        </a>

        <p style="font-size:12px;color:#666;">
          <a href="https://calculatuluz.es/desuscribirse" style="color:#666;text-decoration:underline;">Desuscribirse</a> |
          <a href="https://calculatuluz.es/privacidad" style="color:#666;text-decoration:underline;">Privacidad</a>
        </p>
      </div>
    `;

    // enviar
    await resend.emails.send({
      from: 'CalculaTuLuz <info@calculatuluz.es>',
      to: subscribers.map(s => s.email),
      subject: `💰 Horas luz más baratas - ${fmtDateESMadrid(new Date())}`,
      html: emailHtml
    });

    console.log('Emails enviados OK');
  } catch (err) {
    console.error('Error en send-daily:', err);
  }
}

main();
