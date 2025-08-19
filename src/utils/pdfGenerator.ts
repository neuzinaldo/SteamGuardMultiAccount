import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function generatePDFReport(
  transactions: Transaction[],
  year: number,
  isMonthly: boolean = false,
  month?: number
): Promise<boolean> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let currentY = 30;

    // CABEÇALHO
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const title = isMonthly 
      ? `Relatorio Mensal - ${getMonthName(month)} ${year}`
      : `Relatorio Anual - ${year}`;
    
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, currentY);
    currentY += 10;

    // Linha decorativa
    doc.setDrawColor(70, 130, 180);
    doc.setLineWidth(2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const dateText = `Gerado em: ${currentDate}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, currentY);
    currentY += 25;

    // Reset cor do texto
    doc.setTextColor(0, 0, 0);

    // RESUMO FINANCEIRO
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 130, 180);
    doc.text('RESUMO FINANCEIRO', margin, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 15;

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    // Resumo sem bordas - apenas texto formatado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Entradas
    doc.setTextColor(34, 139, 34);
    doc.text('Total de Entradas:', margin, currentY);
    doc.text(formatCurrency(income), margin + 80, currentY);
    currentY += 12;

    // Saídas
    doc.setTextColor(220, 38, 38);
    doc.text('Total de Saidas:', margin, currentY);
    doc.text(formatCurrency(expense), margin + 80, currentY);
    currentY += 12;

    // Saldo
    doc.setTextColor(balance >= 0 ? 34 : 220, balance >= 0 ? 139 : 38, balance >= 0 ? 34 : 38);
    doc.text('Saldo Final:', margin, currentY);
    doc.text(formatCurrency(balance), margin + 80, currentY);
    currentY += 25;

    // Reset cor
    doc.setTextColor(0, 0, 0);

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 30;
    }

    // LISTA DE TRANSAÇÕES
    if (transactions.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 130, 180);
      doc.text('LISTA DE TRANSACOES', margin, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 15;

      // Preparar dados das transações
      const transactionData = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(transaction => [
          format(new Date(transaction.date), 'dd/MM/yyyy'),
          transaction.type === 'income' ? 'Entrada' : 'Saida',
          transaction.category,
          truncateText(transaction.description, 35),
          formatCurrency(transaction.amount)
        ]);

      // Tabela sem bordas
      autoTable(doc, {
        head: [['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor']],
        body: transactionData,
        startY: currentY,
        theme: 'plain', // Sem bordas
        styles: {
          fontSize: 10,
          cellPadding: 6,
          textColor: [0, 0, 0],
          lineColor: [255, 255, 255], // Linhas invisíveis
          lineWidth: 0
        },
        headStyles: {
          fillColor: [240, 248, 255], // Azul muito claro
          textColor: [70, 130, 180],
          fontStyle: 'bold',
          fontSize: 11
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248] // Cinza muito claro
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35 },
          3: { cellWidth: 70 },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });
    } else {
      // Caso não tenha transações
      doc.setFontSize(14);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      const noDataText = 'Nenhuma transacao encontrada para o periodo selecionado.';
      const textWidth = doc.getTextWidth(noDataText);
      doc.text(noDataText, (pageWidth - textWidth) / 2, currentY);
    }

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