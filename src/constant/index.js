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
      title: 'Cuánto consume una bombilla LED en euros',
      metaDescription: 'Calcula el consumo real de tus bombillas LED en kWh y euros. Descubre cuánto ahorras respecto a bombillas incandescentes y halógenas.',
      description: 'Las bombillas LED son la opción más eficiente para iluminar tu hogar. Consumen hasta un 80% menos que las incandescentes y duran 25 veces más. Una bombilla LED de 10W equivale a una incandescente de 60W.',
      intro: 'Aunque una bombilla LED individual consume muy poco (entre 5W y 15W), el ahorro real se nota cuando sustituyes todas las de tu casa. Un hogar medio tiene entre 15 y 25 puntos de luz.',
      consumoMedio: {
        bajo: { watts: 5, descripcion: 'LED de ambiente o decorativa' },
        medio: { watts: 10, descripcion: 'LED estándar equivalente a 60W incandescente' },
        alto: { watts: 15, descripcion: 'LED de alta potencia para zonas de trabajo' }
      },
      comparativa: 'Una bombilla incandescente de 60W encendida 5 horas al día cuesta unos 13€/año. La LED equivalente de 10W cuesta solo 2,70€/año. Ahorro: 10€ por bombilla.',
      tips: [
        'Usa luz cálida (2700K) para salones y dormitorios, fría (4000K-5000K) para cocina y baño.',
        'Aprovecha la luz natural colocando espejos estratégicamente.',
        'Instala sensores de movimiento en pasillos y escaleras.',
        'Las bombillas LED regulables permiten ajustar la intensidad y ahorrar más.',
        'Sustituye primero las bombillas que más horas están encendidas.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume una bombilla LED de 10W al mes?',
          answer: 'Una bombilla LED de 10W encendida 5 horas diarias consume 1,5 kWh al mes, lo que equivale a unos 0,22€ mensuales con el precio medio de la luz.'
        },
        {
          question: '¿Merece la pena cambiar a LED si aún funcionan mis bombillas antiguas?',
          answer: 'Sí. El ahorro es tan significativo (80% menos consumo) que la inversión se amortiza en pocos meses, especialmente en bombillas que usas muchas horas al día.'
        },
        {
          question: '¿Las bombillas LED gastan en standby?',
          answer: 'No, las bombillas LED no tienen consumo en standby. Solo consumen cuando están encendidas.'
        }
      ],
      relacionados: ['televisor', 'pc-gaming', 'ordenador-portatil']
    }
  },
  {
    value: 150, label: 'Portátil', watts: '150W', icon: 'Laptop', slug: 'ordenador-portatil',
    seo: {
      title: 'Cuánto consume un ordenador portátil en euros',
      metaDescription: 'Calcula el consumo eléctrico de tu portátil. Descubre cuánto gasta cargando, en uso normal y en tareas intensivas como edición de vídeo.',
      description: 'El consumo de un portátil varía enormemente según el uso: navegar consume 30-50W, trabajo ofimático 50-80W, y tareas intensivas como renderizado pueden alcanzar los 150W o más.',
      intro: 'Los portátiles son mucho más eficientes que los ordenadores de sobremesa. Un portátil medio consume entre 30W y 90W, mientras que un PC de torre puede superar los 300W fácilmente.',
      consumoMedio: {
        bajo: { watts: 30, descripcion: 'Navegación web, email, documentos' },
        medio: { watts: 65, descripcion: 'Trabajo ofimático, videollamadas' },
        alto: { watts: 150, descripcion: 'Edición de vídeo, gaming, renderizado' }
      },
      comparativa: 'Un portátil usado 8 horas al día en modo trabajo normal (65W) cuesta unos 2,80€ al mes. El mismo uso en un PC de sobremesa (200W) costaría 8,60€.',
      tips: [
        'Desconecta el cargador cuando la batería esté al 100% para prolongar su vida útil.',
        'Baja el brillo de la pantalla: cada 10% menos supone un ahorro del 3-5%.',
        'Cierra aplicaciones y pestañas en segundo plano que consumen recursos.',
        'Usa el modo de ahorro de energía cuando trabajes con batería.',
        'El modo suspensión consume menos de 1W, úsalo en pausas cortas.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta cargar un portátil completamente?',
          answer: 'Cargar un portátil con batería de 60Wh cuesta aproximadamente 0,01€ (menos de un céntimo). Incluso cargándolo a diario, el coste mensual no supera los 0,30€.'
        },
        {
          question: '¿El portátil consume más enchufado que con batería?',
          answer: 'Sí, ligeramente. Enchufado puede consumir hasta un 10-15% más porque mantiene la batería cargada. Sin embargo, la diferencia económica es mínima.'
        },
        {
          question: '¿Cuánto consume un portátil en standby?',
          answer: 'En standby o suspensión, un portátil consume entre 0,5W y 2W. Apagado pero enchufado, prácticamente 0W.'
        }
      ],
      relacionados: ['pc-gaming', 'televisor', 'bombilla-led']
    }
  },
  {
    value: 450, label: 'PC Gaming', watts: '450W', icon: 'MonitorPlay', slug: 'pc-gaming',
    seo: {
      title: 'Cuánto consume un PC Gaming en euros',
      metaDescription: 'Calcula el consumo real de tu PC Gaming. Descubre cuánto gasta tu tarjeta gráfica, procesador y monitor gaming en tu factura de la luz.',
      description: 'Un PC Gaming es uno de los mayores consumidores de electricidad del hogar. La tarjeta gráfica puede consumir entre 150W y 450W ella sola, sumado al procesador (65-125W) y periféricos.',
      intro: 'El consumo de un PC Gaming varía drásticamente según el juego y la configuración gráfica. En idle consume 80-120W, pero jugando a máxima calidad puede superar los 500-600W con tarjetas de gama alta.',
      consumoMedio: {
        bajo: { watts: 100, descripcion: 'Idle o navegación web' },
        medio: { watts: 350, descripcion: 'Gaming a 1080p calidad media' },
        alto: { watts: 550, descripcion: 'Gaming 4K calidad ultra + streaming' }
      },
      comparativa: 'Una sesión de gaming de 4 horas diarias con un PC de 400W cuesta unos 7,20€ al mes. Añadiendo el monitor gaming (40W), serían 7,90€ mensuales.',
      tips: [
        'Limita los FPS a 60 o 120 en juegos que no requieran máximo rendimiento.',
        'Activa V-Sync o limitadores de frames para reducir carga de la GPU.',
        'Configura el modo suspensión para que salte a los 5 minutos de inactividad.',
        'Apaga completamente el PC cuando no lo uses, el standby de una PSU puede ser 5-10W.',
        'Considera undervolting de la GPU: mismo rendimiento con menos consumo y calor.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume una RTX 4070 jugando?',
          answer: 'Una RTX 4070 tiene un TDP de 200W, pero en juegos exigentes puede consumir entre 180W y 220W. Sumando el resto del sistema, el consumo total ronda los 350-400W.'
        },
        {
          question: '¿El monitor gaming consume mucho?',
          answer: 'Un monitor gaming de 27" a 144Hz consume entre 30W y 50W. Los modelos OLED o ultrawide pueden llegar a 70-80W.'
        },
        {
          question: '¿Merece la pena una fuente de alimentación eficiente?',
          answer: 'Sí. Una fuente 80 Plus Gold tiene un 90% de eficiencia vs 80% de una básica. En un PC de 400W usado 4h/día, ahorras unos 1,50€/mes.'
        }
      ],
      relacionados: ['ordenador-portatil', 'televisor', 'aire-acondicionado']
    }
  },

  // --- SALÓN ---
  {
    value: 300, label: 'Televisor 50"', watts: '300W', icon: 'Tv', slug: 'televisor',
    seo: {
      title: 'Cuánto consume un televisor en euros',
      metaDescription: 'Calcula el consumo de tu TV según tamaño y tecnología. Descubre cuánto gasta una TV LED, OLED o QLED y cómo reducir el consumo.',
      description: 'El consumo de un televisor depende de su tamaño, tecnología y brillo. Una TV LED de 50" consume entre 70W y 120W, mientras que una OLED del mismo tamaño puede variar entre 80W y 200W según el contenido.',
      intro: 'Las pantallas modernas son mucho más eficientes que las antiguas de plasma o CRT. Sin embargo, el aumento de tamaño y funciones HDR ha incrementado el consumo medio. El modo Eco puede reducirlo un 30-40%.',
      consumoMedio: {
        bajo: { watts: 60, descripcion: 'TV 32" LED modo eco' },
        medio: { watts: 120, descripcion: 'TV 50-55" LED/QLED uso normal' },
        alto: { watts: 200, descripcion: 'TV 65"+ OLED con HDR activado' }
      },
      comparativa: 'Ver la TV 4 horas al día con un televisor de 100W cuesta unos 1,80€ al mes. El standby añade 0,20-0,50€ extra si no lo desconectas completamente.',
      tips: [
        'Desactiva el modo "Tienda" o "Vívido", usa el modo "Eco" o "Cine".',
        'Reduce el brillo de la retroiluminación, especialmente de noche.',
        'No uses la TV de ruido de fondo si no la estás mirando.',
        'Desactiva el sensor de ambiente si prefieres brillo constante bajo.',
        'El standby moderno consume poco (0,5W), pero desenchufar ahorra ese mínimo.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume una Smart TV en standby?',
          answer: 'Las Smart TV modernas consumen entre 0,3W y 1W en standby. Algunas con funciones de voz siempre activas pueden llegar a 2-3W.'
        },
        {
          question: '¿OLED consume más que LED?',
          answer: 'Depende del contenido. En escenas oscuras, OLED consume menos porque los píxeles negros están apagados. En escenas muy brillantes, puede consumir más que LED.'
        },
        {
          question: '¿Influye la resolución 4K en el consumo?',
          answer: 'La resolución en sí no afecta significativamente al consumo. Lo que más influye es el tamaño de pantalla, el brillo y la tecnología del panel.'
        }
      ],
      relacionados: ['pc-gaming', 'bombilla-led', 'aire-acondicionado']
    }
  },
  {
    value: 60, label: 'Ventilador', watts: '60W', icon: 'Fan', slug: 'ventilador',
    seo: {
      title: 'Cuánto consume un ventilador en euros',
      metaDescription: 'Calcula el consumo de tu ventilador de pie, techo o torre. Descubre por qué es hasta 15 veces más barato que el aire acondicionado.',
      description: 'El ventilador es el electrodoméstico más eficiente para combatir el calor. Un ventilador de pie consume entre 40W y 70W, mientras que un aire acondicionado consume 900W-2000W. La diferencia en la factura es enorme.',
      intro: 'Aunque el ventilador no enfría el aire (solo lo mueve), la sensación térmica puede bajar 3-4ºC gracias a la evaporación del sudor. Es ideal para noches de verano o combinado con aire acondicionado.',
      consumoMedio: {
        bajo: { watts: 25, descripcion: 'Ventilador de mesa o USB' },
        medio: { watts: 50, descripcion: 'Ventilador de pie velocidad media' },
        alto: { watts: 75, descripcion: 'Ventilador de techo o torre potente' }
      },
      comparativa: 'Usar un ventilador 8 horas al día durante todo el verano (3 meses) cuesta unos 5,40€. El mismo uso con aire acondicionado costaría 80-120€.',
      tips: [
        'Combínalo con aire acondicionado para subir el termostato 2-3ºC y ahorrar.',
        'Colócalo para que el aire circule por toda la habitación, no directamente hacia ti.',
        'Limpia las aspas regularmente: la suciedad reduce la eficiencia.',
        'Apágalo si no hay nadie en la habitación (no baja la temperatura real).',
        'Los ventiladores de techo son más eficientes y silenciosos que los de pie.'
      ],
      faqs: [
        {
          question: '¿El ventilador enfría la habitación?',
          answer: 'No, el ventilador no baja la temperatura del aire. Mueve el aire, lo que acelera la evaporación del sudor y produce sensación de frescor. Por eso no tiene sentido dejarlo encendido sin personas.'
        },
        {
          question: '¿Cuánto cuesta tener un ventilador encendido toda la noche?',
          answer: 'Un ventilador de 50W encendido 8 horas cuesta aproximadamente 0,06€ (6 céntimos). Al mes serían unos 1,80€.'
        },
        {
          question: '¿Ventilador de techo o de pie?',
          answer: 'El de techo es más eficiente (consume menos para mover más aire), más silencioso y no ocupa espacio. El de pie es más versátil y barato de instalar.'
        }
      ],
      relacionados: ['aire-acondicionado', 'radiador', 'calefactor']
    }
  },

  // --- COCINA ---
  {
    value: 250, label: 'Nevera', watts: '250W', icon: 'Refrigerator', slug: 'nevera',
    seo: {
      title: 'Cuánto consume una nevera al mes en euros',
      metaDescription: 'Calcula el consumo real de tu nevera o frigorífico. Descubre cuánto gasta al mes, cómo influye la eficiencia energética y trucos para ahorrar.',
      description: 'La nevera representa hasta el 30% de la factura eléctrica porque funciona 24 horas al día, 365 días al año. Un frigorífico clase A consume unos 150 kWh/año, mientras que uno clase F puede superar los 400 kWh/año.',
      intro: 'Aunque la potencia nominal puede ser 150-300W, la nevera no consume eso constantemente. El compresor se enciende y apaga según necesite enfriar. El consumo real medio es de 30-50W continuos.',
      consumoMedio: {
        bajo: { watts: 100, descripcion: 'Frigorífico pequeño clase A' },
        medio: { watts: 150, descripcion: 'Combi estándar clase E' },
        alto: { watts: 250, descripcion: 'Frigorífico americano o antiguo' }
      },
      comparativa: 'Una nevera clase A de 150 kWh/año cuesta unos 22€ anuales. Una clase F de 350 kWh/año cuesta 52€. Cambiar a una eficiente ahorra 30€/año.',
      tips: [
        'Mantén la temperatura a 4-5ºC en el frigorífico y -18ºC en el congelador.',
        'No metas comida caliente: deja que se enfríe a temperatura ambiente.',
        'Limpia la rejilla trasera (condensador) una vez al año.',
        'Comprueba que las gomas de las puertas cierran bien.',
        'Descongela el congelador si tiene más de 5mm de hielo.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume una nevera al mes?',
          answer: 'Una nevera moderna clase A consume entre 10 y 15 kWh al mes (1,50€-2,25€). Un modelo antiguo o poco eficiente puede consumir 25-35 kWh (3,75€-5,25€).'
        },
        {
          question: '¿Merece la pena cambiar una nevera antigua?',
          answer: 'Sí, si tiene más de 10 años. Las neveras modernas consumen un 50-70% menos. El ahorro anual (30-50€) amortiza parte del coste.'
        },
        {
          question: '¿Afecta abrir mucho la puerta al consumo?',
          answer: 'Sí, cada vez que abres la puerta entra aire caliente y el compresor debe trabajar más. Intenta decidir qué coger antes de abrir.'
        }
      ],
      relacionados: ['microondas', 'lavavajillas', 'horno']
    }
  },
  {
    value: 1500, label: 'Freidora de Aire', watts: '1.500W', icon: 'Utensils', slug: 'freidora-aire',
    seo: {
      title: 'Cuánto consume una freidora de aire (Air Fryer)',
      metaDescription: 'Calcula el consumo de tu Air Fryer. Descubre si realmente ahorra comparado con el horno tradicional y cuánto cuesta cada uso.',
      description: 'Aunque la freidora de aire tiene mucha potencia (1200-1800W), ahorra dinero porque cocina mucho más rápido que un horno convencional y no requiere precalentamiento largo.',
      intro: 'Una Air Fryer de 1500W parece consumir mucho, pero como cocina en 10-20 minutos (vs 30-60 del horno), el consumo total por uso es menor. Además, no necesita precalentar durante 10-15 minutos.',
      consumoMedio: {
        bajo: { watts: 1000, descripcion: 'Air Fryer pequeña (2-3L)' },
        medio: { watts: 1500, descripcion: 'Air Fryer mediana (4-5L)' },
        alto: { watts: 1800, descripcion: 'Air Fryer grande o doble (6L+)' }
      },
      comparativa: 'Cocinar patatas: Air Fryer 20 min = 0,075€. Horno convencional 45 min (con precalentamiento) = 0,14€. Ahorro del 46% por uso.',
      tips: [
        'No la abras constantemente para mirar: pierdes calor y alarga el tiempo.',
        'Aprovecha el calor residual apagándola 2 minutos antes de terminar.',
        'No sobrecargues la cesta: el aire debe circular para cocinar bien.',
        'Precalienta solo 2-3 minutos si la receta lo requiere.',
        'Limpia después de cada uso: la grasa acumulada reduce la eficiencia.'
      ],
      faqs: [
        {
          question: '¿La freidora de aire consume mucho?',
          answer: 'Tiene potencia alta (1200-1800W), pero como cocina rápido, el consumo total es bajo. Cocinar durante 15 minutos con una de 1500W cuesta unos 0,05€.'
        },
        {
          question: '¿Es más barata que el horno?',
          answer: 'Sí, para porciones pequeñas/medianas. Para cocinar para 4+ personas o platos grandes, el horno puede ser más eficiente.'
        },
        {
          question: '¿Cuánto ahorro al mes usando Air Fryer en vez de horno?',
          answer: 'Si cocinas a diario, puedes ahorrar 5-8€ al mes sustituyendo el horno por la Air Fryer en cocciones pequeñas.'
        }
      ],
      relacionados: ['horno', 'microondas', 'vitroceramica']
    }
  },
  {
    value: 1800, label: 'Vitrocerámica', watts: '1.800W', icon: 'CookingPot', slug: 'vitroceramica',
    seo: {
      title: 'Cuánto consume una vitrocerámica en euros',
      metaDescription: 'Calcula el consumo de tu vitrocerámica o placa de inducción. Compara el gasto entre ambas tecnologías y descubre cuál ahorra más.',
      description: 'La vitrocerámica tradicional (resistencia) es menos eficiente que la inducción. Una vitro convencional aprovecha el 50-60% de la energía, mientras que la inducción alcanza el 85-90%.',
      intro: 'El consumo depende del tipo de placa, el tamaño del fuego y el tiempo de cocción. Una placa de inducción de 2000W calienta agua en la mitad de tiempo que una vitrocerámica de la misma potencia.',
      consumoMedio: {
        bajo: { watts: 1200, descripcion: 'Un fuego pequeño a potencia media' },
        medio: { watts: 1800, descripcion: 'Dos fuegos a potencia media' },
        alto: { watts: 3500, descripcion: 'Fuegos grandes a máxima potencia' }
      },
      comparativa: 'Hervir 1 litro de agua: Vitrocerámica = 0,04€ (8 min). Inducción = 0,025€ (4 min). La inducción es un 40% más eficiente.',
      tips: [
        'Usa tapas en las ollas: cocinas hasta 3 veces más rápido.',
        'Apaga el fuego 5 minutos antes y aprovecha el calor residual.',
        'Usa sartenes y ollas con fondo plano del mismo tamaño que el fuego.',
        'La inducción solo calienta si hay recipiente: no gasta sin olla.',
        'Descongela alimentos en la nevera, no cocinando desde congelado.'
      ],
      faqs: [
        {
          question: '¿Qué consume más, vitrocerámica o inducción?',
          answer: 'La vitrocerámica consume más para el mismo resultado. La inducción es un 30-40% más eficiente porque calienta directamente el recipiente, sin pérdidas en calentar la placa.'
        },
        {
          question: '¿Cuánto cuesta cocinar una comida?',
          answer: 'Una comida completa (30-40 min de cocción a potencia media) cuesta entre 0,10€ y 0,15€ en vitrocerámica, y 0,06€-0,10€ en inducción.'
        },
        {
          question: '¿Merece la pena cambiar a inducción?',
          answer: 'Si cocinas a diario, el ahorro es de 8-15€/mes. La inversión (400-800€) se amortiza en 3-5 años, además de ganar en seguridad y rapidez.'
        }
      ],
      relacionados: ['horno', 'microondas', 'freidora-aire']
    }
  },
  {
    value: 800, label: 'Microondas', watts: '800W', icon: 'Microwave', slug: 'microondas',
    seo: {
      title: 'Cuánto consume un microondas en euros',
      metaDescription: 'Calcula el consumo de tu microondas. Descubre por qué es el método más eficiente para calentar comida y cuánto cuesta cada uso.',
      description: 'El microondas es el electrodoméstico más eficiente para calentar comida. Calienta directamente las moléculas de agua del alimento, sin desperdiciar energía en calentar el aire o el recipiente.',
      intro: 'Un microondas de 800W consume menos que su potencia nominal porque no funciona al 100% constantemente. Para calentar un plato de comida (2-3 min), el coste es de apenas 0,005-0,01€.',
      consumoMedio: {
        bajo: { watts: 600, descripcion: 'Microondas básico o modo descongelar' },
        medio: { watts: 800, descripcion: 'Microondas estándar potencia media-alta' },
        alto: { watts: 1200, descripcion: 'Microondas con grill o función horno' }
      },
      comparativa: 'Calentar un plato: Microondas 3 min = 0,006€. Horno 15 min = 0,045€. El microondas es 7 veces más barato para esta tarea.',
      tips: [
        'Corta los alimentos en trozos pequeños para que calienten más rápido.',
        'Cubre la comida con tapa para evitar salpicaduras y calentar mejor.',
        'Mantenlo limpio: la suciedad absorbe ondas y reduce la eficiencia.',
        'Desenchúfalo si tiene reloj digital y no lo usas (consume 2-4W en standby).',
        'Usa recipientes aptos para microondas, no metálicos.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume el microondas en standby?',
          answer: 'Un microondas con reloj digital consume 2-4W en standby, lo que supone 1,50-3€ al año. Desenchufarlo ahorra ese pequeño gasto.'
        },
        {
          question: '¿Es malo para la salud usar mucho el microondas?',
          answer: 'No, el microondas es seguro. Las microondas calientan el agua de los alimentos, no los "irradian" de forma perjudicial. La OMS lo confirma.'
        },
        {
          question: '¿Qué es más eficiente, microondas u olla?',
          answer: 'Para calentar, el microondas. Para cocinar desde cero, depende: el microondas es mejor para pequeñas cantidades, la olla para grandes volúmenes.'
        }
      ],
      relacionados: ['horno', 'vitroceramica', 'nevera']
    }
  },
  {
    value: 1200, label: 'Horno', watts: '1.200W', icon: 'Heater', slug: 'horno',
    seo: {
      title: 'Cuánto consume un horno eléctrico en euros',
      metaDescription: 'Calcula el consumo de tu horno eléctrico. Descubre cuánto cuesta cada horneado, cómo influye la eficiencia energética y trucos para ahorrar.',
      description: 'El horno es uno de los electrodomésticos que más consume por uso. Un horno eléctrico estándar consume entre 2000W y 3500W a máxima potencia, aunque una vez alcanzada la temperatura, el consumo baja.',
      intro: 'Cada vez que abres la puerta del horno, pierdes el 20% del calor acumulado. El horno debe trabajar al máximo para recuperar la temperatura, lo que dispara el consumo. Usa la luz interior para ver.',
      consumoMedio: {
        bajo: { watts: 1000, descripcion: 'Horno pequeño o función solo inferior' },
        medio: { watts: 2000, descripcion: 'Horno estándar temperatura media' },
        alto: { watts: 3500, descripcion: 'Horno grande a máxima potencia o grill' }
      },
      comparativa: 'Hornear durante 1 hora a 180ºC cuesta aproximadamente 0,30-0,40€. Con horno de clase A, puede bajar a 0,20-0,25€.',
      tips: [
        'Cocina varios platos a la vez (Batch Cooking) para aprovechar el calentamiento.',
        'No precalientes para cocciones largas superiores a 1 hora.',
        'Apaga el horno 10 minutos antes y aprovecha el calor residual.',
        'Verifica que la goma de la puerta cierra herméticamente.',
        'Usa el ventilador/convección: cocina más rápido y a menor temperatura.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta usar el horno 1 hora?',
          answer: 'Depende de la temperatura y el modelo. A 180ºC, un horno de 2000W de media cuesta unos 0,30€ la hora. A 250ºC puede subir a 0,40-0,50€.'
        },
        {
          question: '¿Es más barato el horno de gas?',
          answer: 'Generalmente sí, el gas es más barato por kWh térmico. Pero el horno eléctrico es más preciso y fácil de limpiar.'
        },
        {
          question: '¿Precalentar gasta mucho?',
          answer: 'Precalentar 10-15 minutos puede costar 0,05-0,10€. Para cocciones cortas es necesario, pero para asados largos puedes meter la comida en frío.'
        }
      ],
      relacionados: ['vitroceramica', 'microondas', 'freidora-aire']
    }
  },
  {
    value: 1800, label: 'Lavavajillas', watts: '1.800W', icon: 'Droplets', slug: 'lavavajillas',
    seo: {
      title: 'Cuánto consume un lavavajillas en euros',
      metaDescription: 'Calcula el consumo de tu lavavajillas. Descubre cuánto cuesta cada lavado, qué programa ahorra más y si es más barato que fregar a mano.',
      description: 'El lavavajillas consume menos agua y energía que fregar a mano con agua caliente. Un ciclo eco usa 10-12 litros de agua, mientras que fregar a mano puede gastar 40-60 litros.',
      intro: 'El mayor consumo del lavavajillas se produce al calentar el agua. Por eso el programa Eco, aunque dura más, consume menos: calienta el agua más despacio y a menor temperatura.',
      consumoMedio: {
        bajo: { watts: 0.8, descripcion: 'Programa Eco (kWh por ciclo)' },
        medio: { watts: 1.2, descripcion: 'Programa Normal' },
        alto: { watts: 1.8, descripcion: 'Programa Intensivo o rápido' }
      },
      comparativa: 'Un lavado en modo Eco cuesta unos 0,12€ de electricidad + 0,03€ de agua = 0,15€ total. Fregar a mano con agua caliente puede costar 0,25-0,40€.',
      tips: [
        'Usa siempre el modo ECO: tarda más pero ahorra hasta un 30% de energía.',
        'Espera a tener el lavavajillas lleno antes de ponerlo.',
        'Limpia el filtro regularmente para mantener la eficiencia.',
        'Coloca bien los platos para que el agua llegue a todas las superficies.',
        'No enjuagues los platos antes: el lavavajillas está diseñado para restos.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta un lavado de lavavajillas?',
          answer: 'Un ciclo Eco cuesta 0,10-0,15€ (electricidad + agua). Un ciclo intensivo puede costar 0,20-0,25€. Fregar a mano con agua caliente cuesta 0,25-0,40€.'
        },
        {
          question: '¿Es más barato que fregar a mano?',
          answer: 'Sí, si comparas con fregar usando agua caliente del grifo. El lavavajillas usa menos agua y la calienta de forma más eficiente.'
        },
        {
          question: '¿Por qué el programa Eco dura tanto?',
          answer: 'Porque calienta el agua lentamente y usa menos cantidad. El resultado de limpieza es igual, pero el consumo es un 25-30% menor.'
        }
      ],
      relacionados: ['lavadora', 'nevera', 'horno']
    }
  },

  // --- LIMPIEZA Y HOGAR ---
  {
    value: 2000, label: 'Lavadora', watts: '2.000W', icon: 'WashingMachine', slug: 'lavadora',
    seo: {
      title: 'Cuánto consume una lavadora en euros',
      metaDescription: 'Calcula el consumo de tu lavadora. Descubre cuánto cuesta cada lavado a 30ºC, 40ºC y 60ºC, y cómo ahorrar hasta un 90%.',
      description: 'El 90% del consumo de la lavadora se usa para calentar el agua. Lavar a 30ºC consume hasta 5 veces menos que a 60ºC. Para ropa sin manchas difíciles, el agua fría limpia igual de bien.',
      intro: 'Una lavadora de 2000W no consume esa potencia todo el ciclo. En un lavado a 30ºC consume unos 0,3 kWh, mientras que a 60ºC puede llegar a 1,5 kWh. La diferencia en euros: 0,05€ vs 0,22€ por lavado.',
      consumoMedio: {
        bajo: { watts: 0.3, descripcion: 'Lavado en frío o 30ºC (kWh)' },
        medio: { watts: 0.7, descripcion: 'Lavado a 40ºC' },
        alto: { watts: 1.5, descripcion: 'Lavado a 60ºC o más' }
      },
      comparativa: '4 lavados semanales a 30ºC cuestan 0,72€/mes. Los mismos 4 lavados a 60ºC cuestan 3,50€/mes. Ahorro anual: 33€ solo bajando la temperatura.',
      tips: [
        'Lava a 30ºC o en frío siempre que la ropa no tenga manchas difíciles.',
        'Usa programas cortos si la ropa no está muy sucia.',
        'Llena la lavadora pero sin sobrecargar (deja un puño de espacio arriba).',
        'Centrifuga a altas RPM para que la secadora gaste menos después.',
        'Programa los lavados en horario valle (00:00-08:00) si tienes PVPC.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta un lavado de lavadora?',
          answer: 'Un lavado a 30ºC cuesta unos 0,05€. A 40ºC sube a 0,10-0,12€. A 60ºC puede costar 0,20-0,25€. La temperatura es el factor clave.'
        },
        {
          question: '¿El agua fría limpia bien?',
          answer: 'Sí, los detergentes modernos están formulados para funcionar a bajas temperaturas. Solo necesitas agua caliente para manchas de grasa muy difíciles o ropa interior.'
        },
        {
          question: '¿Influye la carga en el consumo?',
          answer: 'Sí, pero no proporcionalmente. Un lavado con media carga consume el 60-70% que uno lleno. Es más eficiente llenar la lavadora.'
        }
      ],
      relacionados: ['secadora', 'lavavajillas', 'termo-electrico']
    }
  },
  {
    value: 2500, label: 'Secadora', watts: '2.500W', icon: 'Shirt', slug: 'secadora',
    seo: {
      title: 'Cuánto consume una secadora en euros',
      metaDescription: 'Calcula el consumo de tu secadora. Compara secadoras de bomba de calor vs condensación y descubre cuánto puedes ahorrar.',
      description: 'La secadora es uno de los electrodomésticos que más consume. Una secadora de condensación usa 4-5 kWh por ciclo, mientras que una de bomba de calor usa solo 1,5-2 kWh.',
      intro: 'Las secadoras de bomba de calor son el doble de caras, pero consumen menos de la mitad. Si usas la secadora 3+ veces por semana, la bomba de calor se amortiza en 2-3 años.',
      consumoMedio: {
        bajo: { watts: 1.5, descripcion: 'Bomba de calor clase A++ (kWh/ciclo)' },
        medio: { watts: 3, descripcion: 'Condensación clase B' },
        alto: { watts: 5, descripcion: 'Evacuación o condensación antigua' }
      },
      comparativa: 'Secar 3 veces/semana con secadora de condensación: 9€/mes. Con bomba de calor: 3,50€/mes. Ahorro anual: 66€.',
      tips: [
        'Limpia el filtro de pelusas después de CADA uso (vital para eficiencia).',
        'Introduce la ropa bien centrifugada: menos humedad = menos tiempo.',
        'Separa tejidos pesados de los ligeros para un secado uniforme.',
        'No sobrecargues: el aire debe circular libremente.',
        'Usa sensores de humedad si tu secadora los tiene, no seques de más.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta cada uso de la secadora?',
          answer: 'Una secadora de condensación cuesta 0,45-0,75€ por ciclo. Una de bomba de calor cuesta 0,20-0,30€. La diferencia es muy significativa.'
        },
        {
          question: '¿Qué es mejor, condensación o bomba de calor?',
          answer: 'Bomba de calor sin duda, si puedes permitirte el precio inicial (400-600€ más cara). Consume un 50-60% menos y trata mejor la ropa.'
        },
        {
          question: '¿Por qué hay que limpiar el filtro siempre?',
          answer: 'Un filtro sucio bloquea el flujo de aire. La secadora tarda más y consume más para el mismo resultado. También puede sobrecalentarse.'
        }
      ],
      relacionados: ['lavadora', 'termo-electrico', 'radiador']
    }
  },

  // --- CLIMATIZACIÓN ---
  {
    value: 900, label: 'Aire acondicionado', watts: '900W', icon: 'AirVent', slug: 'aire-acondicionado',
    seo: {
      title: 'Cuánto consume un aire acondicionado en euros',
      metaDescription: 'Calcula el consumo de tu aire acondicionado. Descubre cuánto gasta por hora, cómo influye la eficiencia y trucos para reducir la factura.',
      description: 'Por cada grado que bajas la temperatura del aire acondicionado, el consumo sube aproximadamente un 8%. Mantener 25ºC en vez de 22ºC puede reducir la factura un 25%.',
      intro: 'Un aire acondicionado Inverter de clase A consume unos 700-1000W para enfriar una habitación de 20m². Un modelo antiguo sin Inverter puede consumir 2000-3000W para el mismo resultado.',
      consumoMedio: {
        bajo: { watts: 500, descripcion: 'Split Inverter A++ en mantenimiento' },
        medio: { watts: 1000, descripcion: 'Split Inverter A+ enfriando activamente' },
        alto: { watts: 2500, descripcion: 'Aire acondicionado antiguo sin Inverter' }
      },
      comparativa: 'Usar el aire 8h/día durante 3 meses de verano: Inverter A++ = 90€. Modelo antiguo = 250€. Ahorro: 160€/verano.',
      tips: [
        'Mantén la temperatura entre 24ºC y 26ºC en verano, no bajes de 22ºC.',
        'Usa el modo "Dry" (deshumidificador) en días húmedos pero no extremadamente calurosos.',
        'Cierra persianas y cortinas en las horas centrales del día.',
        'Limpia los filtros cada 2 semanas en temporada de uso.',
        'No enciendas y apagues constantemente: el arranque es lo que más consume.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta tener el aire acondicionado 8 horas?',
          answer: 'Un aire Inverter de 1000W (consumo medio real 500-700W) cuesta 0,50-0,80€ por 8 horas. Un modelo antiguo puede costar 2-3€.'
        },
        {
          question: '¿Qué es un aire acondicionado Inverter?',
          answer: 'El compresor Inverter ajusta su velocidad según la demanda, en vez de encenderse/apagarse. Consume 30-50% menos y mantiene temperatura más estable.'
        },
        {
          question: '¿Es mejor dejarlo encendido o apagarlo al salir?',
          answer: 'Si sales más de 2-3 horas, apágalo. Si es menos, sube la temperatura 2-3ºC pero déjalo encendido. El arranque consume mucho.'
        }
      ],
      relacionados: ['ventilador', 'radiador', 'calefactor']
    }
  },
  {
    value: 2000, label: 'Radiador eléctrico', watts: '2.000W', icon: 'ThermometerSun', slug: 'radiador',
    seo: {
      title: 'Cuánto consume un radiador eléctrico en euros',
      metaDescription: 'Calcula el consumo de tu radiador eléctrico. Descubre cuánto gasta un radiador de aceite, emisor térmico o convector y cómo ahorrar en calefacción.',
      description: 'La calefacción eléctrica directa es la más cara por kWh térmico producido. Un radiador de 2000W encendido 8 horas diarias puede costar más de 70€ al mes.',
      intro: 'Los radiadores eléctricos convierten el 100% de la electricidad en calor, pero la electricidad es cara. Una bomba de calor (aire acondicionado en modo calor) produce 3-4 kWh de calor por cada 1 kWh eléctrico.',
      consumoMedio: {
        bajo: { watts: 1000, descripcion: 'Radiador pequeño o a media potencia' },
        medio: { watts: 1500, descripcion: 'Radiador mediano uso normal' },
        alto: { watts: 2500, descripcion: 'Radiador grande a máxima potencia' }
      },
      comparativa: 'Calentar una habitación 8h/día: Radiador 2000W = 72€/mes. Bomba de calor = 24€/mes. Ahorro: 48€/mes.',
      tips: [
        'No cubras nunca el radiador con ropa húmeda (peligro y pérdida de eficiencia).',
        'Usa paneles reflectantes detrás del radiador para proyectar el calor a la sala.',
        'Aisla ventanas y puertas: un buen aislamiento ahorra más que cambiar de radiador.',
        'Usa un termostato para que no caliente más de lo necesario.',
        'Considera una bomba de calor si usas calefacción eléctrica muchas horas.'
      ],
      faqs: [
        {
          question: '¿Cuánto cuesta tener un radiador de 2000W encendido?',
          answer: 'A precio medio (0,15€/kWh), un radiador de 2000W cuesta 0,30€ por hora. Encendido 8 horas diarias: 2,40€/día o 72€/mes.'
        },
        {
          question: '¿Radiador de aceite o emisor térmico?',
          answer: 'El radiador de aceite mantiene el calor más tiempo tras apagarse. El emisor térmico calienta más rápido. En consumo son similares.'
        },
        {
          question: '¿Es la calefacción eléctrica la más cara?',
          answer: 'Sí, la calefacción por resistencia eléctrica es la más cara. El gas natural cuesta 3 veces menos por kWh térmico. Las bombas de calor son la opción eléctrica más eficiente.'
        }
      ],
      relacionados: ['calefactor', 'aire-acondicionado', 'termo-electrico']
    }
  },
  {
    value: 1500, label: 'Termo Eléctrico', watts: '1.500W', icon: 'Waves', slug: 'termo-electrico',
    seo: {
      title: 'Cuánto consume un termo eléctrico en euros',
      metaDescription: 'Calcula el consumo de tu termo eléctrico. Descubre cuánto gasta mantener el agua caliente y cómo programarlo para ahorrar.',
      description: 'Mantener agua caliente 24 horas es costoso. Un termo de 80 litros puede consumir 3-5 kWh al día solo para mantener la temperatura, aunque no uses agua.',
      intro: 'El termo eléctrico calienta el agua y la mantiene caliente constantemente. Si tienes tarifa con discriminación horaria (PVPC), programar el termo para que caliente solo en horas valle puede ahorrarte un 40%.',
      consumoMedio: {
        bajo: { watts: 2, descripcion: 'Termo bien aislado en mantenimiento (kWh/día)' },
        medio: { watts: 4, descripcion: 'Termo estándar uso normal' },
        alto: { watts: 7, descripcion: 'Termo antiguo o mal aislado' }
      },
      comparativa: 'Termo sin programar: 4 kWh/día = 18€/mes. Termo programado solo horas valle: 4 kWh/día a 0,06€ = 7€/mes. Ahorro: 11€/mes.',
      tips: [
        'Instala un temporizador para que caliente solo antes de las horas de uso.',
        'Baja la temperatura del termostato a 55-60ºC (suficiente y más seguro).',
        'Aísla el termo con una manta térmica si está en lugar frío.',
        'Considera un termo con modo "Smart" o "ECO" que aprende tus hábitos.',
        'Si tienes PVPC, programa el calentamiento entre 00:00 y 08:00.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume un termo eléctrico al mes?',
          answer: 'Un termo de 80L consume entre 90 y 150 kWh/mes dependiendo del uso y aislamiento. Eso supone 13-22€/mes a precio medio.'
        },
        {
          question: '¿Es mejor dejarlo siempre encendido o encenderlo antes de ducharse?',
          answer: 'Depende del aislamiento. Un termo moderno bien aislado es más eficiente siempre encendido. Uno antiguo pierde mucho calor y conviene programarlo.'
        },
        {
          question: '¿Qué temperatura debo poner en el termo?',
          answer: '55-60ºC es suficiente para uso doméstico, evita legionela y reduce el consumo. A más de 60ºC, el consumo sube mucho y el riesgo de quemaduras también.'
        }
      ],
      relacionados: ['lavadora', 'lavavajillas', 'radiador']
    }
  },
  {
    value: 1300, label: 'Calefactor eléctrico', watts: '1.300W', icon: 'Heater', slug: 'calefactor',
    seo: {
      title: 'Cuánto gasta un calefactor eléctrico en euros',
      metaDescription: 'Calcula el consumo de tu calefactor eléctrico de 1000W, 1500W o 2000W. Descubre cuánto cuesta por hora y al mes, con consejos de ahorro.',
      description: 'Los calefactores eléctricos son económicos de comprar pero caros de usar. Un calefactor de 2000W encendido 5 horas al día puede costarte más de 45€ al mes en invierno.',
      intro: 'Existen varios tipos de calefactores: de resistencia (los más comunes), cerámicos (calientan más rápido), halógenos (calor dirigido) e infrarrojos (calientan objetos, no aire). Todos consumen de forma similar para la misma potencia.',
      consumoMedio: {
        bajo: { watts: 1000, descripcion: 'Calefactor pequeño o potencia mínima' },
        medio: { watts: 1500, descripcion: 'Calefactor mediano potencia media' },
        alto: { watts: 2000, descripcion: 'Calefactor grande a máxima potencia' }
      },
      comparativa: 'Calefactor de 2000W usado 5h/día: 45€/mes. El mismo calor con bomba de calor (aire acondicionado): 15€/mes. Ahorro: 30€/mes.',
      tips: [
        'Usa un calefactor con termostato para que corte al alcanzar la temperatura.',
        'Los calefactores cerámicos calientan más rápido pero consumen igual.',
        'Para calentar solo a ti, un calefactor halógeno o infrarrojo es más eficiente.',
        'Cierra la puerta de la habitación para concentrar el calor.',
        'Nunca lo uses para secar ropa: es peligroso y poco eficiente.'
      ],
      faqs: [
        {
          question: '¿Cuánto consume un calefactor de 2000W por hora?',
          answer: 'Un calefactor de 2000W consume exactamente 2 kWh por hora, lo que cuesta unos 0,30€ a precio medio. En 5 horas: 1,50€.'
        },
        {
          question: '¿Qué calefactor consume menos?',
          answer: 'Todos los calefactores eléctricos del mismo vatiaje consumen igual. La diferencia está en cómo distribuyen el calor: los infrarrojos calientan directamente y pueden parecer más eficientes para una persona.'
        },
        {
          question: '¿Es mejor calefactor o radiador de aceite?',
          answer: 'El radiador de aceite mantiene el calor más tiempo tras apagarse, ideal para noches. El calefactor calienta más rápido pero el calor desaparece al apagarlo.'
        },
        {
          question: '¿Cuánto gasta un calefactor de 2000W al mes?',
          answer: 'Usado 5 horas al día, un calefactor de 2000W gasta unos 300 kWh/mes, lo que supone 45-50€ al mes según la tarifa.'
        }
      ],
      relacionados: ['radiador', 'aire-acondicionado', 'termo-electrico']
    }
  },

  // Custom
  { value: 'custom', label: 'Personalizado', watts: '', icon: 'Settings', image: '/images/personalizado.jpg' },
];


export const faqData = [
  {
    question: '¿Cómo calculo el consumo de un electrodoméstico?',
    answer: 'Multiplica la potencia en kW por las horas de uso. Ej.: 1,5 kW × 2 h = 3 kWh.'
  },
  {
    question: '¿Qué significa kWh?',
    answer: 'Es la unidad de energía: kilovatio (1 000 W) consumido en una hora.'
  },
  {
    question: '¿Cómo ahorro usando esta calculadora?',
    answer: 'Te ayuda a programar cargas en horas valle, donde el precio por kWh es más bajo.'
  },
  {
    question: '¿Incluye IVA el coste calculado?',
    answer: 'Sí, todos los precios muestran el total con IVA al 21 %.'
  },
  {
    question: 'Cómo saber cuánto consume mi electrodoméstico en 3 pasos:',
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
    answer: 'Consulta las ofertas de distintas comercializadoras, compara el término de consumo (€ / kWh) y revisa posibles descuentos o bonos adicionales.'
  },
  {
    question: '¿Qué componentes forman el precio final de la luz?',
    answer: '<ul><li><strong>Coste mayorista:</strong> precio base del kWh.</li><li><strong>Peajes de acceso:</strong> coste de transporte y distribución.</li><li><strong>Impuestos:</strong> IVA e impuestos especiales.</li></ul>'
  },
  {
    question: '¿Existe algo así como "luz gratis" en ciertos períodos?',
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