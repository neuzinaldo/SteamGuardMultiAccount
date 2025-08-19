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
    const margin = 20;
    let currentY = 30;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const title = isMonthly 
      ? `Relatório Mensal - ${getMonthName(month)} ${year}`
      : `Relatório Anual - ${year}`;
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // Resumo Financeiro
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', margin, currentY);
    currentY += 10;

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Entradas: ${formatCurrency(income)}`, margin, currentY);
    currentY += 8;
    doc.text(`Total de Saídas: ${formatCurrency(expense)}`, margin, currentY);
    currentY += 8;
    doc.text(`Saldo: ${formatCurrency(balance)}`, margin, currentY);
    currentY += 20;

    if (transactions.length > 0) {
      // Lista de Transações
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transações', margin, currentY);
      currentY += 10;

      // Preparar dados para a tabela
      const tableData = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(transaction => [
          format(new Date(transaction.date), 'dd/MM/yyyy'),
          transaction.type === 'income' ? 'Entrada' : 'Saída',
          transaction.category,
          transaction.description,
          formatCurrency(transaction.amount)
        ]);

      // Gerar tabela
      autoTable(doc, {
        head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 70 },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Resumo por Categoria
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo por Categoria', margin, currentY);
      currentY += 10;

      const categoryData = getCategorySummary(transactions);
      
      autoTable(doc, {
        head: [['Categoria', 'Tipo', 'Quantidade', 'Total']],
        body: categoryData,
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [92, 184, 92],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });
    }

    // Salvar PDF
    const fileName = isMonthly 
      ? `relatorio-mensal-${year}-${month?.toString().padStart(2, '0')}.pdf`
      : `relatorio-anual-${year}.pdf`;
    
    doc.save(fileName);
    return true;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}

function getCategorySummary(transactions: Transaction[]) {
  const categoryMap = new Map();

  transactions.forEach(transaction => {
    const key = `${transaction.category}-${transaction.type}`;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: transaction.category,
        type: transaction.type,
        count: 0,
        total: 0
      });
    }
    const item = categoryMap.get(key);
    item.count++;
    item.total += transaction.amount;
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .map(item => [
      item.category,
      item.type === 'income' ? 'Entrada' : 'Saída',
      item.count.toString(),
      formatCurrency(item.total)
    ]);
}

function getMonthName(month?: number): string {
  if (!month) return '';
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
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