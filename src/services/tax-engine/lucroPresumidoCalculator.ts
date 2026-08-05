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
};

const PRESUNCAO_CSLL = {
  servicos: 0.32,
  comercio: 0.12,
  equiparadaHospitalar: 0.12,
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

  for (const tri of trimestres) {
    let faturamentoTrimestre = 0;
    
    let recServicos = 0;
    let recComercio = 0;
    let basePisCofins = 0;
    let issTrimestre = 0;

    for (const mes of tri.meses) {
      const faturamentoMes = mes.receitaServicos + mes.receitaComercio + mes.receitaMonofasica;
      faturamentoTrimestre += faturamentoMes;
      
      recServicos += mes.receitaServicos;
      recComercio += mes.receitaComercio;
      
      const receitasTributadasPisCofins = mes.receitaServicos + mes.receitaComercio;
      const baseMesPisCofins = Math.max(0, receitasTributadasPisCofins - mes.icmsDestacado - mes.devolucoesDescontos);
      basePisCofins += baseMesPisCofins;
      
      issTrimestre += mes.issRetido > 0 ? mes.issRetido : (mes.receitaServicos * config.aliquotaIss);
      
      // Base IBS/CBS (Receita Monofásica não entra na base padrão se a legislação final confirmar, mas por padrão no IVA Dual a tributação é ampla. Para o momento, vamos tributar a base cheia líquida de devoluções).
      const baseMesIbsCbs = Math.max(0, faturamentoMes - mes.devolucoesDescontos);
      totalBaseIbsCbs += baseMesIbsCbs;
    }
    
    receitaBrutaTotalAnual += faturamentoTrimestre;

    const percIrpjServico = config.isEquiparadaHospitalar ? PRESUNCAO_IRPJ.equiparadaHospitalar : PRESUNCAO_IRPJ.servicos;
    const percCsllServico = config.isEquiparadaHospitalar ? PRESUNCAO_CSLL.equiparadaHospitalar : PRESUNCAO_CSLL.servicos;

    let baseIrpjNormal = (recServicos * percIrpjServico) + (recComercio * PRESUNCAO_IRPJ.comercio);
    let baseCsllNormal = (recServicos * percCsllServico) + (recComercio * PRESUNCAO_CSLL.comercio);

    let teveAdicionalPresuncaoLC224 = false;

    if (faturamentoTrimestre > LIMITE_FATURAMENTO_LC224_TRIMESTRE) {
      teveAdicionalPresuncaoLC224 = true;
      const excessoFaturamento = faturamentoTrimestre - LIMITE_FATURAMENTO_LC224_TRIMESTRE;
      
      const propServicos = faturamentoTrimestre > 0 ? (recServicos / faturamentoTrimestre) : 0;
      const propComercio = faturamentoTrimestre > 0 ? (recComercio / faturamentoTrimestre) : 0;
      
      const excedenteServicos = excessoFaturamento * propServicos;
      const excedenteComercio = excessoFaturamento * propComercio;

      baseIrpjNormal += (excedenteServicos * 0.10) + (excedenteComercio * 0.10);
      baseCsllNormal += (excedenteServicos * 0.10) + (excedenteComercio * 0.10);
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
    totalCreditoIbs += desp.despesasGeraCredito * config.aliquotaIbsCredito;
    totalCreditoCbs += desp.despesasGeraCredito * config.aliquotaCbsCredito;
    
    // Crédito de Optantes do Simples (estimativa de 4% médio de recuperação)
    const aliquotaSimplesRecuperacaoIbs = (4 / 100) * (config.aliquotaIbsCredito / (config.aliquotaIbsCredito + config.aliquotaCbsCredito));
    const aliquotaSimplesRecuperacaoCbs = (4 / 100) * (config.aliquotaCbsCredito / (config.aliquotaIbsCredito + config.aliquotaCbsCredito));
    
    totalCreditoIbs += desp.comprasSimplesNacional * aliquotaSimplesRecuperacaoIbs;
    totalCreditoCbs += desp.comprasSimplesNacional * aliquotaSimplesRecuperacaoCbs;
  }

  const totalDebitoIbs = totalBaseIbsCbs * config.aliquotaIbsDebito;
  const totalDebitoCbs = totalBaseIbsCbs * config.aliquotaCbsDebito;
  
  const saldoIbsCbs = Math.max(0, (totalDebitoIbs + totalDebitoCbs) - (totalCreditoIbs + totalCreditoCbs));

  const cargaTributariaTotal = totalIrpj + totalCsll + totalPis + totalCofins + totalIss;
  const cargaReformaTotal = totalIrpj + totalCsll + saldoIbsCbs;
  const diferenca = cargaTributariaTotal - cargaReformaTotal;

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
