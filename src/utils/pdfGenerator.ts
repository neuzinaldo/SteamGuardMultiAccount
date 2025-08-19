import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

export async function generatePDFReport(transactions: Transaction[], year: number, isMonthly: boolean = false, month?: number) {
  try {
    const reportType = isMonthly ? 'Mensal' : 'Anual';
    const periodText = isMonthly && month ? 
      `${format(new Date(year, month - 1, 1), 'MMMM')} de ${year}` : 
      `${year}`;
    
    // Obter email do usuário logado
    let userEmail = 'Usuário não identificado';
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          userEmail = user.email;
        }
      } catch (error) {
        console.log('Erro ao obter usuário:', error);
      }
    }
    
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Relatório ${reportType} de Movimentação de Caixa`, 20, 30);

    // Adicionar informações de geração apenas para relatório mensal
    if (isMonthly) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Período: ${periodText}`, 20, 45);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 55);
    }

    // Inicializar totais
    let yearlyIncome = 0;
    let yearlyExpense = 0;

    let summaryData = [];

    if (isMonthly) {
      // Calculate totals for monthly report
      yearlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      yearlyExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Para relatório mensal, mostrar resumo por categoria
      const categories = [...new Set(transactions.map(t => t.category))];
      
      categories.forEach(category => {
        const categoryTransactions = transactions.filter(t => t.category === category);
        const income = categoryTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = categoryTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        if (income > 0 || expense > 0) {
          summaryData.push([
            category,
            `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${(income - expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          ]);
        }
      });
    } else {
      // Para relatório anual, calcular totais de TODAS as transações do ano
      console.log('=== RELATÓRIO ANUAL ===');
      console.log('Transações recebidas:', transactions.length);
      console.log('Ano do relatório:', year);
      
      // Filtrar transações do ano específico
      const yearTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionYear = transactionDate.getFullYear();
        return transactionYear === year;
      });
      
      console.log('Transações do ano filtradas:', yearTransactions.length);
      
      // Log das transações para debug
      yearTransactions.forEach(t => {
        console.log(`${t.date} - ${t.type} - ${t.category} - R$ ${t.amount}`);
      });
      
      // Calcular totais anuais ANTES do loop mensal
      yearlyIncome = yearTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      yearlyExpense = yearTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      console.log('Totais anuais:', { yearlyIncome, yearlyExpense, saldo: yearlyIncome - yearlyExpense });
      
      // Para relatório anual, mostrar resumo mensal
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      // Resetar totais anuais antes do loop
      yearlyIncome = 0;
      yearlyExpense = 0;

      for (let monthNum = 1; monthNum <= 12; monthNum++) {
        const monthTransactions = yearTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() + 1 === monthNum;
        });

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const balance = income - expense;
        
        // Acumular totais anuais
        yearlyIncome += income;
        yearlyExpense += expense;
        
        if (income > 0 || expense > 0) {
          console.log(`${months[monthNum - 1]}: Entrada R$ ${income}, Saída R$ ${expense}, Saldo R$ ${balance}`);
        }

        summaryData.push([
          months[monthNum - 1],
          `R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);
      }
      
      console.log('Totais anuais calculados no loop:', { yearlyIncome, yearlyExpense, saldo: yearlyIncome - yearlyExpense });
    }

    // Add summary table
    const tableTitle = isMonthly ? 'Resumo por Categoria' : 'Resumo Mensal';
    const headerRow = isMonthly ? 
      ['Categoria', 'Entradas', 'Saídas', 'Saldo'] :
      ['Mês', 'Entradas', 'Saídas', 'Saldo'];

    autoTable(doc, {
      head: [headerRow],
      body: summaryData,
      startY: isMonthly ? 70 : 50,
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

    // Get the final Y position from the last table
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Debug: Log dos valores finais
    console.log('Valores para o resumo final:', {
      yearlyIncome,
      yearlyExpense,
      yearlyBalance: yearlyIncome - yearlyExpense,
      reportType,
      isMonthly
    });
    
    // Add yearly totals
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Resumo ${reportType}:`, 20, finalY);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de Entradas: R$ ${yearlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 15);
    doc.text(`Total de Saídas: R$ ${yearlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 30);
    
    const yearlyBalance = yearlyIncome - yearlyExpense;
    // Set color based on balance (green for positive, red for negative)
    if (yearlyBalance >= 0) {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`Saldo Final: R$ ${yearlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 45);


    // Add detailed transactions if there's space
    if (finalY + 70 < 250 && transactions.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Transações Detalhadas (${isMonthly ? 'Todas' : 'Últimas 20'}):`, 20, finalY + 65);

      const transactionsForDetails = isMonthly ? transactions : 
        transactions.filter(t => new Date(t.date).getFullYear() === year);
      
      const detailedData = transactionsForDetails
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, isMonthly ? transactionsForDetails.length : 20)
        .map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.type === 'income' ? 'Entrada' : 'Saída',
          t.category,
          t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
          `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

      autoTable(doc, {
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
    const fileName = isMonthly ? 
      `relatorio-mensal-${year}-${month?.toString().padStart(2, '0')}.pdf` :
      `relatorio-anual-${year}.pdf`;
    doc.save(fileName);
    
    return true;
    
  } catch (error) {
    console.error('Erro detalhado ao gerar PDF:', error);
    throw new Error(`Erro ao gerar PDF: ${error.message}`);
  }
}