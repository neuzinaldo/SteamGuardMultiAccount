import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

    // Rodapé minimalista
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      
      // Linha decorativa no rodapé
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Textos do rodapé
      doc.text(
        `Pagina ${i} de ${totalPages}`,
        pageWidth - margin - 30,
        pageHeight - 10
      );
      doc.text(
        'Sistema de Controle de Caixa',
        margin,
        pageHeight - 10
      );
    }

    // Salvar PDF
    const fileName = isMonthly 
      ? `relatorio-mensal-${year}-${month?.toString().padStart(2, '0')}.pdf`
      : `relatorio-anual-${year}.pdf`;
    
    doc.save(fileName);
    return true;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error(`Falha ao gerar relatorio: ${error.message}`);
  }
}

function getMonthName(month?: number): string {
  if (!month) return '';
  const months = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}