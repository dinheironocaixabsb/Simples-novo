import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { ParsedXmlSales, ParsedXmlExpense, ExpenseCategory } from '../domain/types/xml.types';
import { LucroPresumidoConfig, ReceitaMensalLP, DespesaMensalLP } from '../domain/types/lucro-presumido';
import { verificarReducaoCnae } from '../services/cnae-reducer';

export const defaultExpenseCategories: ExpenseCategory[] = [
  { id: 'cat-1', nome: 'Honorários advocatícios' },
  { id: 'cat-2', nome: 'Vale de refeição' },
  { id: 'cat-3', nome: 'Serviço de medicamento' },
  { id: 'cat-4', nome: 'Serviço de fisioterapia' },
  { id: 'cat-5', nome: 'Enquadramento tributário da base do crédito CBS' },
];

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  responsavelReceita: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cep: string;
  endereco: string;
  cnaePrincipal: string;
  cnaesSecundarios: string[];
}

export interface FirmData {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  logo: string;
}

export interface ProfessionalData {
  nome: string;
  cargo: string;
  crc: string;
}

export const defaultCompanyData: CompanyData = {
  cnpj: '', razaoSocial: '', responsavelReceita: '',
  inscricaoEstadual: '', inscricaoMunicipal: '',
  cep: '', endereco: '', cnaePrincipal: '',
  cnaesSecundarios: Array(14).fill('')
};

export const defaultFirmData: FirmData = {
  nome: '', email: '', telefone: '', endereco: '', logo: ''
};

export const defaultProfessionalData: ProfessionalData = {
  nome: '', cargo: '', crc: ''
};

export interface GlobalClient {
  id: string; // CNPJ limpo
  name: string;
  savedAt: string;
  
  companyData: CompanyData;
  firmData: FirmData;
  xmlFaturamento: ParsedXmlSales[];
  xmlDespesas: ParsedXmlExpense[];

  simplesNacional?: {
    revenueData: any[];
    monthlyExpenses: any[];
    simulationParams: any;
  };

  lucroPresumido?: {
    config: LucroPresumidoConfig;
    receitasMensais: ReceitaMensalLP[];
    despesasMensais: DespesaMensalLP[];
    categoriasDespesa?: any[];
  };
}

interface ClientStoreState {
  clients: GlobalClient[];
  activeClientId: string | null;
  
  // O Estado global ativo 
  activeCompanyData: CompanyData;
  activeFirmData: FirmData;
  activeProfessionalData: ProfessionalData;
  activeXmlFaturamento: ParsedXmlSales[];
  activeXmlDespesas: ParsedXmlExpense[];

  // Ações globais
  updateActiveCompanyData: (data: Partial<CompanyData>) => void;
  updateActiveFirmData: (data: Partial<FirmData>) => void;
  updateActiveProfessionalData: (data: Partial<ProfessionalData>) => void;
  setXmlFaturamento: (xmls: ParsedXmlSales[]) => void;
  setXmlDespesas: (xmls: ParsedXmlExpense[]) => void;
  addXmlDespesa: (xml: ParsedXmlExpense) => void;
  removeXmlDespesa: (id: string) => void;
  updateXmlSalesStatus: (id: string, updates: Partial<ParsedXmlSales>) => void;
  updateXmlExpenseStatus: (id: string, updates: Partial<ParsedXmlExpense>) => void;

  saveClient: (clientData: Partial<GlobalClient>) => void;
  loadClient: (id: string) => GlobalClient | undefined;
  deleteClient: (id: string) => void;
  newClient: () => void;
  
  expenseCategories: ExpenseCategory[];
  addExpenseCategory: (category: ExpenseCategory) => void;
  clearExpenses: () => void;
}

export const useClientStore = create<ClientStoreState>()(
  persist(
    (set, get) => ({
      clients: [],
      activeClientId: null,
      activeCompanyData: defaultCompanyData,
      activeFirmData: defaultFirmData,
      activeProfessionalData: defaultProfessionalData,
      activeXmlFaturamento: [],
      activeXmlDespesas: [],
      expenseCategories: defaultExpenseCategories,

      addExpenseCategory: (category) => set((state) => ({ expenseCategories: [...state.expenseCategories, category] })),
      clearExpenses: () => set({ activeXmlDespesas: [] }),

      updateActiveCompanyData: (data) => set((state) => {
        const newData = { ...state.activeCompanyData, ...data };
        return { activeCompanyData: newData };
      }),

      updateActiveFirmData: (data) => set((state) => ({
        activeFirmData: { ...state.activeFirmData, ...data }
      })),

      updateActiveProfessionalData: (data) => set((state) => ({
        activeProfessionalData: { ...state.activeProfessionalData, ...data }
      })),

      setXmlFaturamento: (xmls) => set({ activeXmlFaturamento: xmls }),
      setXmlDespesas: (xmls) => set({ activeXmlDespesas: xmls }),
      addXmlDespesa: (xml) => set((state) => ({ activeXmlDespesas: [...state.activeXmlDespesas, xml] })),
      removeXmlDespesa: (id) => set((state) => ({ activeXmlDespesas: state.activeXmlDespesas.filter(x => x.id !== id) })),
      updateXmlSalesStatus: (id, updates) => set((state) => ({
        activeXmlFaturamento: state.activeXmlFaturamento.map(xml => xml.id === id ? { ...xml, ...updates } : xml)
      })),
      updateXmlExpenseStatus: (id, updates) => set((state) => ({
        activeXmlDespesas: state.activeXmlDespesas.map(xml => xml.id === id ? { ...xml, ...updates } : xml)
      })),

      saveClient: (clientData) => set((state) => {
        const id = clientData.id || state.activeCompanyData.cnpj.replace(/\D/g, '');
        if (!id) return state;

        const name = clientData.name || state.activeCompanyData.razaoSocial || `Cliente ${id}`;
        const now = new Date().toISOString();

        const baseClient: GlobalClient = {
          id,
          name,
          savedAt: now,
          companyData: state.activeCompanyData,
          firmData: state.activeFirmData,
          xmlFaturamento: state.activeXmlFaturamento,
          xmlDespesas: state.activeXmlDespesas,
          ...clientData
        };

        const newClients = [...state.clients];
        const existingIdx = newClients.findIndex(c => c.id === id);

        if (existingIdx >= 0) { 
          const existing = newClients[existingIdx];
          newClients[existingIdx] = {
            ...existing,
            ...baseClient,
            simplesNacional: clientData.simplesNacional || existing.simplesNacional,
            lucroPresumido: clientData.lucroPresumido || existing.lucroPresumido,
          };
        } else { 
          newClients.push(baseClient); 
        }

        return { clients: newClients, activeClientId: id };
      }),

      loadClient: (id) => {
        const state = get();
        const profile = state.clients.find(c => c.id === id);
        if (profile) {
          set({
            activeClientId: profile.id,
            activeCompanyData: profile.companyData,
            activeFirmData: profile.firmData || defaultFirmData,
            activeXmlFaturamento: profile.xmlFaturamento || [],
            activeXmlDespesas: profile.xmlDespesas || [],
          });
        }
        return profile;
      },

      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id),
        activeClientId: state.activeClientId === id ? null : state.activeClientId,
      })),

      newClient: () => set({
        activeClientId: null,
        activeCompanyData: defaultCompanyData,
        // Mantém os dados do contador! Não zera eles no newClient.
        activeXmlFaturamento: [],
        activeXmlDespesas: [],
      })
    }),
    {
      name: 'global-clients-storage',
      storage: createJSONStorage(() => idbStorage),
      version: 1,
    }
  )
);
