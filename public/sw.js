// public/sw.js
const CACHE_NAME = 'consumo-luz-v1';
const API_CACHE_TIME = 10 * 60 * 1000; // 10 minutos

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Escuchar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data.type === 'CHECK_PRICE') {
    checkPriceAndNotify(event.data.threshold);
  }
});

// Verificar precio y enviar notificación
async function checkPriceAndNotify(threshold) {
  try {
    // Obtener precio actual desde ESIOS API
    const response = await fetch('https://api.esios.ree.es/indicators/1001?geo_ids=8741');
    const data = await response.json();
    
    if (!data.indicator?.values?.length) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const todayPrices = data.indicator.values.filter(v => {
      const date = new Date(v.datetime);
      return date.getDate() === now.getDate();
    });
    
    const currentPriceData = todayPrices[currentHour];
    if (!currentPriceData) return;
    
    const currentPrice = currentPriceData.value / 1000; // MWh a kWh
    
    // Verificar umbral y última notificación
    if (currentPrice < threshold) {
      const lastAlert = await getLastAlertTime();
      const now = Date.now();
      
      // Enviar máximo 1 notificación cada 30 minutos
      if (!lastAlert || now - lastAlert > 30 * 60 * 1000) {
        self.registration.showNotification('💰 ¡Precio bajo!', {
          body: `El precio actual es ${currentPrice.toFixed(4)} €/kWh (umbral: ${threshold.toFixed(4)})`,
          icon: '/favicon.svg',
          badge: '/badge-icon.png',
          tag: 'price-alert',
          requireInteraction: false,
          vibrate: [200, 100, 200],
          data: {
            url: '/',
            timestamp: Date.now()
          },
          actions: [
            { action: 'open', title: 'Ver precios' },
            { action: 'close', title: 'Cerrar' }
          ]
        });
        
        await saveLastAlertTime(now);
      }
    }
  } catch (error) {
    console.error('Error al verificar precio:', error);
  }
}

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Helpers para almacenar última alerta
async function getLastAlertTime() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match('last-alert-time');
  if (response) {
    const data = await response.json();
    return data.timestamp;
  }
  return null;
}

async function saveLastAlertTime(timestamp) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    'last-alert-time',
    new Response(JSON.stringify({ timestamp }))
  );
}

// Sincronización periódica en segundo plano (si está soportada)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-price') {
    event.waitUntil(checkPriceAndNotify());
  }
});