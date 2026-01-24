import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Star, TrendingUp, Zap } from 'lucide-react';

export default function ProductComparisonTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const [expanded, setExpanded] = useState({});

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Modelo',
      cell: ({ row }) => (
        <div className="model-cell">
          <strong>{row.original.nombre}</strong>
          <div className="rating">
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span>{row.original.puntuacion}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'potencia',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="header-button"
        >
          Potencia (W)
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp size={14} />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown size={14} />
          ) : (
            <TrendingUp size={14} style={{ opacity: 0.3 }} />
          )}
        </button>
      ),
      cell: ({ row }) => `${row.original.potencia}W`,
    },
    {
      accessorKey: 'eficiencia',
      header: 'Eficiencia',
      cell: ({ row }) => (
        <span className={`efficiency-badge ${row.original.eficiencia.toLowerCase().replace(/\+/g, 'plus')}`}>
          {row.original.eficiencia}
        </span>
      ),
    },
    {
      accessorKey: 'consumo_mes',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="header-button"
        >
          Coste/mes
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp size={14} />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown size={14} />
          ) : (
            <Zap size={14} style={{ opacity: 0.3 }} />
          )}
        </button>
      ),
      cell: ({ row }) => <strong className="cost-highlight">{row.original.consumo_mes}</strong>,
    },
    {
      accessorKey: 'precio',
      header: 'Precio',
      cell: ({ row }) => row.original.precio,
    },
    {
      accessorKey: 'mejor_para',
      header: 'Ideal para',
      cell: ({ row }) => <span className="best-for">{row.original.mejor_para}</span>,
    },
    {
      id: 'expander',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => row.toggleExpanded()}
          className="expand-btn"
        >
          {row.getIsExpanded() ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      expanded,
    },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
            <>
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>

              {row.getIsExpanded() && (
                <tr className="expanded-row">
                  <td colSpan={7}>
                    <div className="expanded-content">
                      {/* Características */}
                      <div className="section">
                        <h4>Características principales</h4>
                        <div className="features-tags">
                          {row.original.caracteristicas.map((feat, i) => (
                            <span key={i} className="feature-tag">{feat}</span>
                          ))}
                        </div>
                      </div>

                      {/* Tabla de Pros/Cons */}
                      <div className="section">
                        <h4>Análisis detallado</h4>
                        <table className="pros-cons-table">
                          <thead>
                            <tr>
                              <th className="pros-header">Ventajas</th>
                              <th className="cons-header">Desventajas</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="pros-cell">
                                <ul>
                                  {row.original.pros.map((pro, i) => (
                                    <li key={i}>{pro}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="cons-cell">
                                <ul>
                                  {row.original.contras.map((con, i) => (
                                    <li key={i}>{con}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
          margin-top: var(--space-m);
          max-width: 100%;
        }

        .custom-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.95rem;
          border: 1px solid var(--primary-500, #e5e7eb);
          border-radius: 4px;
          overflow: hidden;
          color:var(--primary-50);
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

        tbody tr:not(.expanded-row):nth-child(even) td {
          background: var(--primary-500, #fafafa);
        }


        thead th:first-child {
          border-top-left-radius: 2px;
        }
        thead th:last-child {
          border-top-right-radius: 2px;
        }

        .header-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          font-weight: 600;
          cursor: pointer;
          color: inherit;
          padding: 0;
          transition: opacity 0.2s;
        }

        .header-button:hover {
          opacity: 0.7;
        }

        .model-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .model-cell strong {
          color: var(--primary-50);
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: var(--primary-300);
        }

        .efficiency-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .efficiency-badge.aplusplus {
          background: #dcfce7;
          color: #15803d;
        }

        .efficiency-badge.aplus {
          background: #fef3c7;
          color: #92400e;
        }

        .efficiency-badge.a {
          background: #fee2e2;
          color: #991b1b;
        }

        .cost-highlight {
          color: #3b82f6;
          font-size: 1.05rem;
        }

        .best-for {
          font-size: 0.9rem;
          color: var(--primary-300);
        }

        .expand-btn {
          background: var(--primary-700);
          border: 1px solid var(--primary-500);
          border-radius: 4px;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .expand-btn:hover {
          background: var(--primary-800);
          transform: scale(1.1);
        }

        .expanded-row {
          background: var(--primary-900);
        }

        .expanded-row td {
          border-bottom: 2px solid var(--primary-600);
        }

        .expanded-content {
          padding: 1.5rem;
        }

        .section {
          margin-bottom: 1.5rem;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section h4 {
          margin: 0 0 1rem 0;
          color: var(--primary-50);
          font-size: 1rem;
          font-weight: 600;
        }

        .features-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          background: var(--primary-800);
          border: 1px solid var(--primary-600);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          color: var(--primary-200);
        }

        /* Tabla de Pros/Cons */
        .pros-cons-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid var(--primary-600);
          border-radius: 6px;
          overflow: hidden;
        }

        .pros-cons-table th {
          padding: 0.75rem 1rem;
          font-weight: 600;
          font-size: 0.9rem;
          border-bottom: 2px solid var(--primary-600);
        }

        .pros-header {
          background: #dcfce7;
          color: #15803d;
        }

        .cons-header {
          background: #fee2e2;
          color: #991b1b;
        }

        .pros-cons-table td {
          padding: 1rem;
          vertical-align: top;
          border: none;
        }

        .pros-cell {
          background: #f0fdf4 !important;
        }

        .cons-cell {
          background: #fef2f2 !important;
        }

        .pros-cons-table ul {
          margin: 0;
          padding-left: 1.25rem;
          list-style: none;
        }

        .pros-cell li::before {
          content: '✓ ';
          color: #15803d;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .cons-cell li::before {
          content: '✗ ';
          color: #991b1b;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .pros-cons-table li {
          margin-bottom: 0.5rem;
          color: var(--primary-900);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .pros-cons-table li:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 1024px) {
          .custom-table {
            font-size: 0.85rem;
          }

          th, td {
            padding: 10px 12px;
          }

          .pros-cons-table {
            display: block;
            overflow-x: auto;
          }
        }

        @media (max-width: 768px) {
          .custom-table {
            font-size: 0.8rem;
          }

          th, td {
            padding: 8px 10px;
          }

          .expanded-content {
            padding: 1rem;
          }

          .feature-tag {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}