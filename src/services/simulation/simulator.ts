import { CompanyData, RevenueData, SimulationParams, useDiagnosisStore } from '../../store/useDiagnosisStore';
import { ParsedXmlSales, ParsedXmlExpense, ProdutoDetalhado } from '../../domain/types/xml.types';
import { SIMPLES_TABLES, SIMPLES_TABLES_DEFINITIVA, SIMPLES_PARTILHA } from './constants';
import { AnexoId } from '../../domain/types/tax.types';

export interface SimulationResult {
  rbaTotal: number;
  valorDasPadraoTotal: number;
  creditoB2BTotal: number;
  creditoB2BIbsTotal: number;
  creditoB2BCbsTotal: number;
  valorDasPorForaTotal: number;
  debitoIbs: number;
  debitoCbs: number;
  creditoIbs: number;
  creditoCbs: number;
  saldoIva: number;
  custoEfetivoPorFora: number;
  economia: number;
  totalExpenses: number;
  c1Taxes: Record<string, number>;
  c2Taxes: Record<string, number>;
  taxaTotalCredito: number;
  totalCreditoBruto: number;
  totalCreditoReduzido30: number;
  totalCreditoSimplesNacional: number;
  totalCreditoSimplesNacionalReduzido30: number;
}

export function calculateSimulation(
  revenueData: RevenueData, 
  simulationParams: SimulationParams, 
  xmlDespesas: ParsedXmlExpense[],
  xmlFaturamento: ParsedXmlSales[] // Para B2B ratio no laudo, embora o faturamento base venha do revenueData para o DAS
): SimulationResult {
  const rbt12 = revenueData.rbt12 || 0;
  
  // As receitas da competência selecionada são somadas a partir do revenueData.anexosData
  let rbaTotal = 0;
  let rbaExternoTotal = 0;
  let rbaInternoTotal = 0;
  let valorDasPadraoTotal = 0;
  let valorDasPorForaTotal = 0;
  let creditoB2BIbsTotal = 0;
  let creditoB2BCbsTotal = 0;
  let c1Taxes: Record<string, number> = {};
  let c2Taxes: Record<string, number> = {};

  const activeYear = simulationParams.anoSimulacao || '2026';
  const isTransition = (activeYear !== 'definitivo');

  // As alíquotas vêm em % (ex: 0.12 para 12%)
  const aliqIbsDebito = simulationParams.faturamentoAliquotaIBS / 100;
  const aliqCbsDebito = simulationParams.faturamentoAliquotaCBS / 100;
  const aliqIbsCredito = simulationParams.despesasAliquotaIBS / 100;
  const aliqCbsCredito = simulationParams.despesasAliquotaCBS / 100;
  const taxaTotalCredito = aliqIbsCredito + aliqCbsCredito;

  // Calcula Anexos
  revenueData.anexosAtivos.forEach((anexo: AnexoId) => {
    const dadosAnexo = revenueData.anexosData[anexo];
    const rbaAnexoInterno = dadosAnexo.mercadoInterno || 0;
    const rbaAnexoExterno = dadosAnexo.mercadoExterno || 0;
    const rbaAnexo = rbaAnexoInterno + rbaAnexoExterno;

    rbaInternoTotal += rbaAnexoInterno;
    rbaExternoTotal += rbaAnexoExterno;
    rbaTotal += rbaAnexo;

    if (rbaAnexo <= 0) return;

    let aliqNominal = 0;
    let parcela = 0;

    const tableSource = activeYear === 'definitivo' ? SIMPLES_TABLES_DEFINITIVA : SIMPLES_TABLES;
    const table = tableSource[anexo] || tableSource['1'];
    
    for (let faixa of table) {
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

    let aliqEfetivaPadrao = 0;
    if (rbt12 > 0) {
      aliqEfetivaPadrao = ((rbt12 * aliqNominal) - parcela) / rbt12;
    } else {
      aliqEfetivaPadrao = aliqNominal;
    }

    if (aliqEfetivaPadrao < 0) aliqEfetivaPadrao = 0;

    let aliqEfetivaPadraoFull = Math.round(aliqEfetivaPadrao * 1000000) / 1000000;
    let valorDasCheioAnexo = rbaAnexo * aliqEfetivaPadraoFull;

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

    // Clone da partilha
    let dist = { ...SIMPLES_PARTILHA[activeYear][anexo][faixaIdx] };

    const ultrapassouSublimite = simulationParams.ultrapassouSublimite || false;
    
    if (faixaIdx === 6 && !ultrapassouSublimite) {
      const faixa5 = table[4];
      const nominal5 = faixa5.nom;
      const pd5 = faixa5.pd;
      const aliqEfetiva5M = ((3600000 * nominal5) - pd5) / 3600000;
      
      const dist5 = SIMPLES_PARTILHA[activeYear][anexo][5];
      const fixedIcmsRate = (dist5['ICMS'] || 0) * aliqEfetiva5M;
      const fixedIssRate = (dist5['ISS'] || 0) * aliqEfetiva5M;
      const fixedIbsRate = (dist5['IBS'] || 0) * aliqEfetiva5M;
      
      dist['ICMS'] = aliqEfetivaPadraoFull > 0 ? (fixedIcmsRate / aliqEfetivaPadraoFull) : 0;
      dist['ISS'] = aliqEfetivaPadraoFull > 0 ? (fixedIssRate / aliqEfetivaPadraoFull) : 0;
      dist['IBS'] = aliqEfetivaPadraoFull > 0 ? (fixedIbsRate / aliqEfetivaPadraoFull) : 0;
    }

    let percIcmsSt = 0;
    let percIcmsNormal = 1;
    let isIcmsStSegregado = false;

    if (anexo === '1' || anexo === '2') {
      isIcmsStSegregado = dadosAnexo.isIcmsStSegregado || false;
      if (isIcmsStSegregado) {
        let comSt = dadosAnexo.receitaComIcmsSt || 0;
        percIcmsSt = comSt / rbaAnexo;
        if (percIcmsSt > 1) percIcmsSt = 1;
        percIcmsNormal = 1 - percIcmsSt;
      }
    }

    let fractionPadrao = 1;
    if (faixaIdx === 6 && !ultrapassouSublimite) {
      fractionPadrao = 1 + (dist['ICMS'] || 0) + (dist['ISS'] || 0) + (dist['IBS'] || 0);
    }
    let fractionIcmsTotal = dist['ICMS'] || 0;
    
    if (fractionIcmsTotal > 0 && percIcmsSt > 0) {
      let icmsDeduzido = fractionIcmsTotal * percIcmsSt;
      fractionPadrao -= icmsDeduzido;
      dist['ICMS'] = fractionIcmsTotal * percIcmsNormal;
    }

    aliqEfetivaPadrao = Math.round(aliqEfetivaPadraoFull * fractionPadrao * 1000000) / 1000000;

    let aliqEfetivaIbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['IBS'] || 0) * 1000000) / 1000000;
    let aliqEfetivaCbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['CBS'] || 0) * 1000000) / 1000000;
    creditoB2BIbsTotal += rbaAnexo * aliqEfetivaIbsDentro;
    creditoB2BCbsTotal += rbaAnexo * aliqEfetivaCbsDentro;

    let dasFractionPorFora = fractionPadrao - (dist['CBS'] || 0) - (dist['IBS'] || 0);
    dasFractionPorFora = Math.round(dasFractionPorFora * 1000000) / 1000000;

    const aliqEfetivaPorFora = Math.round(aliqEfetivaPadraoFull * dasFractionPorFora * 1000000) / 1000000;
    
    let valorDasPadraoAnexo = Math.round(rbaAnexo * aliqEfetivaPadrao * 100) / 100;
    let valorDasPorForaAnexo = Math.round(rbaAnexo * aliqEfetivaPorFora * 100) / 100;

    valorDasPadraoTotal += valorDasPadraoAnexo;
    valorDasPorForaTotal += valorDasPorForaAnexo;

    for (let tributo in dist) {
      let val1 = valorDasCheioAnexo * dist[tributo];
      if (tributo === 'ICMS' && percIcmsSt > 0) {
        val1 = val1 * (1 - percIcmsSt);
      }
      val1 = Math.round(val1 * 100) / 100;
      c1Taxes[tributo] = (c1Taxes[tributo] || 0) + val1;

      if (tributo !== 'IBS' && tributo !== 'CBS') {
        let val2 = valorDasCheioAnexo * dist[tributo];
        if (tributo === 'ICMS' && percIcmsSt > 0) {
          val2 = val2 * (1 - percIcmsSt);
        }
        val2 = Math.round(val2 * 100) / 100;
        c2Taxes[tributo] = (c2Taxes[tributo] || 0) + val2;
      }
    }
  });

  // Cálculo de Débitos
  let debitoIbs = rbaTotal * aliqIbsDebito;
  let debitoCbs = rbaTotal * aliqCbsDebito;
  let creditoB2BTotal = creditoB2BIbsTotal + creditoB2BCbsTotal;

  // Agregação de Despesas dos XMLs
  let totalCreditoBruto = 0;
  let totalCreditoReduzido30 = 0;
  let totalCreditoSimplesNacional = 0;
  let totalCreditoSimplesNacionalReduzido30 = 0;

  xmlDespesas.forEach(despesa => {
    let valorLiquidoTotal = despesa.valor;
    
    // Subtrai deduções agregadas se não tiver produtos detalhados
    if (!despesa.produtosDetalhados || despesa.produtosDetalhados.length === 0) {
       valorLiquidoTotal = valorLiquidoTotal - (despesa.deducoes?.icms || 0) - (despesa.deducoes?.pisCofins || 0) - (despesa.deducoes?.iss || 0) - (despesa.deducoes?.desconto || 0);
       if (valorLiquidoTotal < 0) valorLiquidoTotal = 0;
       
       if (despesa.regime === "Simples Nacional") {
           totalCreditoSimplesNacional += valorLiquidoTotal;
       } else {
           totalCreditoBruto += valorLiquidoTotal;
       }
    } else {
      // Usa os produtos detalhados para separar 60% e 100%
      despesa.produtosDetalhados.forEach(prod => {
        if (despesa.regime === "Simples Nacional") {
          if (prod.isAlimento60 || prod.isHigiene60) {
            totalCreditoSimplesNacionalReduzido30 += prod.valorLiquido;
          } else {
            totalCreditoSimplesNacional += prod.valorLiquido;
          }
        } else {
          if (prod.isAlimento60 || prod.isHigiene60) {
            totalCreditoReduzido30 += prod.valorLiquido;
          } else {
            totalCreditoBruto += prod.valorLiquido;
          }
        }
      });
    }
  });

  let baseCreditoNormal = totalCreditoBruto;
  let baseCredito = totalCreditoBruto + totalCreditoReduzido30 + totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30;
  let totalExpenses = baseCredito;

  const snRegimeCredito = simulationParams.regimeCreditoSn || 'porDentro';
  const snAliqDentro = simulationParams.snAliqDentro / 100;
  const snAliqIbsFora = simulationParams.snAliqIbsFora / 100;
  const snAliqCbsFora = simulationParams.snAliqCbsFora / 100;

  const creditoIbsNormal = baseCreditoNormal * aliqIbsCredito;
  const creditoCbsNormal = baseCreditoNormal * aliqCbsCredito;
  const creditoIbsReduzido = totalCreditoReduzido30 * (aliqIbsCredito * 0.70);
  const creditoCbsReduzido = totalCreditoReduzido30 * (aliqCbsCredito * 0.70);

  let creditoIbsSimples = 0;
  let creditoCbsSimples = 0;

  if (snRegimeCredito === 'porDentro') {
    const proportionIbs = taxaTotalCredito > 0 ? (aliqIbsCredito / taxaTotalCredito) : 0;
    const proportionCbs = taxaTotalCredito > 0 ? (aliqCbsCredito / taxaTotalCredito) : 0;
    creditoIbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * snAliqDentro * proportionIbs;
    creditoCbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * snAliqDentro * proportionCbs;
  } else {
    creditoIbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * snAliqIbsFora;
    creditoCbsSimples = (totalCreditoSimplesNacional + totalCreditoSimplesNacionalReduzido30 * 0.70) * snAliqCbsFora;
  }

  const creditoIbs = creditoIbsNormal + creditoIbsReduzido + creditoIbsSimples;
  const creditoCbs = creditoCbsNormal + creditoCbsReduzido + creditoCbsSimples;

  const totalDebitos = debitoIbs + debitoCbs;
  const totalCreditos = creditoIbs + creditoCbs;
  const saldoIva = totalDebitos - totalCreditos;
  
  const custoEfetivoPorFora = valorDasPorForaTotal + saldoIva;
  const economia = valorDasPadraoTotal - custoEfetivoPorFora;

  return {
    rbaTotal,
    valorDasPadraoTotal,
    creditoB2BTotal,
    creditoB2BIbsTotal,
    creditoB2BCbsTotal,
    valorDasPorForaTotal,
    debitoIbs,
    debitoCbs,
    creditoIbs,
    creditoCbs,
    saldoIva,
    custoEfetivoPorFora,
    economia,
    totalExpenses,
    c1Taxes,
    c2Taxes,
    taxaTotalCredito,
    totalCreditoBruto,
    totalCreditoReduzido30,
    totalCreditoSimplesNacional,
    totalCreditoSimplesNacionalReduzido30
  };
}
