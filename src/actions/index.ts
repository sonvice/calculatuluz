// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Lista de dominios de email desechables comunes
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 
  'mailinator.com', 'throwaway.email', 'temp-mail.org'
];

// Palabras spam comunes
const SPAM_KEYWORDS = [
  'viagra', 'casino', 'lottery', 'winner', 'claim prize',
  'click here', 'urgent', 'act now', 'limited time'
];

// Función para detectar spam
function isSpamContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Función para validar email
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.some(d => domain?.includes(d));
}

// Rate limiting simple (en producción usa Redis o similar)
const submissionTracker = new Map<string, number[]>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const submissions = submissionTracker.get(email) || [];
  
  // Limpiar submissions antiguas (más de 1 hora)
  const recentSubmissions = submissions.filter(time => now - time < 3600000);
  
  // Máximo 3 envíos por hora
  if (recentSubmissions.length >= 3) {
    return false;
  }
  
  recentSubmissions.push(now);
  submissionTracker.set(email, recentSubmissions);
  return true;
}

export const server = {
  sendContactEmail: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre es demasiado largo'),
      email: z.string().email('Email inválido')
        .max(100, 'El email es demasiado largo'),
      subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres')
        .max(200, 'El asunto es demasiado largo'),
      message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres')
        .max(5000, 'El mensaje es demasiado largo'),
      // Campo honeypot (invisible para humanos, visible para bots)
      website: z.string().optional(),
      // Timestamp para detectar envíos muy rápidos
      formStartTime: z.string().optional(),
    }),
    handler: async (input, context) => {
      try {
        console.log('🔍 Validando formulario de contacto...');

        // 1. Honeypot: Si el campo 'website' tiene valor, es un bot
        if (input.website) {
          console.log('❌ Honeypot detectó bot');
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Solicitud inválida',
          });
        }

        // 2. Verificar tiempo mínimo de llenado (bots llenan en <3 segundos)
        if (input.formStartTime) {
          const startTime = parseInt(input.formStartTime);
          const timeTaken = Date.now() - startTime;
          
          console.log(`⏱️ Tiempo de llenado: ${timeTaken}ms`);
          
          if (timeTaken < 3000) { // Menos de 3 segundos
            console.log('❌ Formulario llenado muy rápido');
            throw new ActionError({
              code: 'BAD_REQUEST',
              message: 'Por favor, tómate tu tiempo para llenar el formulario',
            });
          }
        }

        // 3. Rate limiting
        if (!checkRateLimit(input.email)) {
          console.log('❌ Rate limit excedido');
          throw new ActionError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Has enviado demasiados mensajes. Por favor, espera un momento.',
          });
        }

        // 4. Detectar emails desechables
        if (isDisposableEmail(input.email)) {
          console.log('❌ Email desechable detectado');
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Por favor, usa un email válido',
          });
        }

        // 5. Detectar contenido spam
        if (isSpamContent(input.message) || isSpamContent(input.subject)) {
          console.log('❌ Contenido spam detectado');
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Tu mensaje contiene contenido no permitido',
          });
        }

        // 6. Validar longitud de palabras (bots suelen enviar texto aleatorio muy largo)
        const words = input.message.split(/\s+/);
        const hasLongWords = words.some(word => word.length > 50);
        
        if (hasLongWords) {
          console.log('❌ Palabras excesivamente largas detectadas');
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'El mensaje contiene texto inválido',
          });
        }

        console.log('✅ Todas las validaciones pasadas, enviando email...');

        // Todo OK, enviar email
        const { data, error } = await resend.emails.send({
          from: 'Contacto Web <onboarding@resend.dev>', // Usa este mientras verificas tu dominio
          to: 'wvmc_es@hotmail.com', // 👈 CAMBIA ESTO POR TU EMAIL
          subject: `Contacto Web: ${input.subject}`,
          replyTo: input.email,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                Nuevo mensaje de contacto
              </h2>
              
              <div style="margin: 20px 0;">
                <p style="margin: 10px 0;">
                  <strong style="color: #374151;">Nombre:</strong><br/>
                  <span style="color: #6b7280;">${input.name}</span>
                </p>
                
                <p style="margin: 10px 0;">
                  <strong style="color: #374151;">Email:</strong><br/>
                  <a href="mailto:${input.email}" style="color: #3b82f6;">${input.email}</a>
                </p>
                
                <p style="margin: 10px 0;">
                  <strong style="color: #374151;">Asunto:</strong><br/>
                  <span style="color: #6b7280;">${input.subject}</span>
                </p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #374151;">Mensaje:</strong>
                <p style="color: #6b7280; white-space: pre-wrap; margin-top: 10px;">${input.message}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #9ca3af;">
                Este mensaje fue enviado desde el formulario de contacto de calculatuluz.es<br/>
                IP: ${context.clientAddress || 'No disponible'}<br/>
                Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
              </p>
            </div>
          `,
        });

        if (error) {
          console.error('❌ Error de Resend:', error);
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al enviar el email. Por favor, intenta nuevamente.',
          });
        }

        console.log('✅ Email enviado correctamente!');

        return {
          success: true,
          message: '¡Mensaje enviado correctamente! Te responderemos pronto.',
        };
      } catch (error) {
        if (error instanceof ActionError) {
          throw error;
        }
        
        console.error('❌ Error inesperado:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar la solicitud. Por favor, intenta nuevamente.',
        });
      }
    },
  }),
};