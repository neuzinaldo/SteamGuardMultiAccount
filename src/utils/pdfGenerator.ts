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
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.width / 2, 30, { align: 'center' });
    
    // Data de geração
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${currentDate} às ${currentTime}`, doc.internal.pageSize.width / 2, 45, { align: 'center' });
    
    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const balance = totalIncome - totalExpense;
    
    // Resumo financeiro
    let yPosition = 65;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    
    yPosition += 20;
    
    // Total de Entradas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 0); // Verde
    doc.text('Total de Entradas:', 20, yPosition);
    doc.text(formatCurrency(totalIncome), 120, yPosition);
    
    yPosition += 15;
    
    // Total de Saídas
    doc.setTextColor(255, 0, 0); // Vermelho
    doc.text('Total de Saídas:', 20, yPosition);
    doc.text(formatCurrency(totalExpense), 120, yPosition);
    
    yPosition += 15;
    
    // Saldo Final
    doc.setTextColor(balance >= 0 ? 0 : 255, balance >= 0 ? 128 : 0, 0);
    doc.text('Saldo Final:', 20, yPosition);
    doc.text(formatCurrency(balance), 120, yPosition);
    
    yPosition += 25;
    
    // Lista de transações
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Preto
    doc.text('LISTA DE TRANSAÇÕES', 20, yPosition);
    
    yPosition += 10;
    
    // Verificar se há transações
    if (!transactions || transactions.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Nenhuma transação encontrada para o período selecionado.', 20, yPosition + 20);
    } else {
      // Preparar dados para a tabela
      const tableData = transactions.map(transaction => {
        try {
          return [
            new Date(transaction.date).toLocaleDateString('pt-BR'),
            transaction.type === 'income' ? 'Entrada' : 'Saída',
            transaction.category || 'Sem categoria',
            transaction.description || 'Sem descrição',
            formatCurrency(Number(transaction.amount || 0))
          ];
        } catch (error) {
          console.error('Erro ao processar transação:', transaction, error);
          return [
            'Data inválida',
            transaction.type === 'income' ? 'Entrada' : 'Saída',
            transaction.category || 'Sem categoria',
            transaction.description || 'Sem descrição',
            'R$ 0,00'
          ];
        }
      });
      
      // Configurar tabela
      doc.autoTable({
        startY: yPosition,
        head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
        body: tableData,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 80 },
          4: { cellWidth: 25, halign: 'right' }
        }
      });
    }
    
    // Rodapé
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
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
    throw new Error(`Erro ao gerar relatório: ${error.message}`);
  }
}

function formatCurrency(value: number): string {
  try {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || 'Mês Inválido';
}