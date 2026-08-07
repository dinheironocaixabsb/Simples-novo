/**
 * SZ-5: Automação Híbrida do IBS/CBS e Redutores
 */

export type RedutorType = 'NONE' | '30%' | '40%' | '60%';

export interface IbsCbsInput {
  ano: number;
  redutor: RedutorType;
  aliquotaManualIbs?: number;
  aliquotaManualCbs?: number;
}

export interface IbsCbsOutput {
  aliquotaIbs: number;
  aliquotaCbs: number;
  aliquotaTotal: number;
}

export function obterAliquotasIbsCbs(input: IbsCbsInput): IbsCbsOutput {
  let baseIbs = 0;
  let baseCbs = 0;

  // Transição da Legislação
  if (input.ano === 2026) {
    baseIbs = 0.1;
    baseCbs = 0.9;
  } else {
    // Estimativa pós-transição (totalizando 26.5%)
    baseIbs = 17.7;
    baseCbs = 8.8;
  }

  // Override manual caso o usuário insira na UI
  if (typeof input.aliquotaManualIbs === 'number') {
    baseIbs = input.aliquotaManualIbs;
  }
  if (typeof input.aliquotaManualCbs === 'number') {
    baseCbs = input.aliquotaManualCbs;
  }

  // Redutores da LC 214
  let multiplicador = 1.0;
  switch (input.redutor) {
    case '30%': multiplicador = 0.7; break;
    case '40%': multiplicador = 0.6; break;
    case '60%': multiplicador = 0.4; break;
    case 'NONE':
    default: multiplicador = 1.0; break;
  }

  const aliquotaIbsFinal = Number((baseIbs * multiplicador).toFixed(2));
  const aliquotaCbsFinal = Number((baseCbs * multiplicador).toFixed(2));

  return {
    aliquotaIbs: aliquotaIbsFinal,
    aliquotaCbs: aliquotaCbsFinal,
    aliquotaTotal: Number((aliquotaIbsFinal + aliquotaCbsFinal).toFixed(2))
  };
}
