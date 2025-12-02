import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function Table({ columns, data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
  .table-container {
    overflow-x: auto;
    margin-top: var(--space-m); 
  }

  .custom-table {
    width: 100%;
    border-collapse: separate; /* Necesario para border-radius */
    border-spacing: 0;
    font-size: 0.95rem;
    border: 1px solid var(--primary-500, #e5e7eb); /* Borde completo */
    border-radius: 4px; /* Bordes redondeados */
    overflow: hidden; /* Recorta los bordes de las celdas */
  }

  th,
  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--primary-500, #e5e7eb);
    text-align: left;
  }

  thead th {
    font-weight: 600;
    background: var(--primary-700, #f9fafb);
  }

  tr:nth-child(even) td {
    background: var(--primary-500, #fafafa);
  }

  tr:hover td {
    background: var(--primary-900, #f3f4f6);
    color: var(--primary-50, #1f2937);
  }

  /* Ajuste para el primer y último th/td para bordes redondeados */
  thead th:first-child {
    border-top-left-radius: 2px;
  }
  thead th:last-child {
    border-top-right-radius: 2px;
  }
  tbody tr:last-child td:first-child {
    border-bottom-left-radius: 2px;
  }
  tbody tr:last-child td:last-child {
    border-bottom-right-radius: 2px;
  }
`}</style>

    </div>
  );
}
