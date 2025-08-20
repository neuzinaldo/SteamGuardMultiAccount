import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function generatePDFReport(
  transactions: Transaction[],
  year: number,
  isMonthly: boolean = false,
  month?: number
): Promise<boolean> {
  try {
    const doc = new jsPDF();
    
    // Título do relatório
    const title = isMonthly && month 
      ? `Relatório Mensal - ${getMonthName(month)} ${year}`
      : `Relatório Anual - ${year}`;
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 130, 180);
    doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
    
    // Linha decorativa
    doc.setDrawColor(70, 130, 180);
    doc.setLineWidth(2);
    doc.line(20, 35, doc.internal.pageSize.width - 20, 35);
    
    // Data de geração
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${currentDate} ${currentTime}`, doc.internal.pageSize.width / 2, 50, { align: 'center' });
    
    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    // Resumo financeiro
    let yPosition = 70;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 130, 180);
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    
    yPosition += 20;
    
    // Total de Entradas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text('Total de Entradas:', 20, yPosition);
    doc.text(formatCurrency(totalIncome), 100, yPosition);
    
    yPosition += 17;
    
    // Total de Saídas
    doc.setTextColor(220, 38, 38);
    doc.text('Total de Saídas:', 20, yPosition);
    doc.text(formatCurrency(totalExpense), 100, yPosition);
    
    yPosition += 17;
    
    // Saldo Final
    doc.setTextColor(balance >= 0 ? 34 : 220, balance >= 0 ? 139 : 38, balance >= 0 ? 34 : 38);
    doc.text('Saldo Final:', 20, yPosition);
    doc.text(formatCurrency(balance), 100, yPosition);
    
    yPosition += 30;
    
    // Lista de transações
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 130, 180);
    doc.text('LISTA DE TRANSAÇÕES', 20, yPosition);
    
    yPosition += 15;
    
    // Preparar dados para a tabela
    const tableData = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('pt-BR'),
      transaction.type === 'income' ? 'Entrada' : 'Saída',
      transaction.category,
      transaction.description,
      formatCurrency(transaction.amount)
    ]);
    
    // Configurar tabela
    doc.autoTable({
      startY: yPosition,
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 8,
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      headStyles: {
        fillColor: [240, 248, 255],
        textColor: [70, 130, 180],
        fontStyle: 'bold',
        fontSize: 11
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 70 },
        4: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.text[0] === 'Entrada') {
            data.cell.styles.textColor = [34, 139, 34];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
        if (data.section === 'body' && data.column.index === 4) {
          const isIncome = tableData[data.row.index][1] === 'Entrada';
          data.cell.styles.textColor = isIncome ? [34, 139, 34] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    // Rodapé em todas as páginas
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha do rodapé
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(0.5);
      doc.line(20, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20);
      
      // Texto do rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Sistema de Controle de Caixa', 20, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }
    
    // Salvar o PDF
    const fileName = isMonthly && month 
      ? `relatorio-mensal-${getMonthName(month).toLowerCase()}-${year}.pdf`
      : `relatorio-anual-${year}.pdf`;
    
    doc.save(fileName);
    
    return true;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1];
}