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
    
    // Configurações
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Título
    const title = isMonthly 
      ? `Relatório Mensal de Movimentação de Caixa`
      : `Relatório Anual de Movimentação de Caixa`;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 30, { align: 'center' });
    
    let currentY = 50;
    
    if (isMonthly && month) {
      // Relatório Mensal
      const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${monthName}`, margin, currentY);
      currentY += 10;
      
      const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      doc.text(`Relatório gerado em: ${currentDate}`, margin, currentY);
      currentY += 20;
      
      // Resumo mensal
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expense;
      
      const summaryData = [
        ['Total de Entradas', formatCurrency(income)],
        ['Total de Saídas', formatCurrency(expense)],
        ['Saldo do Período', formatCurrency(balance)]
      ];
      
      autoTable(doc, {
        head: [['Resumo', 'Valor']],
        body: summaryData,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
    } else {
      // Relatório Anual - Resumo por mês
      const monthlyData = [];
      let totalIncome = 0;
      let totalExpense = 0;
      
      for (let m = 1; m <= 12; m++) {
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() + 1 === m;
        });
        
        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const monthBalance = monthIncome - monthExpense;
        
        totalIncome += monthIncome;
        totalExpense += monthExpense;
        
        const monthName = format(new Date(year, m - 1, 1), 'MMM', { locale: ptBR });
        monthlyData.push([
          monthName,
          formatCurrency(monthIncome),
          formatCurrency(monthExpense),
          formatCurrency(monthBalance)
        ]);
      }
      
      autoTable(doc, {
        head: [['Mês', 'Entradas', 'Saídas', 'Saldo']],
        body: monthlyData,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: margin, right: margin }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      // Resumo anual
      let summaryY = finalY;
      if (finalY > 700) {
        doc.addPage();
        summaryY = 50;
      }
      
      const totalBalance = totalIncome - totalExpense;
      const annualSummaryData = [
        ['Total Anual de Entradas', formatCurrency(totalIncome)],
        ['Total Anual de Saídas', formatCurrency(totalExpense)],
        ['Saldo Anual', formatCurrency(totalBalance)]
      ];
      
      autoTable(doc, {
        head: [['Resumo Anual', 'Valor']],
        body: annualSummaryData,
        startY: summaryY,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // Transações detalhadas
    if (transactions.length > 0) {
      let detailsStartY = currentY;
      
      // Para relatório anual, limitar a 20 transações mais recentes
      const transactionsToShow = isMonthly 
        ? transactions 
        : transactions
            .filter(t => new Date(t.date).getFullYear() === year)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);
      
      if (detailsStartY < 700 && transactionsToShow.length > 0) {
        // Adicionar na página atual
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(isMonthly ? 'Transações do Período' : 'Últimas 20 Transações', margin, detailsStartY);
        detailsStartY += 10;
        
        const detailedData = transactionsToShow.map(t => [
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.type === 'income' ? 'Entrada' : 'Saída',
          t.category,
          t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
          formatCurrency(t.amount)
        ]);
        
        autoTable(doc, {
          head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
          body: detailedData,
          startY: detailsStartY,
          theme: 'striped',
          headStyles: { fillColor: [52, 58, 64] },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 60 },
            4: { cellWidth: 25, halign: 'right' }
          }
        });
      } else if (transactionsToShow.length > 0 && detailsStartY >= 700) {
        // Adicionar em nova página
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(isMonthly ? 'Transações do Período' : 'Últimas 20 Transações', margin, 50);
        
        const detailedData = transactionsToShow.map(t => [
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.type === 'income' ? 'Entrada' : 'Saída',
          t.category,
          t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
          formatCurrency(t.amount)
        ]);
        
        autoTable(doc, {
          head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
          body: detailedData,
          startY: 60,
          theme: 'striped',
          headStyles: { fillColor: [52, 58, 64] },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 60 },
            4: { cellWidth: 25, halign: 'right' }
          }
        });
      }
    }
    
    // Salvar o PDF
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}