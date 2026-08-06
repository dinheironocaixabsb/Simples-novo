import { 
  LucroPresumidoConfig, 
  ReceitaMensalLP, 
  DespesaMensalLP,
  ReceitaTrimestralLP, 
  ResultadoTrimestreLP, 
  ResultadoAnualLP 
} from '../../domain/types/lucro-presumido';

const LIMITE_ISENCAO_ADICIONAL_IRPJ_TRIMESTRE = 60000;
const LIMITE_FATURAMENTO_LC224_TRIMESTRE = 1250000;

const PRESUNCAO_IRPJ = {
  servicos: 0.32,
  comercio: 0.08,
  equiparadaHospitalar: 0.08,
  transporteCargas: 0.08,
  transportePassageiros: 0.16,
};

const PRESUNCAO_CSLL = {
  servicos: 0.32,
  comercio: 0.12,
  equiparadaHospitalar: 0.12,
  transporteCargas: 0.12,
  transportePassageiros: 0.12,
};

const ALIQUOTAS = {
  irpjNormal: 0.15,
  irpjAdicional: 0.10,
  csll: 0.09,
};

function agruparEmTrimestres(receitasMensais: ReceitaMensalLP[]): ReceitaTrimestralLP[] {
  const trimestres: ReceitaTrimestralLP[] = [
    { trimestre: 1, meses: receitasMensais.slice(0, 3) },
    { trimestre: 2, meses: receitasMensais.slice(3, 6) },
    { trimestre: 3, meses: receitasMensais.slice(6, 9) },
    { trimestre: 4, meses: receitasMensais.slice(9, 12) },
  ];
  return trimestres;
}

export function calcularLucroPresumidoAnual(
  receitasMensais: ReceitaMensalLP[], 
  despesasMensais: DespesaMensalLP[],
  config: LucroPresumidoConfig
): ResultadoAnualLP {
  const trimestres = agruparEmTrimestres(receitasMensais);
  const resultadosTrimestrais: ResultadoTrimestreLP[] = [];
  
  let receitaBrutaTotalAnual = 0;
  let totalIrpj = 0;
  let totalCsll = 0;
  let totalPis = 0;
  let totalCofins = 0;
  let totalIss = 0;
  
  // Variáveis para Reforma Tributária
  let totalBaseIbsCbs = 0; // Receita bruta sujeita ao IVA
  let totalCreditoIbs = 0;
  let totalCreditoCbs = 0;
  let totalDebitoIbs = 0;
  let totalDebitoCbs = 0;

  for (const tri of trimestres) {
    let faturamentoTrimestre = 0;
    
    let baseIrpjNormal = 0;
    let baseCsllNormal = 0;
    let basePisCofins = 0;
    let issTrimestre = 0;

    for (const mes of tri.meses) {
      // Receita total do mês
      const faturamentoMes = mes.receitas.mercadoInterno + mes.receitas.mercadoExterno + 
        mes.receitas.cst04 + mes.receitas.cst06Monofasico + mes.receitas.cst06AliquotaZero + 
        mes.receitas.anexo1 + mes.receitas.anexo5 + mes.receitas.anexo7 + mes.receitas.anexo8;
      
      faturamentoTrimestre += faturamentoMes;

      // Presunções baseadas nas atividades marcadas (pega a maior aplicável ou a principal)
      let presuncaoIRPJ = PRESUNCAO_IRPJ.comercio;
      let presuncaoCSLL = PRESUNCAO_CSLL.comercio;

      if (mes.atividades.servicos) {
        presuncaoIRPJ = PRESUNCAO_IRPJ.servicos;
        presuncaoCSLL = PRESUNCAO_CSLL.servicos;
      } else if (mes.atividades.transportePassageiros) {
        presuncaoIRPJ = PRESUNCAO_IRPJ.transportePassageiros;
        presuncaoCSLL = PRESUNCAO_CSLL.transportePassageiros;
      } else if (mes.atividades.equipHospitalar) {
        presuncaoIRPJ = PRESUNCAO_IRPJ.equiparadaHospitalar;
        presuncaoCSLL = PRESUNCAO_CSLL.equiparadaHospitalar;
      } else if (mes.atividades.transporteCargas) {
        presuncaoIRPJ = PRESUNCAO_IRPJ.transporteCargas;
        presuncaoCSLL = PRESUNCAO_CSLL.transporteCargas;
      }

      baseIrpjNormal += faturamentoMes * presuncaoIRPJ;
      baseCsllNormal += faturamentoMes * presuncaoCSLL;
      
      // Receitas que compõem a base do PIS/COFINS (Mercado Interno, etc.)
      const receitasTributadasPisCofins = mes.receitas.mercadoInterno + mes.receitas.anexo1 + mes.receitas.anexo5 + mes.receitas.anexo7 + mes.receitas.anexo8;
      const deducaoPisCofins = mes.exclusoes.icmsPisCofins + mes.exclusoes.descontosIncondicionais + mes.exclusoes.devolucoesVendas;
      const baseMesPisCofins = Math.max(0, receitasTributadasPisCofins - deducaoPisCofins);
      basePisCofins += baseMesPisCofins;
      
      issTrimestre += mes.exclusoes.iss; // ISS Retido/Excluído ou Pago
      
      // Base IBS/CBS (Receita bruta menos exclusões)
      const deducoesIbsCbs = mes.exclusoes.descontosIncondicionais + mes.exclusoes.devolucoesVendas + mes.exclusoes.icmsIbsCbs + mes.exclusoes.pisCofinsIbsCbs;
      const baseMesIbsCbs = Math.max(0, faturamentoMes - deducoesIbsCbs);
      totalBaseIbsCbs += baseMesIbsCbs;

      // Débitos IBS/CBS (Simulação - Apenas mercado interno tributado)
      // Mercado Externo tem imunidade/alíquota zero.
      const baseTributadaIbsCbs = Math.max(0, mes.receitas.mercadoInterno - deducoesIbsCbs);
      const aliquotaIbsComRedutor = config.aliquotaIbsDebito * (1 - config.redutorIbsCbs);
      const aliquotaCbsComRedutor = config.aliquotaCbsDebito * (1 - config.redutorIbsCbs);
      totalDebitoIbs += baseTributadaIbsCbs * aliquotaIbsComRedutor;
      totalDebitoCbs += baseTributadaIbsCbs * aliquotaCbsComRedutor;
    }
    
    receitaBrutaTotalAnual += faturamentoTrimestre;

    let teveAdicionalPresuncaoLC224 = false;

    if (faturamentoTrimestre > LIMITE_FATURAMENTO_LC224_TRIMESTRE) {
      teveAdicionalPresuncaoLC224 = true;
      const excessoFaturamento = faturamentoTrimestre - LIMITE_FATURAMENTO_LC224_TRIMESTRE;
      
      // Se passou de 1.25M, os serviços perdem a presunção de 32% sobre o excesso se antes fossem reduzidos para 8% (LC 224/Lei 12.973).
      // Mas para serviços normais já é 32%. Vamos adicionar o excedente * 10% (conforme lógica anterior).
      baseIrpjNormal += excessoFaturamento * 0.10;
      baseCsllNormal += excessoFaturamento * 0.10;
    }

    const irpjNormal = baseIrpjNormal * ALIQUOTAS.irpjNormal;
    const csll = baseCsllNormal * ALIQUOTAS.csll;

    let irpjAdicional = 0;
    if (baseIrpjNormal > LIMITE_ISENCAO_ADICIONAL_IRPJ_TRIMESTRE) {
      irpjAdicional = (baseIrpjNormal - LIMITE_ISENCAO_ADICIONAL_IRPJ_TRIMESTRE) * ALIQUOTAS.irpjAdicional;
    }

    const pis = basePisCofins * config.aliquotaPisCumulativo;
    const cofins = basePisCofins * config.aliquotaCofinsCumulativo;

    const totalTributosTrimestre = irpjNormal + irpjAdicional + csll + pis + cofins + issTrimestre;

    totalIrpj += (irpjNormal + irpjAdicional);
    totalCsll += csll;
    totalPis += pis;
    totalCofins += cofins;
    totalIss += issTrimestre;

    resultadosTrimestrais.push({
      trimestre: tri.trimestre,
      baseIrpj: baseIrpjNormal,
      baseCsll: baseCsllNormal,
      teveAdicionalPresuncaoLC224,
      irpjNormal,
      irpjAdicional,
      csll,
      pis,
      cofins,
      iss: issTrimestre,
      totalTributos: totalTributosTrimestre
    });
  }

  // --- Reforma Tributária (Cálculos IBS/CBS) ---
  for (const desp of despesasMensais) {
    // Crédito Cheio
    totalCreditoIbs += desp.despesasGeraCredito * config.aliquotaIbsCreditoGeral;
    totalCreditoCbs += desp.despesasGeraCredito * config.aliquotaCbsCreditoGeral;
    
    // Crédito do Simples Nacional
    let ibsSimples = 0;
    let cbsSimples = 0;
    if (config.tipoCreditoSimples === 'por_dentro_estimado') {
      const propIbs = config.aliquotaIbsDebito / (config.aliquotaIbsDebito + config.aliquotaCbsDebito || 1);
      const propCbs = config.aliquotaCbsDebito / (config.aliquotaIbsDebito + config.aliquotaCbsDebito || 1);
      ibsSimples = config.aliquotaMediaSimples * propIbs;
      cbsSimples = config.aliquotaMediaSimples * propCbs;
    } else {
      ibsSimples = config.aliquotaIbsFornecedorSimples;
      cbsSimples = config.aliquotaCbsFornecedorSimples;
    }

    totalCreditoIbs += desp.comprasSimplesNacional * ibsSimples; 
    totalCreditoCbs += desp.comprasSimplesNacional * cbsSimples; 
  }

  // Crédito Presumido de Estoque (Mensal * 12)
  const propIbsEstoque = config.aliquotaIbsDebito / (config.aliquotaIbsDebito + config.aliquotaCbsDebito || 1);
  const propCbsEstoque = config.aliquotaCbsDebito / (config.aliquotaIbsDebito + config.aliquotaCbsDebito || 1);
  totalCreditoIbs += (config.creditoPresumidoEstoque * 12) * propIbsEstoque;
  totalCreditoCbs += (config.creditoPresumidoEstoque * 12) * propCbsEstoque;

  const saldoIbsCbs = Math.max(0, (totalDebitoIbs + totalDebitoCbs) - (totalCreditoIbs + totalCreditoCbs));
  const cargaTributariaTotal = totalIrpj + totalCsll + totalPis + totalCofins + totalIss;
  
  // Na reforma, PIS/COFINS deixam de existir, mas mantivemos IRPJ e CSLL
  const cargaReformaTotal = totalIrpj + totalCsll + saldoIbsCbs;
  const diferenca = cargaReformaTotal - cargaTributariaTotal;

  return {
    receitaBrutaTotal: receitaBrutaTotalAnual,
    resultadosTrimestrais,
    totalIrpj,
    totalCsll,
    totalPis,
    totalCofins,
    totalIss,
    cargaTributariaTotal,

    totalDebitoIbs,
    totalDebitoCbs,
    totalCreditoIbs,
    totalCreditoCbs,
    saldoIbsCbs,
    cargaReformaTotal,
    diferenca
  };
}
