export interface LucroPresumidoConfig {
  isEquiparadaHospitalar: boolean;
  regimePisCofins: 'cumulativo' | 'nao_cumulativo'; 
  aliquotaPisCumulativo: number;    // Default: 0.0065 (0.65%)
  aliquotaCofinsCumulativo: number; // Default: 0.03 (3%)
  aliquotaIss: number;              // Alíquota média de ISS (ex: 0.05 para 5%)

  // Reforma Tributária
  aliquotaIbsDebito: number; // Default: 0.177
  aliquotaCbsDebito: number; // Default: 0.088
  aliquotaIbsCredito: number; // Default: 0.177
  aliquotaCbsCredito: number; // Default: 0.088
}

export interface ReceitaMensalLP {
  mes: string;
  receitaServicos: number;         
  receitaComercio: number;         
  receitaMonofasica: number;       
  icmsDestacado: number;           
  issRetido: number;               
  devolucoesDescontos: number;     
}

export interface DespesaMensalLP {
  mes: string;
  despesasGeraCredito: number; // Valor das despesas/compras que geram crédito cheio IBS/CBS
  comprasSimplesNacional: number; // Compras de optantes do Simples (crédito reduzido aprox. 4%)
}

export interface ReceitaTrimestralLP {
  trimestre: 1 | 2 | 3 | 4;
  meses: ReceitaMensalLP[];
}

export interface ResultadoTrimestreLP {
  trimestre: number;
  baseIrpj: number;
  baseCsll: number;
  teveAdicionalPresuncaoLC224: boolean;
  irpjNormal: number;
  irpjAdicional: number; 
  csll: number;
  pis: number;
  cofins: number;
  iss: number;
  totalTributos: number;
}

export interface ResultadoAnualLP {
  receitaBrutaTotal: number;
  resultadosTrimestrais: ResultadoTrimestreLP[];
  
  // Sistema Atual
  totalIrpj: number;
  totalCsll: number;
  totalPis: number;
  totalCofins: number;
  totalIss: number;
  cargaTributariaTotal: number;

  // Reforma Tributária (IBS/CBS)
  totalDebitoIbs: number;
  totalDebitoCbs: number;
  totalCreditoIbs: number;
  totalCreditoCbs: number;
  saldoIbsCbs: number;
  cargaReformaTotal: number; // IRPJ + CSLL + ISS(se houver transição) + saldoIbsCbs
  diferenca: number;
}
