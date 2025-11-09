export const navigation = [
  { title: 'Calculadora', url: '/', onlyTips: false },
  { title: 'Precio luz hoy', url: '/precio-luz-hoy' },
  { title: 'Tips & Guías', url: '/tipsyguias' },
];


export const appliances = [
  { value: 50, label: 'Bombilla LED', watts: '50W', image: '/images/bombilla.jpg' },
  { value: 150, label: 'Portátil', watts: '150W', image: '/images/laptop.jpg' },
  { value: 300, label: 'Televisor 50"', watts: '300W', image: '/images/tv.jpg' },
  { value: 800, label: 'Microondas', watts: '800W', image: '/images/microwave.jpg' },
  { value: 900, label: 'Aire acondicionado', watts: '900W', image: '/images/aire-acondicionado.jpg' },
  { value: 1200, label: 'Horno', watts: '1.200W', image: '/images/horno.jpg' },
  { value: 1200, label: 'Secador de pelo', watts: '1.200W', image: '/images/hair-dryer.jpg' },
  { value: 1800, label: 'Lavaplatos', watts: '1.800W', image: '/images/lavaplatos.jpg' },
  { value: 2000, label: 'Lavadora', watts: '2.000W', image: '/images/washing-machine.jpg' },
  { value: 2000, label: 'Radiador eléctrico', watts: '2.000W', image: '/images/radiador-electrico.jpg' },
  { value: 'custom', label: 'Personalizado', watts: '', image: '/images/personalizado.jpg' },
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
