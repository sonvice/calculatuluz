export const navigation = [
  { title: 'Calculadora', url: '/', onlyTips: false },
  { title: 'Precio luz hoy', url: '/precio-luz-hoy' },
  { title: 'Tips & Guías', url: '/tipsyguias' },
  { title: 'Mi consumo', url: '/mi-consumo' },
  { title: 'Contacto', url: '/contacto' },
];


export const appliances = [
  // --- ILUMINACIÓN Y OFICINA ---
  {
    value: 50, label: 'Bombilla LED', watts: '50W', icon: 'Lightbulb', slug: 'bombilla-led',
    seo: {
      description: 'Aunque una bombilla LED gasta muy poco, el ahorro real está en sustituir todas las de la casa. Consumen hasta un 80% menos que las incandescentes.',
      tips: ['Usa luz cálida (2700K) para salones y fría (4000K) para cocina.', 'Aprovecha la luz natural con espejos estratégicos.', 'Instala sensores de movimiento en pasillos.']
    }
  },
  {
    value: 150, label: 'Portátil', watts: '150W', icon: 'Laptop', slug: 'ordenador-portatil',
    seo: {
      description: 'El consumo de un portátil varía mucho según la carga de trabajo. Si solo navegas gasta menos (30-50W), pero renderizando vídeo sube al máximo.',
      tips: ['Desconecta el cargador cuando la batería esté al 100%.', 'Baja el brillo de la pantalla para ahorrar hasta un 20%.', 'Cierra pestañas de navegador en segundo plano.']
    }
  },
  {
    value: 450, label: 'PC Gaming', watts: '450W', icon: 'MonitorPlay', slug: 'pc-gaming',
    seo: {
      description: 'Un PC Gaming es de los "vampiros" modernos. La tarjeta gráfica y el monitor de alta tasa de refresco son los mayores consumidores.',
      tips: ['Limita los FPS en juegos que no requieran máximo rendimiento.', 'Apaga el monitor si te levantas más de 10 minutos.', 'Configura el modo suspensión para que salte a los 5 minutos.']
    }
  },

  // --- SALÓN ---
  {
    value: 300, label: 'Televisor 50"', watts: '300W', icon: 'Tv', slug: 'televisor',
    seo: {
      description: 'Las pantallas OLED y QLED modernas tienen picos de consumo altos con el HDR activado. El tamaño de la pantalla influye directamente en el gasto.',
      tips: ['Desactiva el modo "Tienda" o "Vívido", usa el modo "Eco" o "Cine".', 'No la uses de ruido de fondo si no estás mirando.', 'Si es Smart TV, asegúrate de que no se queda procesando en standby.']
    }
  },
  {
    value: 60, label: 'Ventilador', watts: '60W', icon: 'Fan', slug: 'ventilador',
    seo: {
      description: 'El ventilador es el rey del ahorro en verano. Consume casi 15 veces menos que un aire acondicionado, aunque no enfría el aire, solo lo mueve.',
      tips: ['Úsalo combinado con el aire acondicionado para subir el termostato de este.', 'Limpia las aspas regularmente para mejorar la aerodinámica.', 'Apágalo si no hay nadie en la habitación (no baja la temperatura).']
    }
  },

  // --- COCINA ---
  {
    value: 250, label: 'Nevera', watts: '250W', icon: 'Refrigerator', slug: 'nevera',
    seo: {
      description: 'La nevera es responsable de hasta el 30% de la factura porque funciona 24/7. Su consumo depende del aislamiento y de cuántas veces abras la puerta.',
      tips: ['Mantén la temperatura a 4ºC y el congelador a -18ºC.', 'No metas comida caliente; deja que se enfríe fuera.', 'Limpia la rejilla trasera una vez al año para que respire bien.']
    }
  },
  {
    value: 1500, label: 'Freidora de Aire', watts: '1.500W', icon: 'Utensils', slug: 'freidora-aire',
    seo: {
      description: 'Aunque tiene mucha potencia, la Air Fryer ahorra dinero porque cocina mucho más rápido que un horno y no necesita precalentamiento largo.',
      tips: ['No la abras constantemente para mirar, pierdes calor.', 'Aprovecha el calor residual apagándola 2 minutos antes.', 'Llena la cesta adecuadamente sin bloquear el flujo de aire.']
    }
  },
  {
    value: 1800, label: 'Vitrocerámica', watts: '1.800W', icon: 'CookingPot', slug: 'vitroceramica',
    seo: {
      description: 'La vitrocerámica tradicional es menos eficiente que la inducción. Tarda más en calentar y pierde energía en forma de calor residual.',
      tips: ['Usa tapas en las ollas: cocinas 3 veces más rápido.', 'Apaga el fuego 5 minutos antes y termina con el calor residual.', 'Usa sartenes con fondo difusor plano.']
    }
  },
  {
    value: 800, label: 'Microondas', watts: '800W', icon: 'Microwave', slug: 'microondas',
    seo: {
      description: 'Es el método más eficiente para calentar comida. Calienta directamente las moléculas de agua, evitando desperdiciar energía en calentar el aire.',
      tips: ['Corta los alimentos en trozos pequeños para calentar antes.', 'Mantenlo limpio: la suciedad absorbe ondas y resta eficiencia.', 'Desenchúfalo si tiene reloj digital y no lo usas (consumo fantasma).']
    }
  },
  {
    value: 1200, label: 'Horno', watts: '1.200W', icon: 'Heater', slug: 'horno', // Heater se parece a un horno/radiador
    seo: {
      description: 'El horno es un gran consumidor. Cada vez que abres la puerta pierde el 20% del calor acumulado, obligando a la resistencia a trabajar al máximo.',
      tips: ['Cocina varios platos a la vez (Batch Cooking).', 'Evita precalentar para cocciones largas superiores a 1 hora.', 'Verifica que la goma de la puerta cierra herméticamente.']
    }
  },
  {
    value: 1800, label: 'Lavavajillas', watts: '1.800W', icon: 'Droplets', slug: 'lavavajillas',
    seo: {
      description: 'Gasta menos agua y energía que fregar a mano con agua caliente. El mayor pico de consumo se produce al calentar el agua.',
      tips: ['Usa siempre el modo ECO: tarda más pero calienta el agua más despacio (ahorra luz).', 'Espera a llenarlo por completo.', 'Limpia el filtro regularmente.']
    }
  },

  // --- LIMPIEZA Y HOGAR ---
  {
    value: 2000, label: 'Lavadora', watts: '2.000W', icon: 'WashingMachine', slug: 'lavadora',
    seo: {
      description: 'El 90% del consumo de la lavadora se usa para calentar el agua. Lavar en frío es la medida de ahorro más potente que existe.',
      tips: ['Lava a 30ºC o con agua fría siempre que sea posible.', 'Usa programas cortos si la ropa no tiene manchas difíciles.', 'Centrifuga a altas revoluciones para que la secadora gaste menos después.']
    }
  },
  {
    value: 2500, label: 'Secadora', watts: '2.500W', icon: 'Shirt', slug: 'secadora',
    seo: {
      description: 'Uno de los aparatos que más potencia demanda. Las de bomba de calor son mucho más eficientes que las de condensación o evacuación.',
      tips: ['Limpia el filtro de pelusas tras CADA uso (vital para eficiencia).', 'Introduce la ropa bien centrifugada.', 'Separa tejidos pesados de los ligeros para un secado uniforme.']
    }
  },

  // --- CLIMATIZACIÓN ---
  {
    value: 900, label: 'Aire acondicionado', watts: '900W', icon: 'AirVent', slug: 'aire-acondicionado',
    seo: {
      description: 'Por cada grado que bajas la temperatura, el consumo sube un 8%. La clave no es enfriar rápido, sino mantener una temperatura estable.',
      tips: ['Mantén la temperatura a 24-26ºC en verano.', 'Usa el modo "Dry" o deshumidificador si hay mucha humedad.', 'Cierra persianas en las horas centrales del día.']
    }
  },
  {
    value: 2000, label: 'Radiador eléctrico', watts: '2.000W', icon: 'ThermometerSun', slug: 'radiador',
    seo: {
      description: 'La calefacción eléctrica directa es cara. Los radiadores con termostato preciso ayudan a evitar que se dispare la factura.',
      tips: ['No cubras nunca el radiador con ropa húmeda.', 'Usa paneles reflectantes detrás para proyectar el calor a la sala.', 'Un buen aislamiento en ventanas ahorra más que cambiar de radiador.']
    }
  },
  {
    value: 1500, label: 'Termo Eléctrico', watts: '1.500W', icon: 'Waves', slug: 'termo-electrico',
    seo: {
      description: 'Mantener agua caliente 24h es costoso. Si tienes tarifa con discriminación horaria, un temporizador en el enchufe es tu mejor inversión.',
      tips: ['Instala un temporizador para que caliente solo antes de las duchas.', 'Baja la temperatura del termostato a 60ºC.', 'Aisla el termo si está en un lugar frío.']
    }
  },

  // Custom
  { value: 'custom', label: 'Personalizado', watts: '', icon: 'Settings', image: '/images/personalizado.jpg' },
];

export const faqData = [
  {
    question: '¿Cómo calculo el consumo de un electrodoméstico?',
    answer: 'Multiplica la potencia en kW por las horas de uso. Ej.: 1,5 kW × 2 h = 3 kWh.'
  },
  {
    question: '¿Qué significa kWh?',
    answer: 'Es la unidad de energía: kilovatio (1 000 W) consumido en una hora.'
  },
  {
    question: '¿Cómo ahorro usando esta calculadora?',
    answer: 'Te ayuda a programar cargas en horas valle, donde el precio por kWh es más bajo.'
  },
  {
    question: '¿Incluye IVA el coste calculado?',
    answer: 'Sí, todos los precios muestran el total con IVA al 21 %.'
  },
  {
    question: `Cómo saber cuánto consume mi electrodoméstico en 3 pasos:`,
    answer: `
      <ol>
        <li>Localiza la potencia en vatios (W) en la etiqueta energética</li>
        <li>Mide las <strong>horas reales de uso diario</strong></li>
        <li>Usa nuestra calculadora con el precio actual de la luz</li>
      </ol>
    `
  }
];

/* Luz hoy */
export const faqDataLuzHoy = [
  {
    question: '¿Qué es la tarifa PVPC y cómo funciona?',
    answer: 'La PVPC (Precio Voluntario para el Pequeño Consumidor) es la tarifa regulada donde el precio del kWh se fija por cada intervalo horario en función de la oferta y la demanda del mercado mayorista.'
  },
  {
    question: '¿Cómo se calcula el precio de la luz cada día?',
    answer: 'Red Eléctrica de España publica diariamente los precios horarios en €/MWh; para obtener el precio en €/kWh se transforma y aplica el IVA correspondiente.'
  },
  {
    question: '¿Qué franjas horarias contempla la PVPC?',
    answer: '<ul><li><strong>Valle:</strong> periodo de menor demanda, con kWh más económico.</li><li><strong>Llano:</strong> tramo de precio intermedio.</li><li><strong>Punta:</strong> horas de alta demanda, con coste más elevado.</li></ul>'
  },
  {
    question: '¿Por qué varía tanto el precio de la luz?',
    answer: 'Fluctúa según la disponibilidad de energías renovables, la demanda en cada tramo horario y los costes regulados (peajes, impuestos y cargos).'
  },
  {
    question: '¿Cómo ahorro programando mis electrodomésticos?',
    answer: 'Programa tus equipos en las franjas valle, cuando el kWh es más barato, y evita su uso en las franjas punta para maximizar el ahorro.'
  },
  {
    question: '¿Qué es el precio indexado en el mercado libre?',
    answer: 'Es un contrato cuyo coste del kWh refleja directamente las subidas y bajadas del mercado mayorista, con revisiones periódicas según la cotización del periodo.'
  },
  {
    question: '¿Cómo puedo comparar tarifas del mercado libre?',
    answer: 'Consulta las ofertas de distintas comercializadoras, compara el término de consumo (€ / kWh) y revisa posibles descuentos o bonos adicionales.'
  },
  {
    question: '¿Qué componentes forman el precio final de la luz?',
    answer: '<ul><li><strong>Coste mayorista:</strong> precio base del kWh.</li><li><strong>Peajes de acceso:</strong> coste de transporte y distribución.</li><li><strong>Impuestos:</strong> IVA e impuestos especiales.</li></ul>'
  },
  {
    question: '¿Existe algo así como “luz gratis” en ciertos períodos?',
    answer: 'Ocasionalmente el mercado mayorista puede registrar precios cero o negativos, pero la factura final siempre incluye peajes e impuestos, por lo que no llega a ser gratuita.'
  }
];


export const faqDataConsumo = [
  {
    question: '¿Cómo funciona la calculadora de consumo eléctrico?',
    answer: 'La calculadora estima tu consumo diario y mensual en kWh basándose en los electrodomésticos que añades, su potencia en vatios (W) y las horas de uso diarias. Multiplica estos valores y los convierte automáticamente a kWh (kilovatios-hora), la unidad que aparece en tu factura eléctrica.'
  },
  {
    question: '¿Qué electrodomésticos consumen más energía en casa?',
    answer: '<ul><li><strong>Aire acondicionado:</strong> 1.500-3.000W, puede representar el 40% del consumo.</li><li><strong>Calefacción eléctrica:</strong> 2.000-3.000W en uso continuo.</li><li><strong>Horno:</strong> 2.000W, alto consumo por cortos períodos.</li><li><strong>Lavadora y secadora:</strong> 1.500-2.500W cada una.</li><li><strong>Nevera:</strong> 150-300W pero funciona 24h, acumulando consumo diario significativo.</li></ul>'
  },
  {
    question: '¿Cómo calculo el consumo de un electrodoméstico?',
    answer: 'La fórmula es: <strong>Consumo (kWh) = Potencia (W) × Horas de uso / 1000</strong>. Por ejemplo, una lavadora de 2000W usada 1 hora al día consume 2 kWh/día. Para el coste, multiplica los kWh por el precio actual de la luz.'
  },
  {
    question: '¿Qué es la potencia contratada y cómo afecta mi factura?',
    answer: 'La potencia contratada (en kW) es la máxima potencia que puedes usar simultáneamente sin que salte el diferencial. Pagas un término fijo mensual por ella (aproximadamente 0.068€/día por kW). Si tu consumo pico real es menor al 60% de tu potencia contratada, podrías ahorrar reduciéndola.'
  },
  {
    question: '¿Cuánto cuesta 1 kWh de luz con PVPC?',
    answer: 'El precio varía cada hora según el mercado mayorista. En 2024-2025, el precio medio del kWh en PVPC oscila entre 0.08€ y 0.20€, aunque puede ser menor en valle (madrugada) o mayor en punta (tarde-noche). Nuestra aplicación muestra los precios actualizados en tiempo real desde la API de ESIOS-REE.'
  },
  {
    question: '¿Cómo puedo ahorrar en mi factura de la luz?',
    answer: '<ul><li><strong>Usa electrodomésticos en horario valle:</strong> programa lavadoras, lavavajillas y cargas en madrugada (00:00-08:00).</li><li><strong>Aprovecha las alertas de precio:</strong> configura notificaciones cuando el precio baje de tu umbral.</li><li><strong>Optimiza la potencia contratada:</strong> ajústala a tu consumo real para pagar menos en el término fijo.</li><li><strong>Evita el standby:</strong> desconecta aparatos que no uses, algunos consumen 5-10W constantemente.</li><li><strong>Sustituye bombillas por LED:</strong> consumen 80% menos que las incandescentes.</li></ul>'
  },
  {
    question: '¿Las alertas de precio funcionan con la página cerrada?',
    answer: 'Las notificaciones del navegador funcionan incluso con la pestaña cerrada, siempre que el navegador esté abierto y hayas dado permisos. El sistema verifica el precio cada actualización y te avisa cuando baje de tu umbral configurado, con un límite de una alerta cada 30 minutos para evitar saturación.'
  },
  {
    question: '¿Qué categorías de electrodomésticos puedo registrar?',
    answer: '<ul><li><strong>Cocina:</strong> nevera, horno, microondas, vitrocerámica.</li><li><strong>Limpieza:</strong> lavadora, secadora, lavavajillas, aspiradora.</li><li><strong>Climatización:</strong> aire acondicionado, calefacción, ventiladores.</li><li><strong>Electrónica:</strong> TV, ordenador, consola, router.</li><li><strong>Iluminación:</strong> bombillas LED, halógenas, lámparas.</li><li><strong>General:</strong> cualquier otro aparato eléctrico.</li></ul>'
  },
  {
    question: '¿Cómo interpretar el gráfico de consumo por categoría?',
    answer: 'El gráfico circular muestra el porcentaje de consumo diario (en kWh) que representa cada categoría de electrodomésticos. Te ayuda a identificar rápidamente dónde se va más energía: si la climatización es el 50%, ese es tu principal objetivo de optimización.'
  },
  {
    question: '¿Por qué mi consumo estimado no coincide con mi factura?',
    answer: 'La calculadora estima en base a valores promedio. Tu consumo real puede variar por: potencia real del aparato diferente a la nominal, eficiencia energética (etiqueta A+++ vs C), hábitos de uso variables, pérdidas en la instalación, consumos fantasma en standby. Úsala como guía orientativa para identificar patrones y oportunidades de ahorro.'
  },
  {
    question: '¿Qué son las franjas horarias valle, llano y punta en PVPC?',
    answer: '<ul><li><strong>Valle (más barato):</strong> 00:00-08:00 laborables, todo el día fines de semana y festivos.</li><li><strong>Llano (precio medio):</strong> 08:00-10:00, 14:00-18:00 y 22:00-00:00 laborables.</li><li><strong>Punta (más caro):</strong> 10:00-14:00 y 18:00-22:00 laborables, horario de mayor demanda.</li></ul>'
  },
  {
    question: '¿Puedo exportar mi perfil de consumo?',
    answer: 'Sí, puedes exportar todos tus electrodomésticos y configuración en formato JSON. Esto te permite hacer backup, compartir tu perfil con otros usuarios, o importarlo en otro dispositivo. La exportación incluye nombre, potencia, horas y categoría de cada aparato.'
  },
  {
    question: '¿Los datos se guardan en la nube?',
    answer: 'No, todos tus datos se almacenan localmente en tu navegador mediante localStorage. Esto garantiza privacidad total y funcionamiento offline, pero significa que son específicos del navegador/dispositivo. Usa la función de exportar para crear respaldos o transferir entre dispositivos.'
  },
  {
    question: '¿Cómo configuro las alertas de precio bajo?',
    answer: 'Ve a la sección de Alertas, define tu umbral de precio (ej: 0.120 €/kWh), y activa las notificaciones del navegador. Cuando el precio horario actual baje de ese umbral, recibirás una notificación automática para que aproveches ese momento y pongas en marcha tus electrodomésticos de alto consumo.'
  },
  {
    question: '¿Qué precio umbral debo configurar para las alertas?',
    answer: 'Depende de tu estrategia de ahorro. Un umbral conservador sería 0.100 €/kWh (solo te avisa en los momentos más baratos). Un umbral más permisivo de 0.150 €/kWh te dará más oportunidades. Observa el precio medio histórico en tu zona y configura 20-30% por debajo para capturas las mejores franjas.'
  },
  {
    question: '¿La nevera debe estar en funcionamiento 24 horas?',
    answer: 'Sí, la nevera debe estar siempre enchufada. Aunque su consumo instantáneo (150-300W) parece bajo, al funcionar 24h acumula 3.6-7.2 kWh diarios. Los modelos modernos con etiqueta A+++ son más eficientes y su consumo real puede ser hasta 40% menor que uno antiguo clase B o C.'
  },
  {
    question: '¿Cuánto me ahorro programando la lavadora en valle?',
    answer: 'Una lavadora de 2000W que funciona 1.5h consume 3 kWh. Si el precio en punta es 0.18€/kWh vs 0.09€/kWh en valle, ahorras 0.27€ por lavado. Con 4 lavados semanales, son ~4.5€/mes o 54€/año solo con ese cambio de hábito.'
  },
  {
    question: '¿Los tips de ahorro se personalizan según mi consumo?',
    answer: 'Sí, el sistema analiza tus electrodomésticos registrados y genera recomendaciones específicas: detecta aparatos de alto consumo, identifica uso excesivo (>20h/día), compara tu potencia contratada vs pico real, y alerta si el precio PVPC está elevado. Cuantos más electrodomésticos añadas, más precisos serán los consejos.'
  },
  {
    question: '¿Qué significa el potencial de ahorro mensual?',
    answer: 'Es la suma de todos los ahorros estimados de los tips generados. Por ejemplo, si detecta potencia sobredimensionada (ahorro 10€/mes), uso de electrodomésticos en punta (ahorro 20€/mes), y aparatos en standby innecesarios (ahorro 5€/mes), mostrará un potencial total de 35€/mes. Son estimaciones orientativas basadas en patrones comunes.'
  },
  {
    question: '¿La aplicación funciona en móvil?',
    answer: 'Sí, todos los componentes son completamente responsive y optimizados para móvil. Los gráficos se adaptan automáticamente al tamaño de pantalla, y las notificaciones push funcionan tanto en navegadores móviles como de escritorio (Chrome, Firefox, Safari iOS 16.4+).'
  }
];
