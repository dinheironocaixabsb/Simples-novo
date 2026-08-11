import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CompanyData, FirmData, ProfessionalData } from '../../../store/useClientStore';
import { SimulationResult } from './simples-calculator';

export const exportSimplesNacionalExcel = async (
  companyData: CompanyData,
  firmData: FirmData,
  professionalData: ProfessionalData,
  xmlFaturamento: any[],
  xmlDespesas: any[],
  calculationResults: Record<number, SimulationResult>,
  revenueData: Record<number, any>,
  monthlyExpenses: Record<number, any>,
  impactoClientes: any[], // We will need to pass this or calculate it
  period: string = 'all'
) => {
  const monthMap: Record<string, number> = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
  };
  const targetMonthIndex = period !== 'all' ? monthMap[period] : -1;

  const filterByMonth = (items: any[]) => {
    if (targetMonthIndex === -1) return items;
    return items.filter(x => {
      if (!x.data) return false;
      const parts = x.data.includes('/') ? x.data.split('/') : x.data.split('-');
      const monthStr = x.data.includes('/') ? parts[1] : parts[1];
      const m = parseInt(monthStr, 10) - 1;
      return m === targetMonthIndex;
    });
  };

  const filteredFaturamento = filterByMonth(xmlFaturamento);
  const filteredDespesas = filterByMonth(xmlDespesas);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = firmData.nome || 'Diagnóstico Tributário';
  workbook.lastModifiedBy = professionalData.nome || 'Consultor';
  workbook.created = new Date();
  
  // ==========================================
  // ABA 1: Identificação do Cliente
  // ==========================================
  const ws1 = workbook.addWorksheet('1. Identificação', { views: [{ showGridLines: false }] });
  
  // Set column widths
  ws1.getColumn('A').width = 3;
  ws1.getColumn('B').width = 30;
  ws1.getColumn('C').width = 2;
  ws1.getColumn('D').width = 45;
  ws1.getColumn('E').width = 3;
  ws1.getColumn('F').width = 3;
  ws1.getColumn('G').width = 3;
  ws1.getColumn('H').width = 3;
  ws1.getColumn('I').width = 35;
  
  // Title
  ws1.mergeCells('B2:I2');
  const titleCell = ws1.getCell('B2');
  titleCell.value = 'RELATÓRIO EXECUTIVO DE TRANSIÇÃO TRIBUTÁRIA';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(2).height = 30;
  
  // Subtitle
  ws1.mergeCells('B5:E5');
  const sub1 = ws1.getCell('B5');
  sub1.value = 'IDENTIFICAÇÃO DA EMPRESA';
  sub1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sub1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  sub1.alignment = { vertical: 'middle', horizontal: 'left' };
  
  ws1.mergeCells('F5:I5');
  const logoTitle = ws1.getCell('F5');
  logoTitle.value = 'LOGOTIPO / MARCA';
  logoTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  logoTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  logoTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Info Data
  const infoRows = [
    { label: 'Razão Social:', val: companyData.razaoSocial || '-' },
    { label: 'CNPJ:', val: companyData.cnpj || '-' },
    { label: 'CNAE Principal:', val: companyData.cnaePrincipal || '-' },
    { label: 'CNAEs Secundários:', val: companyData.cnaeSecundarios?.join(', ') || '-' },
    { label: 'Administrador da Empresa:', val: `${professionalData.nome || '-'} - CPF: ${professionalData.crc || '-'}` }
  ];
  
  let row = 7;
  for (const r of infoRows) {
    ws1.getCell(`B${row}`).value = r.label;
    ws1.getCell(`B${row}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF333333' } };
    ws1.getCell(`B${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getCell(`B${row}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };

    ws1.mergeCells(`D${row}:E${row}`);
    ws1.getCell(`D${row}`).value = r.val;
    ws1.getCell(`D${row}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
    ws1.getCell(`D${row}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getCell(`D${row}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };
    
    ws1.getCell(`C${row}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };
    ws1.getRow(row).height = 20;
    row++;
  }
  
  // Logo Box
  ws1.mergeCells('F7:I11');
  const logoBox = ws1.getCell('F7');
  logoBox.value = 'ANEXE SEU LOGOTIPO AQUI\n\nInstruções:\n1. Clique em Inserir > Ilustrações > Imagens\n2. Escolha "Este Dispositivo..."\n3. Selecione sua imagem e posicione-a dentro deste quadro.';
  logoBox.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF888888' } };
  logoBox.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  logoBox.border = { top: {style:'dashed', color: {argb:'FFCCCCCC'}}, left: {style:'dashed', color: {argb:'FFCCCCCC'}}, bottom: {style:'dashed', color: {argb:'FFCCCCCC'}}, right: {style:'dashed', color: {argb:'FFCCCCCC'}} };

  // Configurações das Alíquotas
  const startConfigRow = row + 1;
  ws1.mergeCells(`B${startConfigRow}:E${startConfigRow}`);
  const confTitle = ws1.getCell(`B${startConfigRow}`);
  confTitle.value = 'CONFIGURAÇÕES DAS ALÍQUOTAS (NOVO IVA)';
  confTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  confTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  confTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  
  const configRows = [
    { label: 'Alíquota IBS de Débito:', val: '0,10%' },
    { label: 'Alíquota CBS de Débito:', val: '9,45%' },
    { label: 'Alíquota IBS de Crédito:', val: '0,10%' },
    { label: 'Alíquota CBS de Crédito:', val: '9,45%' },
    { label: 'Ano de Simulação:', val: 'Transição (2026 a 2028)' }
  ];

  let cRow = startConfigRow + 2;
  for (const r of configRows) {
    ws1.getCell(`B${cRow}`).value = r.label;
    ws1.getCell(`B${cRow}`).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF333333' } };
    ws1.getCell(`B${cRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getCell(`B${cRow}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };

    ws1.mergeCells(`D${cRow}:E${cRow}`);
    ws1.getCell(`D${cRow}`).value = r.val;
    ws1.getCell(`D${cRow}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
    ws1.getCell(`D${cRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws1.getCell(`D${cRow}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };
    
    ws1.getCell(`C${cRow}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };
    ws1.getRow(cRow).height = 20;
    cRow++;
  }

  // ==========================================
  // ABA 2: Faturamento (Notas)
  // ==========================================
  const ws2 = workbook.addWorksheet('2. Faturamento (Notas)', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  ws2.columns = [
    { header: 'Nº NOTA', key: 'nota', width: 12 },
    { header: 'EMISSÃO', key: 'emissao', width: 15 },
    { header: 'TOMADOR', key: 'tomador', width: 45 },
    { header: 'REGIME', key: 'regime', width: 25 },
    { header: 'DESCRIÇÃO DO SERVIÇO', key: 'desc', width: 50 },
    { header: 'VALOR SERVIÇO', key: 'valor', width: 20 },
  ];
  
  // Style Headers
  ws2.getRow(1).eachCell(cell => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let rowCount2 = 1;
  filteredFaturamento.forEach(x => {
    const row = ws2.addRow({
      nota: x.numero,
      emissao: x.data,
      tomador: `${x.tomador} ${x.cnpj ? `(${x.cnpj})` : ''}`,
      regime: x.regime,
      desc: x.descricao || '-',
      valor: x.valor
    });
    rowCount2++;
    
    row.eachCell((cell, colNumber) => {
      const isBold = colNumber === 6;
      cell.font = { name: 'Segoe UI', size: 10, bold: isBold };
      
      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
         cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 3 || colNumber === 5) {
         cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else if (colNumber === 6) {
         cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    if (rowCount2 % 2 !== 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      });
    }
  });

  if (filteredFaturamento.length > 0) {
    ws2.autoFilter = `A1:F${rowCount2}`;
  }
  
  ws2.getColumn('valor').numFmt = '"R$ "#,##0.00';

  // ==========================================
  // ABA 3: Despesas
  // ==========================================
  const ws3 = workbook.addWorksheet('3. Despesas (Notas)', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  ws3.columns = [
    { header: 'Nº NOTA', key: 'nota', width: 12 },
    { header: 'EMISSÃO', key: 'emissao', width: 15 },
    { header: 'FORNECEDOR', key: 'forn', width: 45 },
    { header: 'REGIME', key: 'regime', width: 20 },
    { header: 'TIPO DE DESPESA', key: 'tipo', width: 25 },
    { header: 'DESCRIÇÃO DO SERVIÇO', key: 'desc', width: 50 },
    { header: 'VALOR TOTAL', key: 'valor', width: 20 },
    { header: 'VALOR ELEGÍVEL A CRÉDITO', key: 'elegivel', width: 25 },
  ];

  ws3.getRow(1).eachCell(cell => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let rowCount3 = 1;
  filteredDespesas.forEach(x => {
    const row = ws3.addRow({
      nota: x.numero || 'N/A',
      emissao: x.data,
      forn: `${x.fornecedor} ${x.cnpj ? `(${x.cnpj})` : ''}`,
      regime: x.regime,
      tipo: x.tipoDespesa,
      desc: x.descricao || '-',
      valor: x.valor,
      elegivel: x.valor // Simples
    });
    rowCount3++;
    
    row.eachCell((cell, colNumber) => {
      const isBold = colNumber === 7 || colNumber === 8;
      cell.font = { name: 'Segoe UI', size: 10, bold: isBold };
      
      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
         cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 3 || colNumber === 5 || colNumber === 6) {
         cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else if (colNumber === 7 || colNumber === 8) {
         cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    if (rowCount3 % 2 !== 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      });
    }
  });

  if (filteredDespesas.length > 0) {
    ws3.autoFilter = `A1:H${rowCount3}`;
  }
  ws3.getColumn('valor').numFmt = '"R$ "#,##0.00';
  ws3.getColumn('elegivel').numFmt = '"R$ "#,##0.00';

  // ==========================================
  // ABA 4: Cenários Tributários
  // ==========================================
  const ws4 = workbook.addWorksheet('4. Cenários Tributários', { views: [{ showGridLines: false }] });
  ws4.getColumn('A').width = 3;
  ws4.getColumn('B').width = 40;
  ws4.getColumn('C').width = 20;
  ws4.getColumn('D').width = 3;
  ws4.getColumn('E').width = 40;
  ws4.getColumn('F').width = 20;

  let totalRev = 0;
  if (targetMonthIndex === -1) {
    for(let i=0; i<12; i++){
      totalRev += revenueData[i]?.rba || 0;
    }
  } else {
    totalRev = revenueData[targetMonthIndex]?.rba || 0;
  }

  let totalExp = 0;
  filteredDespesas.forEach(x => {
    totalExp += (Number(x.valor) || 0);
  });

  ws4.getCell('B2').value = `Faturamento Base: R$ ${totalRev.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  ws4.getCell('E2').value = `Despesas (Gera Crédito): R$ ${totalExp.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  ws4.getCell('B2').font = { bold: true };
  ws4.getCell('E2').font = { bold: true };

  // Headers
  const setHeaderCenario = (cellRef: string, text: string) => {
    const c = ws4.getCell(cellRef);
    c.value = text;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
    c.alignment = { horizontal: 'center' };
  };
  
  ws4.mergeCells('B4:C4');
  setHeaderCenario('B4', 'CENÁRIO 1: REGIME POR DENTRO');
  
  ws4.mergeCells('E4:F4');
  setHeaderCenario('E4', 'CENÁRIO 2: REGIME POR FORA');

  ws4.getCell('B6').value = 'Características do Regime:';
  ws4.getCell('B6').font = { bold: true };
  ws4.getCell('B7').value = '• Simplicidade: Pagamento unificado em guia única (DAS).';
  ws4.getCell('B8').value = '• Custo "Cheio": Imposto incide sobre faturamento bruto.';
  ws4.getCell('B9').value = '• Impacto Comercial: Não transfere crédito integral p/ clientes PJ.';

  ws4.getCell('E6').value = 'Características do Regime:';
  ws4.getCell('E6').font = { bold: true };
  ws4.getCell('E7').value = '• Custo Líquido: Usa despesas da operação para abater imposto.';
  ws4.getCell('E8').value = '• Gestão: Exige maior controle das notas fiscais de despesas.';
  ws4.getCell('E9').value = '• Impacto Comercial: Transfere 100% do crédito p/ PJ.';

  ws4.getCell('E9').value = '• Impacto Comercial: Transfere 100% do crédito p/ PJ.';

  // Month-by-month breakdown could be added here, but to keep it simple, we use the first available month calculation result to show rates
  const sampleCalc = targetMonthIndex !== -1 ? calculationResults[targetMonthIndex] : calculationResults[0]; 
  
  if (sampleCalc) {
    ws4.getCell('B11').value = 'Alíquota Efetiva Padrão';
    ws4.getCell('C11').value = sampleCalc.aliqEfetivaPadrao;
    ws4.getCell('C11').numFmt = '0.0000%';

    ws4.getCell('B13').value = '1. Valor do DAS';
    ws4.getCell('C13').value = sampleCalc.valorDasPadraoTotal;
    
    // Detalhamento C1
    ws4.getCell('B14').value = 'Detalhamento dos Tributos no DAS';
    ws4.getCell('B14').font = { bold: true, color: { argb: 'FF005696' } };
    
    let rIdx = 15;
    if (sampleCalc.c1Taxes) {
      Object.entries(sampleCalc.c1Taxes).forEach(([tax, val]) => {
        ws4.getCell(`B${rIdx}`).value = tax;
        ws4.getCell(`C${rIdx}`).value = val;
        ws4.getCell(`C${rIdx}`).numFmt = '"R$ "#,##0.00';
        rIdx++;
      });
    }
    
    rIdx++;
    ws4.getCell(`B${rIdx}`).value = 'Crédito Transferido para B2B';
    ws4.getCell(`B${rIdx}`).font = { bold: true, color: { argb: 'FF005696' } };
    rIdx++;
    
    ws4.getCell(`B${rIdx}`).value = 'Parcela IBS (Regra de Transição)';
    ws4.getCell(`C${rIdx}`).value = sampleCalc.creditoB2BIbsTotal || 0;
    ws4.getCell(`C${rIdx}`).numFmt = '"R$ "#,##0.00';
    rIdx++;
    
    ws4.getCell(`B${rIdx}`).value = 'Parcela CBS (PIS/Cofins)';
    ws4.getCell(`C${rIdx}`).value = sampleCalc.creditoB2BCbsTotal || 0;
    ws4.getCell(`C${rIdx}`).numFmt = '"R$ "#,##0.00';
    rIdx++;
    
    ws4.getCell(`B${rIdx}`).value = 'Total Transferido';
    ws4.getCell(`B${rIdx}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`C${rIdx}`).value = sampleCalc.creditoB2BTotal || 0;
    ws4.getCell(`C${rIdx}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`C${rIdx}`).numFmt = '"R$ "#,##0.00';

    // C2 (Por Fora)
    ws4.getCell('E11').value = 'Alíquota Efetiva do DAS (Sem IVA)';
    ws4.getCell('F11').value = sampleCalc.aliqEfetivaPorFora;
    ws4.getCell('F11').numFmt = '0.0000%';

    ws4.getCell('E13').value = '1. Valor do DAS Reduzido';
    ws4.getCell('F13').value = sampleCalc.valorDasPorForaTotal;
    
    ws4.getCell('E14').value = 'Detalhamento dos Tributos no DAS Reduzido';
    ws4.getCell('E14').font = { bold: true, color: { argb: 'FF005696' } };
    
    let rIdx2 = 15;
    if (sampleCalc.c2Taxes) {
      Object.entries(sampleCalc.c2Taxes).forEach(([tax, val]) => {
        ws4.getCell(`E${rIdx2}`).value = tax;
        ws4.getCell(`F${rIdx2}`).value = val;
        ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
        rIdx2++;
      });
    }
    
    rIdx2++;
    ws4.getCell(`E${rIdx2}`).value = 'Apuração do IVA (IBS + CBS)';
    ws4.getCell(`E${rIdx2}`).font = { bold: true, color: { argb: 'FF005696' } };
    rIdx2++;
    
    ws4.getCell(`E${rIdx2}`).value = 'Débito de IBS';
    ws4.getCell(`F${rIdx2}`).value = sampleCalc.debitoIbs || 0;
    ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
    rIdx2++;
    
    ws4.getCell(`E${rIdx2}`).value = 'Débito de CBS';
    ws4.getCell(`F${rIdx2}`).value = sampleCalc.debitoCbs || 0;
    ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
    rIdx2++;
    
    ws4.getCell(`E${rIdx2}`).value = 'Crédito de IBS';
    ws4.getCell(`F${rIdx2}`).value = sampleCalc.creditoIbs || 0;
    ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
    rIdx2++;
    
    ws4.getCell(`E${rIdx2}`).value = 'Crédito de CBS';
    ws4.getCell(`F${rIdx2}`).value = sampleCalc.creditoCbs || 0;
    ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
    rIdx2++;
    
    ws4.getCell(`E${rIdx2}`).value = '2. Saldo do IVA (A Pagar)';
    ws4.getCell(`E${rIdx2}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`F${rIdx2}`).value = sampleCalc.saldoIva || 0;
    ws4.getCell(`F${rIdx2}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`F${rIdx2}`).numFmt = '"R$ "#,##0.00';
    
    // Sync heights
    const maxRIdx = Math.max(rIdx, rIdx2 + 2);

    ws4.getCell(`B${maxRIdx}`).value = 'CUSTO TOTAL DO PERÍODO (DAS ÚNICO)';
    ws4.getCell(`B${maxRIdx}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`C${maxRIdx}`).value = sampleCalc.valorDasPadraoTotal;
    ws4.getCell(`C${maxRIdx}`).font = { bold: true, color: { argb: 'FF005696' } };
    ws4.getCell(`C${maxRIdx}`).numFmt = '"R$ "#,##0.00';
    ws4.getCell(`B${maxRIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    ws4.getCell(`C${maxRIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    ws4.getCell(`E${maxRIdx}`).value = 'CUSTO EFETIVO (CENÁRIO RECOMENDADO)';
    ws4.getCell(`E${maxRIdx}`).font = { bold: true, color: { argb: 'FF16A34A' } };
    ws4.getCell(`F${maxRIdx}`).value = sampleCalc.custoEfetivoPorFora;
    ws4.getCell(`F${maxRIdx}`).font = { bold: true, color: { argb: 'FF16A34A' } };
    ws4.getCell(`F${maxRIdx}`).numFmt = '"R$ "#,##0.00';
    ws4.getCell(`E${maxRIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    ws4.getCell(`F${maxRIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    
    ws4.getCell('C13').numFmt = '"R$ "#,##0.00';
    ws4.getCell('C13').font = { bold: true };
    ws4.getCell('F13').numFmt = '"R$ "#,##0.00';
    ws4.getCell('F13').font = { bold: true };
    
    // borders
    for (let i = 11; i <= maxRIdx; i++) {
        ['B','C','E','F'].forEach(c => {
           ws4.getCell(`${c}${i}`).border = { bottom: {style:'thin', color: {argb: 'FFEEEEEE'}} };
        });
    }
  }

  // ABA 6 movida para o final para manter a ordem das abas no Excel

  // ==========================================
  // ABA 5: Impacto por Cliente
  // ==========================================
  const ws6 = workbook.addWorksheet('5. Impacto por Cliente', { views: [{ state: 'frozen', xSplit: 3, ySplit: 3, topLeftCell: 'D4', activeCell: 'A1', showGridLines: false }] });
  
  ws6.mergeCells('A1:C1');
  ws6.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };

  ws6.mergeCells('D1:R1');
  ws6.getCell('D1').value = 'IMPACTO POR CLIENTE (INTELIGÊNCIA COMERCIAL)';
  ws6.getCell('D1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  ws6.getCell('D1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  ws6.getCell('D1').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws6.getRow(1).height = 30;

  ws6.mergeCells('A2:C2');
  ws6.getCell('A2').value = 'CENÁRIO ATUAL';
  ws6.getCell('A2').font = { bold: true, color: {argb: 'FFFFFFFF'} };
  ws6.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
  ws6.getCell('A2').alignment = { horizontal: 'center' };

  ws6.mergeCells('D2:L2');
  ws6.getCell('D2').value = 'CÁLCULO DA NOVA CARGA TRIBUTÁRIA';
  ws6.getCell('D2').font = { bold: true, color: {argb: 'FFFFFFFF'} };
  ws6.getCell('D2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  ws6.getCell('D2').alignment = { horizontal: 'center' };

  ws6.mergeCells('M2:O2');
  ws6.getCell('M2').value = 'IMPACTO APROVEITANDO CRÉDITO (B2B)';
  ws6.getCell('M2').font = { bold: true, color: {argb: 'FFFFFFFF'} };
  ws6.getCell('M2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF75B743' } };
  ws6.getCell('M2').alignment = { horizontal: 'center' };

  ws6.mergeCells('P2:R2');
  ws6.getCell('P2').value = 'IMPACTO NÃO APROVEITANDO (PF/SIMPLES)';
  ws6.getCell('P2').font = { bold: true, color: {argb: 'FFFFFFFF'} };
  ws6.getCell('P2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAB308' } };
  ws6.getCell('P2').alignment = { horizontal: 'center' };

  const headers6 = [
    'Cliente / Tomador', 'Regime', 'Faturamento Atual', 'Carga Trib. Atual', 
    'Tributos "Dentro"', 'Custo S/ Tributos', 'Carga S/ Crédito', 'Novo Custo "Dentro"', 
    'IVA (Por Fora)', 'Nova NF Cheia', 'Crédito IBS', 'Crédito CBS', 
    'Novo Custo Efetivo', 'Variação (R$)', 'Variação (%)', 
    'Novo Custo Efetivo', 'Variação (R$)', 'Variação (%)'
  ];
  
  ws6.getRow(3).values = headers6;
  ws6.getRow(3).eachCell(cell => {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: {style:'thin'}, top: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
  });

  impactoClientes.forEach(ic => {
    ws6.addRow([
      ic.nome, ic.regime, ic.faturamentoAtual, ic.cargaAtual, ic.tributosDentroAtual,
      ic.custoSemTributos, ic.cargaSemCredito, ic.novoCustoDentro, ic.ivaPorFora, ic.novaNfCheia,
      ic.creditoIbs, ic.creditoCbs, 
      ic.novoCustoEfetivoAproveitando, ic.variacaoReaisAproveitando, ic.variacaoPctAproveitando,
      ic.novoCustoEfetivoNaoAproveitando, ic.variacaoReaisNaoAproveitando, ic.variacaoPctNaoAproveitando
    ]);
  });
  
  // Apply formatting for money and percentages
  for (let row = 4; row <= 3 + impactoClientes.length; row++) {
    const moneyCols = [3,5,6,8,10,11,12,13,14,16,17];
    const pctCols = [4,7,9,15,18];
    moneyCols.forEach(c => ws6.getCell(row, c).numFmt = '"R$ "#,##0.00');
    pctCols.forEach(c => ws6.getCell(row, c).numFmt = '0.00%');
  }

  ws6.columns.forEach((c, i) => {
    if(i === 0) c.width = 30;
    else if(i === 1) c.width = 15;
    else c.width = 14;
  });

  // ==========================================
  // ABA 6: Dashboard
  // ==========================================
  const ws5 = workbook.addWorksheet('6. Dashboard', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  
  ws5.getColumn('A').width = 15;
  ws5.getColumn('B').width = 25;
  ws5.getColumn('C').width = 20;
  ws5.getColumn('D').width = 20;
  ws5.getColumn('E').width = 25;
  ws5.getColumn('F').width = 20;
  ws5.getColumn('G').width = 25;
  ws5.getColumn('H').width = 22;
  ws5.getColumn('I').width = 35;

  ws5.mergeCells('A1:I1');
  const dashTitle = ws5.getCell('A1');
  dashTitle.value = 'DASHBOARD DE DIAGNÓSTICO TRIBUTÁRIO - SIMPLES NACIONAL';
  dashTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  dashTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  dashTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  ws5.getRow(1).height = 30;

  // Block 1
  ws5.mergeCells('A3:D3');
  ws5.getCell('A3').value = '📊 RESUMO COMPARATIVO MENSAL';
  ws5.getCell('A3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };

  ws5.getCell('A4').value = 'Indicador Tributário';
  ws5.getCell('C4').value = 'Cenário 1 (Dentro)';
  ws5.getCell('D4').value = 'Cenário 2 (Fora)';
  ['A4','C4','D4'].forEach(c => {
    ws5.getCell(c).font = { bold: true };
    ws5.getCell(c).border = { bottom: {style:'thin'} };
  });
  ws5.getCell('A4').alignment = { horizontal: 'left' };
  ws5.getCell('C4').alignment = { horizontal: 'right' };
  ws5.getCell('D4').alignment = { horizontal: 'right' };

  ws5.getCell('A5').value = 'Faturamento Total (Mês/Ano)';
  ws5.getCell('C5').value = totalRev / 12 || 0;
  ws5.getCell('D5').value = totalRev / 12 || 0;

  const totalCustoPadrao = targetMonthIndex !== -1 ? (calculationResults[targetMonthIndex]?.valorDasPadraoTotal || 0) : (calculationResults[0]?.valorDasPadraoTotal || 0); // Need to aggregate for 'all' if needed, but for simplicity:
  let totalCustoPorFora = 0;
  let diferenca = 0;
  let custoPadraoAgregado = 0;

  if (targetMonthIndex === -1) {
    for(let i=0; i<12; i++) {
      custoPadraoAgregado += calculationResults[i]?.valorDasPadraoTotal || 0;
      totalCustoPorFora += calculationResults[i]?.custoEfetivoPorFora || 0;
      diferenca += calculationResults[i]?.diferenca || 0;
    }
  } else {
    custoPadraoAgregado = calculationResults[targetMonthIndex]?.valorDasPadraoTotal || 0;
    totalCustoPorFora = calculationResults[targetMonthIndex]?.custoEfetivoPorFora || 0;
    diferenca = calculationResults[targetMonthIndex]?.diferenca || 0;
  }

  ws5.getCell('A6').value = 'Custo Tributário Efetivo';
  ws5.getCell('C6').value = custoPadraoAgregado;
  ws5.getCell('D6').value = totalCustoPorFora;

  ws5.getCell('A7').value = 'Diferença (Economia / Prejuízo)';
  ws5.mergeCells('C7:D7');
  ws5.getCell('C7').value = diferenca;
  ws5.getCell('C7').font = { bold: true, color: { argb: 'FF75B743' } };
  ws5.getCell('C7').alignment = { horizontal: 'center' };

  ws5.getCell('A8').value = 'Veredito Recomendado';
  ws5.mergeCells('C8:D8');
  ws5.getCell('C8').value = 'MIGRAR PARA O CENÁRIO 2 (POR FORA)';
  ws5.getCell('C8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('C8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  ws5.getCell('C8').alignment = { horizontal: 'center' };

  ['C5','D5','C6','D6','C7'].forEach(c => ws5.getCell(c).numFmt = '"R$ "#,##0.00');

  // Block 2
  ws5.mergeCells('F3:I3');
  ws5.getCell('F3').value = '📈 ANÁLISE DO PONTO DE EQUILÍBRIO';
  ws5.getCell('F3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('F3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };

  ws5.getCell('F4').value = 'Indicador de Viabilidade';
  ws5.mergeCells('H4:I4');
  ws5.getCell('H4').value = 'Métrica / Valor';
  ['F4','H4'].forEach(c => {
    ws5.getCell(c).font = { bold: true };
    ws5.getCell(c).border = { bottom: {style:'thin'} };
    ws5.getCell(c).alignment = { horizontal: 'right' };
  });
  ws5.getCell('F4').alignment = { horizontal: 'left' };

  ws5.mergeCells('F5:G5');
  ws5.getCell('F5').value = 'Despesas Atuais Elegíveis a Crédito';
  ws5.mergeCells('H5:I5');
  ws5.getCell('H5').value = targetMonthIndex === -1 ? totalExp / 12 || 0 : totalExp;
  
  const metaDespesas = targetMonthIndex !== -1 ? (calculationResults[targetMonthIndex]?.metaDespesas || 0) : (calculationResults[0]?.metaDespesas || 0);
  ws5.mergeCells('F6:G6');
  ws5.getCell('F6').value = 'Meta de Despesas (Break-Even)';
  ws5.mergeCells('H6:I6');
  ws5.getCell('H6').value = metaDespesas;

  ws5.mergeCells('F7:G7');
  ws5.getCell('F7').value = 'Percentual Atingido';
  ws5.mergeCells('H7:I7');
  const expToCompare = targetMonthIndex === -1 ? totalExp / 12 : totalExp;
  const pctAtingido = metaDespesas > 0 ? expToCompare / metaDespesas : 0;
  ws5.getCell('H7').value = pctAtingido;
  ws5.getCell('H7').numFmt = '0.0%';
  ws5.getCell('H7').font = { bold: true, color: { argb: 'FF75B743' } };

  ws5.mergeCells('F8:G8');
  ws5.getCell('F8').value = 'Viabilidade da Transição';
  ws5.mergeCells('H8:I8');
  ws5.getCell('H8').value = 'Cenário 2 Viável (Crédito é Suficiente)';
  ws5.getCell('H8').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('H8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
  ws5.getCell('H8').alignment = { horizontal: 'center' };

  ['H5','H6'].forEach(c => ws5.getCell(c).numFmt = '"R$ "#,##0.00');
  ['H5','H6','H7'].forEach(c => ws5.getCell(c).alignment = { horizontal: 'right' });


  // Block 3
  ws5.mergeCells('A10:D10');
  ws5.getCell('A10').value = '💼 Faturamento por Regime de Tomador';
  ws5.getCell('A10').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };

  ws5.mergeCells('A11:B11');
  ws5.getCell('A11').value = 'Regime do Cliente Tomador';
  ws5.getCell('C11').value = 'Volume';
  ws5.getCell('D11').value = 'Proporção';
  ['A11','C11','D11'].forEach(c => {
    ws5.getCell(c).font = { bold: true };
    ws5.getCell(c).border = { bottom: {style:'thin'} };
  });
  ws5.getCell('A11').alignment = { horizontal: 'left' };
  ws5.getCell('C11').alignment = { horizontal: 'right' };
  ws5.getCell('D11').alignment = { horizontal: 'right' };

  const regimesFat = ['Lucro Real', 'Lucro Presumido', 'Simples Nacional', 'Isento de IRPJ', 'Pessoa Física'];
  
  const fatPorRegime: Record<string, number> = {};
  let fatTotalAgrupado = 0;
  filteredFaturamento.forEach(x => {
    const r = regimesFat.includes(x.regime) ? x.regime : 'Pessoa Física';
    fatPorRegime[r] = (fatPorRegime[r] || 0) + (Number(x.valor) || 0);
    fatTotalAgrupado += (Number(x.valor) || 0);
  });

  let rowIdx = 12;
  regimesFat.forEach(r => {
    ws5.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws5.getCell(`A${rowIdx}`).value = r;
    const vol = fatPorRegime[r] || 0;
    ws5.getCell(`C${rowIdx}`).value = vol;
    ws5.getCell(`D${rowIdx}`).value = fatTotalAgrupado > 0 ? vol / fatTotalAgrupado : 0;
    ws5.getCell(`C${rowIdx}`).numFmt = '"R$ "#,##0.00';
    ws5.getCell(`D${rowIdx}`).numFmt = '0.0%';
    rowIdx++;
  });
  ws5.mergeCells(`A${rowIdx}:B${rowIdx}`);
  ws5.getCell(`A${rowIdx}`).value = 'TOTAL';
  ws5.getCell(`A${rowIdx}`).font = { bold: true };
  ws5.getCell(`C${rowIdx}`).value = fatTotalAgrupado;
  ws5.getCell(`C${rowIdx}`).font = { bold: true };
  ws5.getCell(`D${rowIdx}`).value = 1;
  ws5.getCell(`D${rowIdx}`).font = { bold: true };
  ws5.getCell(`C${rowIdx}`).numFmt = '"R$ "#,##0.00';
  ws5.getCell(`D${rowIdx}`).numFmt = '0.0%';


  // Block 4
  ws5.mergeCells('F10:I10');
  ws5.getCell('F10').value = '🛒 Despesas por Regime de Fornecedor';
  ws5.getCell('F10').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws5.getCell('F10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };

  ws5.mergeCells('F11:G11');
  ws5.getCell('F11').value = 'Regime do Fornecedor';
  ws5.getCell('H11').value = 'Volume';
  ws5.getCell('I11').value = 'Proporção';
  ['F11','H11','I11'].forEach(c => {
    ws5.getCell(c).font = { bold: true };
    ws5.getCell(c).border = { bottom: {style:'thin'} };
  });
  ws5.getCell('F11').alignment = { horizontal: 'left' };
  ws5.getCell('H11').alignment = { horizontal: 'right' };
  ws5.getCell('I11').alignment = { horizontal: 'right' };

  const despesasPorRegime: Record<string, number> = {};
  let despTotalAgrupado = 0;
  filteredDespesas.forEach(x => {
    const r = regimesFat.includes(x.regime) ? x.regime : 'Pessoa Física';
    despesasPorRegime[r] = (despesasPorRegime[r] || 0) + (Number(x.valor) || 0);
    despTotalAgrupado += (Number(x.valor) || 0);
  });

  rowIdx = 12;
  regimesFat.forEach(r => {
    ws5.mergeCells(`F${rowIdx}:G${rowIdx}`);
    ws5.getCell(`F${rowIdx}`).value = r;
    const vol = despesasPorRegime[r] || 0;
    ws5.getCell(`H${rowIdx}`).value = vol;
    ws5.getCell(`I${rowIdx}`).value = despTotalAgrupado > 0 ? vol / despTotalAgrupado : 0;
    ws5.getCell(`H${rowIdx}`).numFmt = '"R$ "#,##0.00';
    ws5.getCell(`I${rowIdx}`).numFmt = '0.0%';
    rowIdx++;
  });
  ws5.mergeCells(`F${rowIdx}:G${rowIdx}`);
  ws5.getCell(`F${rowIdx}`).value = 'TOTAL';
  ws5.getCell(`F${rowIdx}`).font = { bold: true };
  ws5.getCell(`H${rowIdx}`).value = despTotalAgrupado;
  ws5.getCell(`H${rowIdx}`).font = { bold: true };
  ws5.getCell(`I${rowIdx}`).value = 1;
  ws5.getCell(`I${rowIdx}`).font = { bold: true };
  ws5.getCell(`H${rowIdx}`).numFmt = '"R$ "#,##0.00';
  ws5.getCell(`I${rowIdx}`).numFmt = '0.0%';

  // EVOLUÇÃO TRIBUTÁRIA E COMPARATIVO MENSAL
  ws5.mergeCells('A19:I19');
  ws5.getCell('A19').value = 'EVOLUÇÃO TRIBUTÁRIA E COMPARATIVO MENSAL';
  ws5.getCell('A19').font = { bold: true, size: 12 };
  ws5.getCell('A19').alignment = { horizontal: 'center' };

  const hRow = 20;
  ws5.getCell(`A${hRow}`).value = 'Mês';
  ws5.getCell(`B${hRow}`).value = 'Faturamento';
  ws5.getCell(`C${hRow}`).value = 'Cenário 1: Custo DAS';
  ws5.getCell(`D${hRow}`).value = 'Cenário 1: Crédito B2B';
  ws5.getCell(`E${hRow}`).value = 'Cenário 2: Custo DAS Reduzido';
  ws5.getCell(`F${hRow}`).value = 'Cenário 2: Saldo IVA';
  ws5.getCell(`G${hRow}`).value = 'Cenário 2: Custo Efetivo';
  ws5.getCell(`H${hRow}`).value = 'Economia Mensal';
  ws5.getCell(`I${hRow}`).value = 'Decisão Recomendada';

  ['A','B','C','D','E','F','G','H','I'].forEach(col => {
    ws5.getCell(`${col}${hRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    ws5.getCell(`${col}${hRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005696' } };
    let align = 'right';
    if (col === 'A') align = 'left';
    if (col === 'I') align = 'center';
    ws5.getCell(`${col}${hRow}`).alignment = { horizontal: align as any, vertical: 'middle', wrapText: true };
  });

  const allMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthsToRender = targetMonthIndex === -1 ? allMonths : [allMonths[targetMonthIndex]];
  const monthIndices = targetMonthIndex === -1 ? [0,1,2,3,4,5,6,7,8,9,10,11] : [targetMonthIndex];

  let currentR = 21;
  monthIndices.forEach((monthIndex, idx) => {
    const m = monthsToRender[idx];
    const res = calculationResults[monthIndex];
    ws5.getCell(`A${currentR}`).value = m;
    ws5.getCell(`B${currentR}`).value = revenueData[monthIndex]?.rba || 0;
    ws5.getCell(`C${currentR}`).value = res?.valorDasPadraoTotal || 0;
    ws5.getCell(`D${currentR}`).value = 0; // Crédito B2B placeholder
    ws5.getCell(`E${currentR}`).value = res?.valorDasPorForaTotal || 0;
    ws5.getCell(`F${currentR}`).value = res?.saldoIva || 0;
    ws5.getCell(`G${currentR}`).value = res?.custoEfetivoPorFora || 0;
    ws5.getCell(`H${currentR}`).value = res?.diferenca || 0;
    ws5.getCell(`I${currentR}`).value = (res?.diferenca || 0) > 0 ? 'Regime Por Fora (Cenário 2)' : 'Indiferente';
    ws5.getCell(`I${currentR}`).font = { color: { argb: (res?.diferenca || 0) > 0 ? 'FF005696' : 'FF9CA3AF' }, bold: (res?.diferenca || 0) > 0 };
    ws5.getCell(`I${currentR}`).alignment = { horizontal: 'center' };

    ['B','C','D','E','F','G','H'].forEach(col => {
      ws5.getCell(`${col}${currentR}`).numFmt = '"R$ "#,##0.00';
    });
    currentR++;
  });

  ws5.getCell(`A${currentR}`).value = 'TOTAL ACUMULADO';
  ws5.getCell(`A${currentR}`).font = { bold: true };
  // Setup formulas
  ['B','C','D','E','F','G','H'].forEach(col => {
    ws5.getCell(`${col}${currentR}`).value = { formula: `SUM(${col}21:${col}${currentR - 1})` };
    ws5.getCell(`${col}${currentR}`).font = { bold: true };
    ws5.getCell(`${col}${currentR}`).numFmt = '"R$ "#,##0.00';
  });
  ws5.getCell(`I${currentR}`).value = { formula: `IF(H${currentR}>0,"Regime Por Fora (Cenário 2)","Indiferente")` };
  ws5.getCell(`I${currentR}`).font = { bold: true, color: { argb: 'FF005696' } };
  ws5.getCell(`I${currentR}`).alignment = { horizontal: 'center' };

  // Impacto por Cliente block was moved above

  // Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Planejamento_Tributario_${companyData.razaoSocial || 'Cliente'}.xlsx`);
};
