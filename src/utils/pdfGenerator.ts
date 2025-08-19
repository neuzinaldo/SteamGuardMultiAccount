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

    // CABEÇALHO
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const title = isMonthly 
      ? `RELATÓRIO MENSAL - CONTROLE DE CAIXA`
      : `RELATÓRIO ANUAL - CONTROLE DE CAIXA`;
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // PERÍODO E DATA
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (isMonthly && month) {
      const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });
      doc.text(`Período: ${monthName}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    } else {
      doc.text(`Ano: ${year}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }

    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // LINHA SEPARADORA
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    if (isMonthly) {
      // ===== RELATÓRIO MENSAL =====
      await generateMonthlyReport(doc, transactions, currentY, margin, pageWidth);
    } else {
      // ===== RELATÓRIO ANUAL =====
      await generateAnnualReport(doc, transactions, year, currentY, margin, pageWidth);
    }

    // SALVAR PDF
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

async function generateMonthlyReport(
  doc: jsPDF, 
  transactions: Transaction[], 
  startY: number, 
  margin: number, 
  pageWidth: number
) {
  let currentY = startY;

  // RESUMO FINANCEIRO
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 RESUMO FINANCEIRO', margin, currentY);
  currentY += 10;

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  const summaryData = [
    ['💰 Total de Entradas', formatCurrency(income), income > 0 ? '✅' : '⚠️'],
    ['💸 Total de Saídas', formatCurrency(expense), expense > 0 ? '📉' : '✅'],
    ['📊 Saldo do Período', formatCurrency(balance), balance >= 0 ? '✅ Positivo' : '⚠️ Negativo']
  ];

  autoTable(doc, {
    head: [['Descrição', 'Valor', 'Status']],
    body: summaryData,
    startY: currentY,
    theme: 'grid',
    headStyles: { 
      fillColor: [52, 152, 219],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 40, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // ANÁLISE POR CATEGORIA
  if (transactions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 ANÁLISE POR CATEGORIA', margin, currentY);
    currentY += 10;

    const categoryAnalysis = analyzeCategoriesMonthly(transactions);
    
    if (categoryAnalysis.length > 0) {
      autoTable(doc, {
        head: [['Categoria', 'Tipo', 'Quantidade', 'Total', '% do Total']],
        body: categoryAnalysis,
        startY: currentY,
        theme: 'striped',
        headStyles: { 
          fillColor: [46, 125, 50],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }
  }

  // TRANSAÇÕES DETALHADAS
  if (transactions.length > 0) {
    // Verificar se precisa de nova página
    if (currentY > 200) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 TRANSAÇÕES DETALHADAS', margin, currentY);
    currentY += 10;

    const sortedTransactions = transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const detailedData = sortedTransactions.map(t => [
      format(new Date(t.date), 'dd/MM'),
      t.type === 'income' ? '💰 Entrada' : '💸 Saída',
      t.category,
      t.description.length > 35 ? t.description.substring(0, 35) + '...' : t.description,
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: detailedData,
      startY: currentY,
      theme: 'grid',
      headStyles: { 
        fillColor: [84, 110, 122],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 70 },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  }
}

async function generateAnnualReport(
  doc: jsPDF, 
  transactions: Transaction[], 
  year: number, 
  startY: number, 
  margin: number, 
  pageWidth: number
) {
  let currentY = startY;

  // RESUMO ANUAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 RESUMO ANUAL', margin, currentY);
  currentY += 10;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const annualSummary = [
    ['💰 Total de Entradas no Ano', formatCurrency(totalIncome)],
    ['💸 Total de Saídas no Ano', formatCurrency(totalExpense)],
    ['📊 Saldo Anual', formatCurrency(totalBalance)],
    ['📈 Média Mensal de Entradas', formatCurrency(totalIncome / 12)],
    ['📉 Média Mensal de Saídas', formatCurrency(totalExpense / 12)]
  ];

  autoTable(doc, {
    head: [['Indicador', 'Valor']],
    body: annualSummary,
    startY: currentY,
    theme: 'grid',
    headStyles: { 
      fillColor: [156, 39, 176],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // EVOLUÇÃO MENSAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📈 EVOLUÇÃO MENSAL', margin, currentY);
  currentY += 10;

  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() + 1 === m;
    });

    const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const monthBalance = monthIncome - monthExpense;

    const monthName = format(new Date(year, m - 1, 1), 'MMM', { locale: ptBR });
    const status = monthBalance >= 0 ? '✅' : '⚠️';
    
    monthlyData.push([
      monthName,
      formatCurrency(monthIncome),
      formatCurrency(monthExpense),
      formatCurrency(monthBalance),
      status
    ]);
  }

  autoTable(doc, {
    head: [['Mês', 'Entradas', 'Saídas', 'Saldo', 'Status']],
    body: monthlyData,
    startY: currentY,
    theme: 'striped',
    headStyles: { 
      fillColor: [255, 152, 0],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // TOP CATEGORIAS
  if (transactions.length > 0) {
    // Nova página se necessário
    if (currentY > 200) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 TOP CATEGORIAS DO ANO', margin, currentY);
    currentY += 10;

    const topCategories = analyzeTopCategories(transactions);
    
    if (topCategories.length > 0) {
      autoTable(doc, {
        head: [['Posição', 'Categoria', 'Tipo', 'Total', 'Transações']],
        body: topCategories,
        startY: currentY,
        theme: 'grid',
        headStyles: { 
          fillColor: [233, 30, 99],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });
    }
  }
}

function analyzeCategoriesMonthly(transactions: Transaction[]) {
  const categoryMap = new Map();
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  transactions.forEach(t => {
    const key = `${t.category}-${t.type}`;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: t.category,
        type: t.type,
        count: 0,
        total: 0
      });
    }
    const item = categoryMap.get(key);
    item.count++;
    item.total += t.amount;
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .map(item => [
      item.category,
      item.type === 'income' ? '💰 Entrada' : '💸 Saída',
      item.count.toString(),
      formatCurrency(item.total),
      `${((item.total / totalAmount) * 100).toFixed(1)}%`
    ]);
}

function analyzeTopCategories(transactions: Transaction[]) {
  const categoryMap = new Map();

  transactions.forEach(t => {
    const key = `${t.category}-${t.type}`;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: t.category,
        type: t.type,
        count: 0,
        total: 0
      });
    }
    const item = categoryMap.get(key);
    item.count++;
    item.total += t.amount;
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((item, index) => [
      `${index + 1}º`,
      item.category,
      item.type === 'income' ? '💰 Entrada' : '💸 Saída',
      formatCurrency(item.total),
      item.count.toString()
    ]);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}