export interface LucroPresumidoConfig {
  isEquiparadaHospitalar: boolean;
  regimePisCofins: 'cumulativo' | 'nao_cumulativo'; 
  aliquotaPisCumulativo: number;    // Default: 0.0065 (0.65%)
  aliquotaCofinsCumulativo: number; // Default: 0.03 (3%)

  // Novas Configurações Dinâmicas (Video)
  anoSimulacao: string;
  aliquotaIbsDebito: number;
  aliquotaCbsDebito: number;
  aliquotaIcms: number;
  aliquotaIss: number;
  creditoPresumidoEstoque: number;
  redutorIbsCbs: number; // 0 para sem redutor, 0.3 para 30%, 0.6 para 60%
  tipoCreditoSimples: 'por_dentro_estimado' | 'por_fora_destacado';
  aliquotaMediaSimples: number;
  aliquotaIbsFornecedorSimples: number;
  aliquotaCbsFornecedorSimples: number;
  aliquotaIbsCreditoGeral: number;
  aliquotaCbsCreditoGeral: number;
}

export interface ReceitaMensalLP {
  mes: string;
  atividades: {
    industria: boolean;
    comercio: boolean;
    servicos: boolean;
    equipHospitalar: boolean;
    transporteCargas: boolean;
    transportePassageiros: boolean;
  };
  receitas: {
    mercadoInterno: number;
    mercadoExterno: number;
    cst04: number;
    cst06Monofasico: number;
    cst06AliquotaZero: number;
    anexo1: number;
    anexo5: number;
    anexo7: number;
    anexo8: number;
  };
  exclusoes: {
    descontosIncondicionais: number;
    devolucoesVendas: number;
    iss: number;
    icmsPisCofins: number;
    icmsIbsCbs: number;
    pisCofinsIbsCbs: number;
  };
}

export type RegimeTributario = 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional';
export type TipoCreditoIbsCbs = 'Gera Crédito' | 'Não Gera Crédito';

export interface CategoriaDespesa {
  id: string;
  nome: string;
  enquadramento: string;
  percentualCredito: number; // 1 (100%), 0.4 (40% de base), 0 (Sem crédito)
}

export interface DespesaNota {
  id: string;
  mes: string;
  nNota: string;
  dataEmissao: string;
  cnpjFornecedor: string;
  nomeFornecedor: string;
  regimeTributario: RegimeTributario;
  tipoCredito: TipoCreditoIbsCbs;
  categoriaId: string;
  descricao: string;
  valorTotal: number;
}

export interface DespesaMensalLP {
  mes: string;
  despesasGeraCredito: number; // Legacy
  comprasSimplesNacional: number; // Legacy
  notas: DespesaNota[];
  
  // Novos campos LC 214 e XML
  despesaGeral?: number;
  despesaCreditoIntegral?: number;
  despesaAnexo1?: number;
  despesaAnexo15?: number;
  despesaAnexo7?: number;
  despesaAnexo8?: number;
  deducaoIcmsIss?: number;
  deducaoPisCofins?: number;
  deducaoDescontos?: number;
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
