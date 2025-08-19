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

    // Configurar fonte padrão
    doc.setFont('helvetica', 'normal');

    // CABEÇALHO
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = isMonthly 
      ? `Relatorio Mensal - ${getMonthName(month)} ${year}`
      : `Relatorio Anual - ${year}`;
    
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, currentY);
    currentY += 15;

    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const dateText = `Gerado em: ${currentDate}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, currentY);
    currentY += 25;

    // RESUMO FINANCEIRO
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', margin, currentY);
    currentY += 15;

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Criar tabela para o resumo
    const summaryData = [
      ['Total de Entradas', formatCurrency(income)],
      ['Total de Saidas', formatCurrency(expense)],
      ['Saldo Final', formatCurrency(balance)]
    ];

    autoTable(doc, {
      body: summaryData,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 12,
        cellPadding: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 30;
    }

    // LISTA DE TRANSAÇÕES
    if (transactions.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTA DE TRANSACOES', margin, currentY);
      currentY += 15;

      // Preparar dados das transações
      const transactionData = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(transaction => [
          format(new Date(transaction.date), 'dd/MM/yyyy'),
          transaction.type === 'income' ? 'Entrada' : 'Saida',
          transaction.category,
          truncateText(transaction.description, 30),
          formatCurrency(transaction.amount)
        ]);

      autoTable(doc, {
        head: [['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor']],
        body: transactionData,
        startY: currentY,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [70, 130, 180],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35 },
          3: { cellWidth: 65 },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Verificar se precisa de nova página para o resumo por categoria
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 30;
      }

      // RESUMO POR CATEGORIA
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO POR CATEGORIA', margin, currentY);
      currentY += 15;

      const categoryData = getCategorySummary(transactions);
      
      if (categoryData.length > 0) {
        autoTable(doc, {
          head: [['Categoria', 'Tipo', 'Qtd', 'Total']],
          body: categoryData,
          startY: currentY,
          theme: 'striped',
          styles: {
            fontSize: 10,
            cellPadding: 5,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248]
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: margin, right: margin }
        });
      }
    } else {
      // Caso não tenha transações
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Nenhuma transacao encontrada para o periodo selecionado.', margin, currentY);
    }

    // Rodapé
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
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
      item.type === 'income' ? 'Entrada' : 'Saida',
      item.count.toString(),
      formatCurrency(item.total)
    ]);
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