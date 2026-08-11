import { SIMPLES_TABLES, SIMPLES_TABLES_DEFINITIVA, SIMPLES_PARTILHA } from './tax-tables';

export interface TaxCalculatorParams {
  rbt12: number;
  activeYear: '2026' | '2029' | '2030' | '2031' | '2032' | 'definitivo';
  ultrapassouSublimiteAnual: boolean;
  redutorIbsCbs: number; // e.g., 0, 0.30, 0.60
  
  aliqIbsDebitoOriginal: number; // percentage (e.g., 0.01 for 1%)
  aliqCbsDebitoOriginal: number;
  aliqIbsCredito: number;
  aliqCbsCredito: number;
  
  snRegimeCredito: 'porDentro' | 'porFora';
  snAliqDentro: number;
  snAliqIbsFora: number;
  snAliqCbsFora: number;
  
  creditoEstoqueVal: number;
  
  anexos: {
    [key: string]: {
      active: boolean;
      receitaMercadoInterno: number;
      receitaMercadoExterno: number;
      isIcmsStSegregado: boolean;
      receitaComIcmsSt: number;
    }
  };
  
  expenses: {
    totalCreditoBruto: number;
    totalCreditoReduzido30: number;
    totalCreditoSimplesNacional: number;
    totalCreditoSimplesNacionalReduzido30: number;
  };
}

export interface TaxCalculatorResult {
  rbaTotal: number;
  valorDasPadraoTotal: number;
  valorDasPorForaTotal: number;
  
  creditoB2BTotal: number;
  creditoB2BIbsTotal: number;
  creditoB2BCbsTotal: number;
  
  debitoIbs: number;
  debitoCbs: number;
  creditoIbs: number;
  creditoCbs: number;
  
  baseCredito: number;
  saldoIva: number;
  custoEfetivoPorFora: number;
  
  metaDespesas: number;
  diferenca: number;
  
  aliqEfetivaPadrao: number;
  aliqEfetivaPorFora: number;
  cargaTributariaPorFora: number;
  
  c1Taxes: Record<string, number>;
  c1Aliquots: Record<string, number>;
  c2Taxes: Record<string, number>;
}

export function calculateResults(params: TaxCalculatorParams): TaxCalculatorResult {
  const { rbt12, activeYear, ultrapassouSublimiteAnual, anexos, expenses } = params;

  let rbaTotal = 0;
  let valorDasPadraoTotal = 0;
  let valorDasPorForaTotal = 0;
  let creditoB2BTotal = 0;
  let creditoB2BIbsTotal = 0;
  let creditoB2BCbsTotal = 0;
  
  const c1Taxes: Record<string, number> = {};
  const c1Aliquots: Record<string, number> = {};
  const c2Taxes: Record<string, number> = {};

  const isTransition = (activeYear === '2026');
  const tableSource = activeYear === 'definitivo' ? SIMPLES_TABLES_DEFINITIVA : SIMPLES_TABLES;

  for (let i = 1; i <= 5; i++) {
    const anexoKey = i.toString();
    const anexoData = anexos[anexoKey];
    
    if (!anexoData || !anexoData.active) continue;

    const rbaAnexo = anexoData.receitaMercadoInterno + anexoData.receitaMercadoExterno;
    rbaTotal += rbaAnexo;

    if (rbaAnexo <= 0) continue;

    let aliqNominal = 0;
    let parcela = 0;

    const table = tableSource[anexoKey] || tableSource['1'];
    
    // Encontrar faixa
    for (const faixa of table) {
      if (rbt12 >= faixa.min && rbt12 <= faixa.max) {
        aliqNominal = faixa.nom;
        parcela = faixa.pd;
        break;
      }
    }
    
    if (rbt12 > 4800000) {
      const lastFaixa = table[5];
      aliqNominal = lastFaixa.nom;
      parcela = lastFaixa.pd;
    }

    // Fórmula Alíquota Efetiva
    let aliqEfetivaPadrao = rbt12 > 0 ? ((rbt12 * aliqNominal) - parcela) / rbt12 : aliqNominal;
    if (aliqEfetivaPadrao < 0) aliqEfetivaPadrao = 0;

    // Arredondar para 6 casas decimais
    const aliqEfetivaPadraoFull = Math.round(aliqEfetivaPadrao * 1000000) / 1000000;

    // Encontrar o índice da faixa (1 a 6) para partilha
    let faixaIdx = 1;
    for (let idx = 0; idx < table.length; idx++) {
      if (rbt12 >= table[idx].min && rbt12 <= table[idx].max) {
        faixaIdx = idx + 1;
        break;
      }
    }
    if (rbt12 > 4800000) {
      faixaIdx = 6;
    }

    // Obter partilha
    const partilhaYear = activeYear === 'definitivo' ? '2032' : activeYear; // Tratando definitivo caso falte na partilha original
    const partilhasAno = SIMPLES_PARTILHA[partilhaYear] || SIMPLES_PARTILHA['2026'];
    const dist = { ...partilhasAno[anexoKey][faixaIdx] };

    // Lógica de Sublimite na Faixa 6
    if (faixaIdx === 6 && !ultrapassouSublimiteAnual) {
      const faixa5 = table[4];
      const aliqEfetiva5M = ((3600000 * faixa5.nom) - faixa5.pd) / 3600000;
      
      const dist5 = partilhasAno[anexoKey][5];
      const fixedIcmsRate = (dist5['ICMS'] || 0) * aliqEfetiva5M;
      const fixedIssRate = (dist5['ISS'] || 0) * aliqEfetiva5M;
      const fixedIbsRate = (dist5['IBS'] || 0) * aliqEfetiva5M;
      
      dist['ICMS'] = aliqEfetivaPadraoFull > 0 ? (fixedIcmsRate / aliqEfetivaPadraoFull) : 0;
      dist['ISS'] = aliqEfetivaPadraoFull > 0 ? (fixedIssRate / aliqEfetivaPadraoFull) : 0;
      dist['IBS'] = aliqEfetivaPadraoFull > 0 ? (fixedIbsRate / aliqEfetivaPadraoFull) : 0;
    }

    // Segregação ICMS-ST (Anexos 1 e 2)
    let percIcmsSt = 0;
    let percIcmsNormal = 1;

    if (anexoKey === '1' || anexoKey === '2') {
      if (anexoData.isIcmsStSegregado) {
        percIcmsSt = (anexoData.receitaComIcmsSt || 0) / rbaAnexo;
        if (percIcmsSt > 1) percIcmsSt = 1;
        percIcmsNormal = 1 - percIcmsSt;
      }
    }

    let fractionPadrao = 1;
    if (faixaIdx === 6 && !ultrapassouSublimiteAnual) {
      fractionPadrao = 1 + (dist['ICMS'] || 0) + (dist['ISS'] || 0) + (dist['IBS'] || 0);
    }
    
    const fractionIcmsTotal = dist['ICMS'] || 0;
    
    if (fractionIcmsTotal > 0 && percIcmsSt > 0) {
      const icmsDeduzido = fractionIcmsTotal * percIcmsSt;
      fractionPadrao -= icmsDeduzido;
      dist['ICMS'] = fractionIcmsTotal * percIcmsNormal;
    }

    aliqEfetivaPadrao = Math.round(aliqEfetivaPadraoFull * fractionPadrao * 1000000) / 1000000;

    // Calcular B2B IBS/CBS credit (transferido no Por Dentro)
    const aliqEfetivaIbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['IBS'] || 0) * 1000000) / 1000000;
    const aliqEfetivaCbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['CBS'] || 0) * 1000000) / 1000000;
    
    creditoB2BIbsTotal += rbaAnexo * aliqEfetivaIbsDentro;
    creditoB2BCbsTotal += rbaAnexo * aliqEfetivaCbsDentro;

    // Cenário 2 (Por Fora) - dasFractionPorFora
    let dasFractionPorFora = fractionPadrao - (dist['CBS'] || 0) - (dist['IBS'] || 0);
    dasFractionPorFora = Math.round(dasFractionPorFora * 1000000) / 1000000;

    const aliqEfetivaPorFora = Math.round(aliqEfetivaPadraoFull * dasFractionPorFora * 1000000) / 1000000;
    
    const valorDasPadraoAnexo = Math.round(rbaAnexo * aliqEfetivaPadrao * 100) / 100;
    const valorDasPorForaAnexo = Math.round(rbaAnexo * aliqEfetivaPorFora * 100) / 100;

    valorDasPadraoTotal += valorDasPadraoAnexo;
    valorDasPorForaTotal += valorDasPorForaAnexo;

    // Popula c1Taxes com o valor distribuído por tributo
    const valorDasCheioAnexo = Math.round(rbaAnexo * aliqEfetivaPadraoFull * 100) / 100;
    for (const tributo in dist) {
      let val1 = valorDasCheioAnexo * (dist as any)[tributo];
      if (tributo === 'ICMS' && percIcmsSt > 0) {
        val1 = val1 * (1 - percIcmsSt);
      }
      val1 = Math.round(val1 * 100) / 100;
      c1Taxes[tributo] = (c1Taxes[tributo] || 0) + val1;
      
      // Armazena a alíquota de distribuição do Simples Nacional (ex: 0.055 para 5.5%)
      c1Aliquots[tributo] = (dist as any)[tributo];

      // Popula c2Taxes (Tributos Residuais, sem IBS e CBS)
      if (tributo !== 'IBS' && tributo !== 'CBS') {
        let val2 = valorDasCheioAnexo * (dist as any)[tributo];
        if (tributo === 'ICMS' && percIcmsSt > 0) {
          val2 = val2 * (1 - percIcmsSt);
        }
        val2 = Math.round(val2 * 100) / 100;
        c2Taxes[tributo] = (c2Taxes[tributo] || 0) + val2;
      }
    }
  }

  // IVA Calculations
  const fatorPagamentoIva = 1 - params.redutorIbsCbs;
  const fatorIbs = isTransition ? 1 : fatorPagamentoIva;
  const fatorCbs = isTransition ? 1 : fatorPagamentoIva;

  const aliqIbsDebito = params.aliqIbsDebitoOriginal * fatorIbs;
  const aliqCbsDebito = params.aliqCbsDebitoOriginal * fatorCbs;

  const debitoIbs = rbaTotal * aliqIbsDebito;
  const debitoCbs = rbaTotal * aliqCbsDebito;
  const totalDebitos = debitoIbs + debitoCbs;

  creditoB2BTotal = creditoB2BIbsTotal + creditoB2BCbsTotal;

  // Créditos Despesas
  const taxaTotalCredito = params.aliqIbsCredito + params.aliqCbsCredito;
  const { totalCreditoBruto, totalCreditoReduzido30, totalCreditoSimplesNacional, totalCreditoSimplesNacionalReduzido30 } = expenses;

  const baseCredito = totalCreditoBruto + totalCreditoReduzido30 + totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30;

  const creditoIbsNormal = totalCreditoBruto * params.aliqIbsCredito;
  const creditoCbsNormal = totalCreditoBruto * params.aliqCbsCredito;
  
  const creditoIbsReduzido = totalCreditoReduzido30 * (params.aliqIbsCredito * 0.70);
  const creditoCbsReduzido = totalCreditoReduzido30 * (params.aliqCbsCredito * 0.70);

  let creditoIbsSimples = 0;
  let creditoCbsSimples = 0;
  
  if (params.snRegimeCredito === 'porDentro') {
    const proportionIbs = taxaTotalCredito > 0 ? (params.aliqIbsCredito / taxaTotalCredito) : 0;
    const proportionCbs = taxaTotalCredito > 0 ? (params.aliqCbsCredito / taxaTotalCredito) : 0;
    creditoIbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * params.snAliqDentro * proportionIbs;
    creditoCbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * params.snAliqDentro * proportionCbs;
  } else {
    creditoIbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * params.snAliqIbsFora;
    creditoCbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * params.snAliqCbsFora;
  }

  const creditoIbs = creditoIbsNormal + creditoIbsReduzido + creditoIbsSimples;
  const creditoCbs = creditoCbsNormal + creditoCbsReduzido + creditoCbsSimples;
  
  const totalCreditos = creditoIbs + creditoCbs + params.creditoEstoqueVal;
  
  const saldoIva = totalDebitos - totalCreditos;
  const custoEfetivoPorFora = valorDasPorForaTotal + saldoIva;

  // Break-Even
  const custoSemCreditosDespesas = valorDasPorForaTotal + totalDebitos;
  const custoExtraBruto = custoSemCreditosDespesas - valorDasPadraoTotal;
  
  let metaDespesas = 0;
  if (valorDasPadraoTotal > 0 && taxaTotalCredito > 0) {
    if (custoExtraBruto > 0) {
      metaDespesas = custoExtraBruto / taxaTotalCredito;
    }
  }

  const diferenca = valorDasPadraoTotal - custoEfetivoPorFora;

  const aliqEfetivaPadrao = rbaTotal > 0 ? valorDasPadraoTotal / rbaTotal : 0;
  const aliqEfetivaPorFora = rbaTotal > 0 ? valorDasPorForaTotal / rbaTotal : 0;
  const cargaTributariaPorFora = rbaTotal > 0 ? custoEfetivoPorFora / rbaTotal : 0;

  return {
    rbaTotal,
    valorDasPadraoTotal,
    valorDasPorForaTotal,
    creditoB2BTotal,
    creditoB2BIbsTotal,
    creditoB2BCbsTotal,
    debitoIbs,
    debitoCbs,
    creditoIbs,
    creditoCbs,
    baseCredito,
    saldoIva,
    custoEfetivoPorFora,
    metaDespesas,
    diferenca,
    aliqEfetivaPadrao,
    aliqEfetivaPorFora,
    cargaTributariaPorFora,
    c1Taxes,
    c1Aliquots,
    c2Taxes
  };
}
