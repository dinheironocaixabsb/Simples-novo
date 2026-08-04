export interface ParsedXmlSales {
  id: string;
  chave: string;
  numero: string;
  data: string;
  monthIndex: number; // 0-11
  tomador: string;
  cnpj: string;
  regime: string; // 'Isento de IRPJ' | 'Lucro Presumido' | etc
  descricao: string;
  valor: number;
  fileName: string;
  xmlType: 'NFe' | 'NFSe';
  isConsultingCnpj?: boolean;
}

export interface Deducoes {
  icms: number;
  pisCofins: number;
  desconto: number;
  iss: number;
}

export interface ProdutoDetalhado {
  nome: string;
  valorBruto: number;
  desconto: number;
  icms: number;
  pisCofins: number;
  valorLiquido: number;
  cfop: string;
  ncm: string;
  isAlimento60: boolean;
  isHigiene60: boolean;
  isAnexo1: boolean;
  isAnexo15: boolean;
  isRevenda: boolean;
  isFrete: boolean;
}

export interface ParsedXmlExpense {
  id: string;
  chave: string;
  numero: string;
  data: string;
  monthIndex: number; // 0-11
  fornecedor: string; // Used for tomador, prestador or emitente
  cnpj: string;
  regime: string; // 'Simples Nacional' | 'Lucro Real' | 'Isento de IRPJ' | 'Lucro Presumido'
  tipoDespesa: string; // Usually 'Gera crédito de IBS/CBS'
  descricao: string;
  valor: number;
  category: string; // 'frete' | 'insumos' | 'servicos'
  fileName: string;
  xmlType: 'CTe' | 'NFe' | 'NFSe';
  deducoes: Deducoes;
  produtosDetalhados?: ProdutoDetalhado[]; // Only for NFe
  isConsultingCnpj?: boolean;
}
