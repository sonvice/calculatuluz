// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { getActionContext } from 'astro:actions';

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip requests for prerendered pages
  if (context.isPrerendered) return next();

  const { action, setActionResult, serializeActionResult } = getActionContext(context);

  // Si hay un resultado de acción guardado en cookie, mostrarlo
  const actionResultCookie = context.cookies.get('action-result')?.value;
  if (actionResultCookie) {
    try {
      const { actionName, result } = JSON.parse(actionResultCookie);
      setActionResult(actionName, result);
      // Limpiar cookie después de mostrar
      context.cookies.delete('action-result', { path: '/' });
    } catch (e) {
      console.error('Error parsing action result cookie:', e);
    }
  }

  // Si se llamó una acción desde un formulario HTML
  if (action?.calledFrom === 'form') {
    // Ejecutar el handler de la acción
    const result = await action.handler();
    const serializedResult = serializeActionResult(result);

    // Guardar resultado en cookie
    context.cookies.set('action-result', JSON.stringify({
      actionName: action.name,
      result: serializedResult
    }), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 // 60 segundos
    });

    // Redirigir de vuelta a la página en caso de error
    if (result.error) {
      const referer = context.request.headers.get('Referer');
      if (referer) {
        return context.redirect(referer);
      }
    }

    // Redirigir a la página de éxito
    return context.redirect(context.url.pathname);
  }

  return next();
});