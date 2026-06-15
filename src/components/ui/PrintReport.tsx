import React from 'react';

export interface PrintSection {
  type: 'table' | 'summary' | 'text';
  title?: string;
  headers?: string[];
  rows?: any[][];
  summaryItems?: { label: string; value: string; color?: string }[];
  content?: string;
}

export interface PrintData {
  title: string;
  subtitle: string;
  clientInfo: {
    name: string;
    email: string;
    phone?: string;
    cnpj?: string;
  };
  filters: { label: string; value: string }[];
  sections: PrintSection[];
}

interface PrintReportProps {
  data: PrintData | null;
}

export const PrintReport: React.FC<PrintReportProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="print-report-container">
      {/* Cabeçalho do Relatório */}
      <div className="print-header">
        <div className="print-header-brand">
          <h1 className="print-brand-name">Solum Financeiro</h1>
          <p className="print-brand-tagline">Gestão Financeira & Produtividade</p>
        </div>
        <div className="print-header-client">
          <h2 className="print-client-title">Dados do Cliente</h2>
          <div className="print-client-grid">
            <div>
              <span className="print-label">Nome:</span>
              <span className="print-val">{data.clientInfo.name}</span>
            </div>
            <div>
              <span className="print-label">E-mail:</span>
              <span className="print-val">{data.clientInfo.email}</span>
            </div>
            {data.clientInfo.phone && (
              <div>
                <span className="print-label">Telefone:</span>
                <span className="print-val">{data.clientInfo.phone}</span>
              </div>
            )}
            {data.clientInfo.cnpj && (
              <div>
                <span className="print-label">CNPJ:</span>
                <span className="print-val">{data.clientInfo.cnpj}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="print-divider" />

      {/* Título Principal do Relatório */}
      <div className="print-report-meta">
        <div>
          <h2 className="print-report-title">{data.title}</h2>
          <p className="print-report-subtitle">{data.subtitle}</p>
        </div>
        {data.filters.length > 0 && (
          <div className="print-filters">
            {data.filters.map((f, i) => (
              <div key={i} className="print-filter-badge">
                <strong>{f.label}:</strong> {f.value}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo do Relatório */}
      <div className="print-body">
        {data.sections.map((section, sIdx) => {
          return (
            <div key={sIdx} className="print-section">
              {section.title && <h3 className="print-section-title">{section.title}</h3>}

              {section.type === 'summary' && section.summaryItems && (
                <div className="print-summary-cards">
                  {section.summaryItems.map((item, iIdx) => (
                    <div key={iIdx} className="print-summary-card">
                      <span className="print-card-label">{item.label}</span>
                      <span 
                        className="print-card-value" 
                        style={{ color: item.color || 'inherit' }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'table' && section.headers && section.rows && (
                <div className="print-table-wrapper">
                  <table className="print-table">
                    <thead>
                      <tr>
                        {section.headers.map((h, hIdx) => (
                          <th key={hIdx}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.type === 'text' && section.content && (
                <div className="print-text-content">
                  <p>{section.content}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé do Relatório */}
      <div className="print-footer">
        <p>Gerado automaticamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} por Solum Financeiro</p>
        <p>Página 1 de 1</p>
      </div>
    </div>
  );
};
