import React, { forwardRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { printHtmlContent, printDocument } from '../../utils/print';

export { printHtmlContent, printDocument };

export default function PrintButton({ targetRef, label = 'Imprimer', className = 'btn btn-p', style, onBeforePrint }) {
  const handlePrint = useReactToPrint({
    contentRef: targetRef,
    documentTitle: 'LogiDoc — Control Tower',
    pageStyle: `
      @page { size: A4 landscape; margin: 12mm; }
      @media print {
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
    onBeforePrint: async () => {
      document.body.classList.add('ld-printing');
      await onBeforePrint?.();
    },
    onAfterPrint: () => {
      document.body.classList.remove('ld-printing');
    },
  });

  const handlePdf = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  if (!targetRef) return null;

  return (
    <div style={{ display: 'inline-flex', gap: 8, ...style }} className="no-print">
      <button type="button" className={className} onClick={() => handlePrint()} style={{ padding: '8px 16px', fontSize: 12.5 }}>
        🖨 {label}
      </button>
      <button type="button" className="btn btn-g" onClick={handlePdf} style={{ padding: '8px 16px', fontSize: 12.5 }}
        title="Exporter en PDF via l'aperçu d'impression du navigateur">
        📄 PDF
      </button>
    </div>
  );
}

export const PrintArea = forwardRef(function PrintArea({ children, className = '' }, ref) {
  return (
    <div ref={ref} className={`print-area ${className}`}>
      {children}
    </div>
  );
});

export function PrintDocumentButton({ fileName, content, poId, docType, className = 'btn btn-p' }) {
  return (
    <button type="button" className={`${className} no-print`} style={{ padding: '6px 12px', fontSize: 12 }}
      onClick={() => printDocument({ fileName, content, poId, docType })}>
      🖨 Imprimer
    </button>
  );
}
