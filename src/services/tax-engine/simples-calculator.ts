import { AnexoId, SIMPLES_TABLES, SIMPLES_TABLES_DEFINITIVA } from '../../domain/types/tax.types';

export interface CalculationParams {
  rbt12: number;
  rbaAnexo: number;
  anexo: AnexoId;
  activeYear: '2026' | 'definitivo';
  ultrapassouSublimite: boolean;
  isIcmsStSegregado?: boolean;
  percIcmsSt?: number; // 0 to 1
  partilhaTributos: Record<number, Record<string, number>>; // SIMPLES_PARTILHA[activeYear][anexo]
}

export interface CalculationResult {
  aliqNominal: number;
  parcelaDeduzir: number;
  aliqEfetivaPadraoFull: number; // Sem ST, bruta
  aliqEfetivaPadrao: number; // Com ST reduzida
  aliqEfetivaPorFora: number; // Apenas IRPJ, CSLL, CPP, ICMS (sem IBS/CBS)
  valorDasPadraoAnexo: number;
  valorDasPorForaAnexo: number;
  fractionPadrao: number;
  dasFractionPorFora: number;
  distribuicaoReal: Record<string, number>;
  creditoB2B_Ibs: number;
  creditoB2B_Cbs: number;
}

export function calculateAnexo(params: CalculationParams): CalculationResult {
  const { rbt12, rbaAnexo, anexo, activeYear, ultrapassouSublimite, isIcmsStSegregado, percIcmsSt = 0, partilhaTributos } = params;

  if (rbaAnexo <= 0) {
      throw new Error("RBA do anexo não pode ser zero ou negativo.");
  }

  const tableSource = activeYear === 'definitivo' ? SIMPLES_TABLES_DEFINITIVA : SIMPLES_TABLES;
  const table = tableSource[anexo];
  
  let aliqNominal = 0;
  let parcela = 0;
  let faixaIdx = 1;

  // Descobrir a faixa
  for (let idx = 0; idx < table.length; idx++) {
      if (rbt12 >= table[idx].min && rbt12 <= table[idx].max) {
          aliqNominal = table[idx].nom;
          parcela = table[idx].pd;
          faixaIdx = idx + 1;
          break;
      }
  }

  // Teto RBT12
  if (rbt12 > 4800000) {
      const lastFaixa = table[5];
      aliqNominal = lastFaixa.nom;
      parcela = lastFaixa.pd;
      faixaIdx = 6;
  }

  // Aliquota Efetiva Padrao
  let aliqEfetivaPadrao = 0;
  if (rbt12 > 0) {
      aliqEfetivaPadrao = ((rbt12 * aliqNominal) - parcela) / rbt12;
  } else {
      aliqEfetivaPadrao = aliqNominal;
  }

  if (aliqEfetivaPadrao < 0) aliqEfetivaPadrao = 0;

  // Arredondar para 6 casas (4 percentuais)
  const aliqEfetivaPadraoFull = Math.round(aliqEfetivaPadrao * 1000000) / 1000000;

  const dist = { ...partilhaTributos[faixaIdx] };

  // Sublimite Faixa 6
  if (faixaIdx === 6 && !ultrapassouSublimite) {
      const faixa5 = table[4];
      const aliqEfetiva5M = ((3600000 * faixa5.nom) - faixa5.pd) / 3600000;
      const dist5 = partilhaTributos[5];
      
      const fixedIcmsRate = (dist5['ICMS'] || 0) * aliqEfetiva5M;
      const fixedIssRate = (dist5['ISS'] || 0) * aliqEfetiva5M;
      const fixedIbsRate = (dist5['IBS'] || 0) * aliqEfetiva5M;
      
      dist['ICMS'] = aliqEfetivaPadraoFull > 0 ? (fixedIcmsRate / aliqEfetivaPadraoFull) : 0;
      dist['ISS'] = aliqEfetivaPadraoFull > 0 ? (fixedIssRate / aliqEfetivaPadraoFull) : 0;
      dist['IBS'] = aliqEfetivaPadraoFull > 0 ? (fixedIbsRate / aliqEfetivaPadraoFull) : 0;
  }

  // ICMS-ST (Segregação)
  let percIcmsNormal = 1;
  let fractionPadrao = 1;

  if (faixaIdx === 6 && !ultrapassouSublimite) {
      fractionPadrao = 1 + (dist['ICMS'] || 0) + (dist['ISS'] || 0) + (dist['IBS'] || 0);
  }

  if ((anexo === '1' || anexo === '2') && isIcmsStSegregado && percIcmsSt > 0) {
      percIcmsNormal = 1 - percIcmsSt;
      const fractionIcmsTotal = dist['ICMS'] || 0;
      
      const icmsDeduzido = fractionIcmsTotal * percIcmsSt;
      fractionPadrao -= icmsDeduzido;
      dist['ICMS'] = fractionIcmsTotal * percIcmsNormal;
  }

  aliqEfetivaPadrao = Math.round(aliqEfetivaPadraoFull * fractionPadrao * 1000000) / 1000000;

  // Calculo de Créditos B2B
  const aliqEfetivaIbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['IBS'] || 0) * 1000000) / 1000000;
  const aliqEfetivaCbsDentro = Math.round(aliqEfetivaPadraoFull * (dist['CBS'] || 0) * 1000000) / 1000000;
  const creditoB2B_Ibs = rbaAnexo * aliqEfetivaIbsDentro;
  const creditoB2B_Cbs = rbaAnexo * aliqEfetivaCbsDentro;

  let dasFractionPorFora = fractionPadrao - (dist['CBS'] || 0) - (dist['IBS'] || 0);
  dasFractionPorFora = Math.round(dasFractionPorFora * 1000000) / 1000000;

  const aliqEfetivaPorFora = Math.round(aliqEfetivaPadraoFull * dasFractionPorFora * 1000000) / 1000000;
  
  const valorDasPadraoAnexo = Math.round(rbaAnexo * aliqEfetivaPadrao * 100) / 100;
  const valorDasPorForaAnexo = Math.round(rbaAnexo * aliqEfetivaPorFora * 100) / 100;

  return {
      aliqNominal,
      parcelaDeduzir: parcela,
      aliqEfetivaPadraoFull,
      aliqEfetivaPadrao,
      aliqEfetivaPorFora,
      valorDasPadraoAnexo,
      valorDasPorForaAnexo,
      fractionPadrao,
      dasFractionPorFora,
      distribuicaoReal: dist,
      creditoB2B_Ibs,
      creditoB2B_Cbs
  };
}
