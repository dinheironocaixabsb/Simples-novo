import { create } from 'zustand';
import { Client, Workspace, ClientSchema, WorkspaceSchema } from '../schema/lucro-real/domain';
import { RedutorType, IbsCbsInput, IbsCbsOutput, obterAliquotasIbsCbs } from '../services/tax-engine/lucro-real/ibsCbs';
import { ProdutoNota } from '../services/xml/lucro-real/parser';

export interface MesFaturamento {
  mes: string;
  competencia: string;
  atividades: {
    industria: boolean;
    comercio: boolean;
    servicos: boolean;
    equipHospitalar: boolean;
    transpCargas: boolean;
    transpPassageiros: boolean;
  };
  mercadoInterno: string;
  mercadoExterno: string;
  exclusoes: {
    descontosIncondicionais: string;
    devolucoesVendas: string;
    issExcluidoLc214: string;
    icmsPisCofins: string;
    icmsIbsCbs: string;
    pisCofinsIbsCbs: string;
  };
}

export const INITIAL_MESES: MesFaturamento[] = [
  {
    mes: "Janeiro", competencia: "01/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 73.612,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.570,24", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Fevereiro", competencia: "02/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 88.590,14", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Março", competencia: "03/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 100.582,90", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.771,72", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Abril", competencia: "04/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 79.391,14", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.587,82", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Maio", competencia: "05/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Junho", competencia: "06/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Julho", competencia: "07/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Agosto", competencia: "08/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Setembro", competencia: "09/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Outubro", competencia: "10/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Novembro", competencia: "11/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Dezembro", competencia: "12/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  }
];

export interface ImpostosRendaMes {
  mes: string;
  competencia: string;
  irpj: string;
  csll: string;
}

export const INITIAL_IMPOSTOS_RENDA: ImpostosRendaMes[] = [
  { mes: "Janeiro", competencia: "01/2026", irpj: "R$ 6.000,00", csll: "R$ 5.400,00" },
  { mes: "Fevereiro", competencia: "02/2026", irpj: "R$ 7.100,00", csll: "R$ 6.380,00" },
  { mes: "Março", competencia: "03/2026", irpj: "R$ 8.050,00", csll: "R$ 7.240,00" },
  { mes: "Abril", competencia: "04/2026", irpj: "R$ 6.350,00", csll: "R$ 5.710,00" },
  { mes: "Maio", competencia: "05/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Junho", competencia: "06/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Julho", competencia: "07/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Agosto", competencia: "08/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Setembro", competencia: "09/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Outubro", competencia: "10/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Novembro", competencia: "11/2026", irpj: "R$ 0,00", csll: "R$ 0,00" },
  { mes: "Dezembro", competencia: "12/2026", irpj: "R$ 0,00", csll: "R$ 0,00" }
];

interface EmpresaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  cnaePrincipal: string;
  atividadePrincipal: string;
  regimeAtual: string;
  endereco: string;
  representante: string;
  email: string;
  telefone: string;
}

interface SystemSettings {
  logoText: string;
  consultoriaName: string;
}

interface ClienteRecord {
  id: string;
  name: string;
  cnpj: string;
  empresa: EmpresaData;
}

interface AppState {
  workspace: Workspace | null;
  activeClient: Client | null;
  currentStep: number;
  empresa: EmpresaData;
  clientes: ClienteRecord[];
  selectedClientId: string;
  systemSettings: SystemSettings;
  
  simulacaoIbsCbs: {
    input: IbsCbsInput;
    output: IbsCbsOutput;
  };
  receitasNFe: ProdutoNota[];
  produtosNFe: ProdutoNota[];
  mesesFaturamento: MesFaturamento[];
  regimeApuracaoRenda: 'estimativa_mensal' | 'trimestral' | 'anual';
  impostosRendaMeses: ImpostosRendaMes[];
}

interface AppActions {
  setWorkspace: (workspace: Workspace) => void;
  setActiveClient: (client: Client) => void;
  setCurrentStep: (step: number) => void;
  setEmpresa: (empresa: Partial<EmpresaData>) => void;
  selectCliente: (id: string) => void;
  novoCliente: () => void;
  salvarClienteAtual: () => void;
  excluirClienteAtual: () => void;
  setSystemSettings: (settings: Partial<SystemSettings>) => void;
  setSimulacaoIbsCbs: (partialInput: Partial<IbsCbsInput>) => void;
  setReceitasNFe: (produtos: ProdutoNota[]) => void;
  setProdutosNFe: (produtos: ProdutoNota[]) => void;
  setMesesFaturamento: (meses: MesFaturamento[]) => void;
  setRegimeApuracaoRenda: (regime: 'estimativa_mensal' | 'trimestral' | 'anual') => void;
  setImpostosRendaMeses: (impostos: ImpostosRendaMes[]) => void;
  toggleOverride: (itemIndex: number, imposto: 'pisCofins' | 'ibsCbs') => void;
  clearState: () => void;
}

const INITIAL_CLIENTES: ClienteRecord[] = [
  {
    id: "cli_1",
    name: "CLINICA ODONTOLOGICA SORRISO SAO SEBASTIAO LTDA",
    cnpj: "12.345.678/0001-90",
    empresa: {
      cnpj: "12.345.678/0001-90",
      razaoSocial: "CLINICA ODONTOLOGICA SORRISO SAO SEBASTIAO LTDA",
      nomeFantasia: "Clínica Odontológica Sorriso",
      inscricaoEstadual: "123456",
      cnaePrincipal: "8621500 (Atividade odontológica)",
      atividadePrincipal: "Serviços Odontológicos",
      regimeAtual: "Lucro Real",
      endereco: "Rua das Flores, 100",
      representante: "Dra. Maria Oliveira",
      email: "contato@sorriso.com.br",
      telefone: "(11) 98888-7777"
    }
  },
  {
    id: "cli_2",
    name: "INDUSTRIA METALURGICA BRASIL S/A",
    cnpj: "98.765.432/0001-10",
    empresa: {
      cnpj: "98.765.432/0001-10",
      razaoSocial: "INDUSTRIA METALURGICA BRASIL S/A",
      nomeFantasia: "Metalúrgica Brasil",
      inscricaoEstadual: "987654",
      cnaePrincipal: "2599399 (Fabricação de produtos de metal)",
      atividadePrincipal: "Metalurgia e Peças",
      regimeAtual: "Lucro Real",
      endereco: "Av. Industrial, 500",
      representante: "Carlos Eduardo Silva",
      email: "financeiro@metalurgica.com.br",
      telefone: "(11) 3333-2222"
    }
  }
];

const DEFAULT_EMPRESA: EmpresaData = INITIAL_CLIENTES[0].empresa;

const DEFAULT_IBS_CBS_INPUT: IbsCbsInput = { ano: 2026, redutor: 'NONE' };

export const useLucroRealStore = create<AppState & AppActions>()((set, get) => ({
  workspace: null,
  activeClient: null,
  currentStep: 1,
  empresa: DEFAULT_EMPRESA,
  clientes: INITIAL_CLIENTES,
  selectedClientId: "cli_1",
  systemSettings: {
    logoText: "Sua Logo Aqui",
    consultoriaName: "TaxAdvisory Consultoria Tributária"
  },
  simulacaoIbsCbs: {
    input: DEFAULT_IBS_CBS_INPUT,
    output: obterAliquotasIbsCbs(DEFAULT_IBS_CBS_INPUT)
  },
  receitasNFe: [],
  produtosNFe: [],
  mesesFaturamento: INITIAL_MESES,
  regimeApuracaoRenda: 'estimativa_mensal',
  impostosRendaMeses: INITIAL_IMPOSTOS_RENDA,

  setEmpresa: (payload) => set((state) => ({ empresa: { ...state.empresa, ...payload } })),

  selectCliente: (id) => {
    const cliente = get().clientes.find(c => c.id === id);
    if (cliente) {
      set({
        selectedClientId: id,
        empresa: cliente.empresa
      });
    }
  },

  novoCliente: () => {
    const newId = `cli_${Date.now()}`;
    const novaEmpresa: EmpresaData = {
      cnpj: "",
      razaoSocial: "Novo Cliente Cadastrado",
      nomeFantasia: "",
      inscricaoEstadual: "",
      cnaePrincipal: "",
      atividadePrincipal: "",
      regimeAtual: "Lucro Real",
      endereco: "",
      representante: "",
      email: "",
      telefone: ""
    };
    const novoRecord: ClienteRecord = {
      id: newId,
      name: "Novo Cliente Cadastrado",
      cnpj: "",
      empresa: novaEmpresa
    };
    set((state) => ({
      clientes: [...state.clientes, novoRecord],
      selectedClientId: newId,
      empresa: novaEmpresa,
      currentStep: 1
    }));
  },

  salvarClienteAtual: () => {
    const { selectedClientId, empresa, clientes, mesesFaturamento, produtosNFe, receitasNFe, impostosRendaMeses } = get();
    const updatedClientes = clientes.map(c => {
      if (c.id === selectedClientId) {
        return {
          ...c,
          name: empresa.razaoSocial || "Cliente Sem Nome",
          cnpj: empresa.cnpj,
          empresa: empresa,
          mesesFaturamento,
          produtosNFe,
          receitasNFe,
          impostosRendaMeses
        };
      }
      return c;
    });
    set({ clientes: updatedClientes });
  },

  excluirClienteAtual: () => {
    const { selectedClientId, clientes } = get();
    const blankEmpresa: EmpresaData = {
      cnpj: "",
      razaoSocial: "Novo Cliente Sem Nome",
      nomeFantasia: "",
      inscricaoEstadual: "",
      cnaePrincipal: "",
      atividadePrincipal: "",
      regimeAtual: "Lucro Real",
      endereco: "",
      representante: "",
      email: "",
      telefone: ""
    };

    if (clientes.length > 1) {
      const filtered = clientes.filter(c => c.id !== selectedClientId);
      const next = filtered[0];
      set({
        clientes: filtered,
        selectedClientId: next.id,
        empresa: next.empresa,
        produtosNFe: [],
        receitasNFe: []
      });
    } else {
      const updated = clientes.map(c => c.id === selectedClientId ? { ...c, name: "Novo Cliente Sem Nome", cnpj: "", empresa: blankEmpresa } : c);
      set({
        clientes: updated,
        empresa: blankEmpresa,
        produtosNFe: [],
        receitasNFe: []
      });
    }
  },

  setSystemSettings: (payload) => set((state) => ({ systemSettings: { ...state.systemSettings, ...payload } })),

  setWorkspace: (payload) => {
    const result = WorkspaceSchema.safeParse(payload);
    if (result.success) {
      set({ workspace: result.data });
    } else {
      set({ workspace: payload as Workspace });
    }
  },

  setActiveClient: (payload) => {
    const result = ClientSchema.safeParse(payload);
    if (result.success) {
      set({ activeClient: result.data });
    } else {
      set({ activeClient: payload as Client });
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  setSimulacaoIbsCbs: (partialInput) => {
    const currentInput = get().simulacaoIbsCbs.input;
    const newInput = { ...currentInput, ...partialInput };
    const newOutput = obterAliquotasIbsCbs(newInput); // Tax Engine Puro
    
    set({ 
      simulacaoIbsCbs: { input: newInput, output: newOutput }
    });
  },

  setReceitasNFe: (produtos) => set({ receitasNFe: produtos }),
  setProdutosNFe: (produtos) => set({ produtosNFe: produtos }),
  setMesesFaturamento: (meses) => set({ mesesFaturamento: meses }),
  setRegimeApuracaoRenda: (regime) => set({ regimeApuracaoRenda: regime }),
  setImpostosRendaMeses: (impostos) => set({ impostosRendaMeses: impostos }),

  toggleOverride: (itemIndex, imposto) => {
    const produtos = [...get().produtosNFe];
    const prod = { ...produtos[itemIndex] };

    // SZ-4: Precedência Híbrida Automático vs Manual
    if (imposto === 'pisCofins') {
      const atual = prod.overridePisCofins !== undefined ? prod.overridePisCofins : prod.geraCreditoPisCofins;
      prod.overridePisCofins = !atual;
    } else {
      const atual = prod.overrideIbsCbs !== undefined ? prod.overrideIbsCbs : prod.geraCreditoIbsCbs;
      prod.overrideIbsCbs = !atual;
    }
    produtos[itemIndex] = prod;
    set({ produtosNFe: produtos });
  },

  clearState: () => set({ 
    workspace: null, activeClient: null, currentStep: 1,
    simulacaoIbsCbs: { input: DEFAULT_IBS_CBS_INPUT, output: obterAliquotasIbsCbs(DEFAULT_IBS_CBS_INPUT) },
    receitasNFe: [],
    produtosNFe: [],
    mesesFaturamento: INITIAL_MESES,
    regimeApuracaoRenda: 'estimativa_mensal',
    impostosRendaMeses: INITIAL_IMPOSTOS_RENDA
  })
}));
