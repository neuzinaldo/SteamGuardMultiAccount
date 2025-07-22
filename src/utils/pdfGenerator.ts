import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export function generatePDFReport(transactions: Transaction[], year: number) {
  try {
    console.log('Iniciando geração do PDF...');
    console.log('Transações recebidas:', transactions.length);
    
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Relatório Anual de Movimentação de Caixa', 20, 30);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Ano: ${year}`, 20, 45);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 55);

    // Calculate monthly summary
    const monthlyData = [];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let yearlyIncome = 0;
    let yearlyExpense = 0;

    for (let month = 1; month <= 12; month++) {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === month && transactionDate.getFullYear() === year;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = income - expense;

      yearlyIncome += income;
      yearlyExpense += expense;

      monthlyData.push([
        months[month - 1],
        `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
    }

    // Add monthly summary table
    doc.autoTable({
      head: [['Mês', 'Entradas', 'Saídas', 'Saldo']],
      body: monthlyData,
      startY: 70,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Add yearly totals
    const finalY = doc.lastAutoTable.finalY + 20;
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Resumo Anual:', 20, finalY);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Total de Entradas: R$ ${yearlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 15);
    doc.text(`Total de Saídas: R$ ${yearlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 30);
    
    const yearlyBalance = yearlyIncome - yearlyExpense;
    doc.setTextColor(yearlyBalance >= 0 ? [34, 197, 94] : [239, 68, 68]);
    doc.text(`Saldo Final: R$ ${yearlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 45);

    // Add detailed transactions if there's space
    if (finalY + 70 < 250 && transactions.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Transações Detalhadas (Últimas 20):', 20, finalY + 65);

      const detailedData = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)
        .map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.type === 'income' ? 'Entrada' : 'Saída',
          t.category,
          t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
          `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

      doc.autoTable({
        head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
        body: detailedData,
        startY: finalY + 75,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          3: { cellWidth: 50 },
        },
      });
    }

    // Save the PDF
    const fileName = `relatorio-caixa-${year}.pdf`;
    doc.save(fileName);
    
    console.log('PDF gerado com sucesso:', fileName);
    return true;
    
  } catch (error) {
    console.error('Erro detalhado ao gerar PDF:', error);
    throw new Error(`Erro ao gerar PDF: ${error.message}`);
  }
}