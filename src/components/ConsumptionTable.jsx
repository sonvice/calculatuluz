// src/components/ConsumptionTable.jsx
import Table from "./Table";

const columns = [
  {
    accessorKey: "tiempo",
    header: "Tiempo de uso",
  },
  {
    accessorKey: "consumo",
    header: "Consumo (kWh)",
  },
  {
    accessorKey: "coste",
    header: "Coste estimado*",
    cell: ({ getValue }) => (
      <span style={{ fontWeight: 700, color: "var(--accent-400)" }}>
        {getValue()}
      </span>
    ),
  },
];

export default function ConsumptionTable({ powerWatts, pricePerKwh = 0.15 }) {
  const kwhHora = powerWatts / 1000;
  
  const data = [
    {
      tiempo: "1 Hora",
      consumo: `${kwhHora.toFixed(2)} kWh`,
      coste: `${(kwhHora * pricePerKwh).toFixed(3)} €`,
    },
    {
      tiempo: "5 Horas (uso diario típico)",
      consumo: `${(kwhHora * 5).toFixed(2)} kWh`,
      coste: `${(kwhHora * 5 * pricePerKwh).toFixed(2)} €`,
    },
    {
      tiempo: "Mensual (1h/día)",
      consumo: `${(kwhHora * 30).toFixed(1)} kWh`,
      coste: `${(kwhHora * 30 * pricePerKwh).toFixed(2)} €`,
    },
    {
      tiempo: "Mensual (5h/día)",
      consumo: `${(kwhHora * 5 * 30).toFixed(1)} kWh`,
      coste: `${(kwhHora * 5 * 30 * pricePerKwh).toFixed(2)} €`,
    },
  ];

  return <Table columns={columns} data={data} />;
}