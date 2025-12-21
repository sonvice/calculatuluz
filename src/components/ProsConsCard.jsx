import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function ProsConsCard({ pros, cons, savings }) {
  return (
    <div className="pros-cons-wrapper my-space-l">
      {/* Grid de Pros y Cons */}
      <div className="pros-cons-grid">
        {/* Columna de Ventajas */}
        <div className="pros-section bg-primary-900">
          <div className="section-header pros-header">
            <CheckCircle size={20} strokeWidth={2.5} />
            <h4>Ventajas</h4>
          </div>
          <ul className="pros-list">
            {pros.map((pro, index) => (
              <li key={index} className="pros-item text-primary-200">
                <div className="item-icon">
                  <CheckCircle size={16} />
                </div>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna de Desventajas */}
        <div className="cons-section bg-primary-900">
          <div className="section-header cons-header">
            <XCircle size={20} strokeWidth={2.5} />
            <h4>Desventajas</h4>
          </div>
          <ul className="cons-list">
            {cons.map((con, index) => (
              <li key={index} className="cons-item text-primary-200">
                <div className="item-icon">
                  <XCircle size={16} />
                </div>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Banner de ahorro (opcional) */}
      {savings && (
        <div className="savings-banner mt-space-s">
          <div className="savings-icon">
            <TrendingUp size={20} />
          </div>
          <div className="savings-content">
            <span className="savings-label">Ahorro estimado</span>
            <span className="savings-value">{savings}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .pros-cons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-s);
        }

        .pros-section,
        .cons-section {
          border: 1px solid var(--primary-600);
          border-radius: var(--rounded-md);
          padding: 0;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .pros-section {
          border-top: 3px solid var(--esmerald-green);
        }

        .cons-section {
          border-top: 3px solid var(--red);
        }

        @media (min-width: 769px) {
          .pros-section:hover,
          .cons-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-s) var(--space-m);
          border-bottom: 1px solid var(--primary-600);
        }

        .pros-header {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #15803d;
        }

        .cons-header {
          background: linear-gradient(135deg, var(--red-50) 0%, var(--red-100) 100%);
          color: var(--red-800);
        }

        .section-header h4 {
          margin: 0;
          font-size: var(--size-0);
          font-weight: var(--bold);
        }

        .pros-list,
        .cons-list {
          list-style: none;
          margin: 0;
          padding: var(--space-m);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .pros-item,
        .cons-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-xs);
          font-size: var(--size-0);
          line-height: 1.5;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          margin-top: 2px;
        }

        .pros-item .item-icon {
          color: var(--esmerald-green);
        }

        .cons-item .item-icon {
          color: var(--red);
        }

        .savings-banner {
          display: flex;
          align-items: center;
          gap: var(--space-s);
          background: linear-gradient(135deg, var(--orange-100) 0%, var(--orange-200) 100%);
          border: 2px solid var(--amber);
          border-radius: var(--rounded-md);
          padding: var(--space-s) var(--space-m);
        }

        .savings-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: white;
          border-radius: var(--rounded-full);
          color: var(--amber);
        }

        .savings-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3xs);
        }

        .savings-label {
          font-size: var(--size--1);
          color: var(--orange-900);
          font-weight: var(--semi-bold);
        }

        .savings-value {
          font-size: var(--size-1);
          color: var(--orange-900);
          font-weight: var(--bold);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pros-cons-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            padding: var(--space-xs) var(--space-s);
          }

          .pros-list,
          .cons-list {
            padding: var(--space-s);
            gap: var(--space-2xs);
          }

          .pros-item,
          .cons-item {
            font-size: var(--size--1);
          }

          .savings-banner {
            padding: var(--space-xs) var(--space-s);
          }

          .savings-icon {
            width: 36px;
            height: 36px;
          }

          .savings-label {
            font-size: var(--size--2);
          }

          .savings-value {
            font-size: var(--size-0);
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .pros-header {
            background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
            color: #d1fae5;
          }

          .cons-header {
            background: linear-gradient(135deg, var(--red-900) 0%, var(--red-800) 100%);
            color: var(--red-200);
          }

          .savings-banner {
            background: linear-gradient(135deg, var(--orange-900) 0%, var(--orange-800) 100%);
            border-color: var(--amber);
          }

          .savings-label,
          .savings-value {
            color: var(--orange-100);
          }

          .savings-icon {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
}