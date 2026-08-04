import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { AnexoId } from '../domain/types/tax.types';
import { ParsedXmlSales, ParsedXmlExpense } from '../domain/types/xml.types';
import { calculateResults, TaxCalculatorParams, TaxCalculatorResult } from '../services/tax-calculator';
import { verificarReducaoCnae } from '../services/cnae-reducer';
import { consolidarXmlDespesas } from '../services/xml/xml-consolidator';

// AdaptaÃ§Ã£o do IndexedDB para a API do Zustand
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

// ==================== INTERFACES ====================

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
  crc: string;
  cargo: string;
  assinatura: string;
}

export interface RevenueData {
  competencia: string;
  rbt12: number;
  rba: number;
  rbaa: number;
  anexosAtivos: AnexoId[];
  anexosData: Record<AnexoId, {
    mercadoInterno: number;
    mercadoExterno: number;
    isIcmsStSegregado: boolean;
    receitaComIcmsSt: number;
  }>;
}

// Despesas mensais detalhadas (espelho do sistema original Step 4)
export interface MonthlyExpenses {
  despesaGeral: number;
  despesaCreditoIntegral: number;
  despesaAnexo1: number;
  despesaAnexo15: number;
  despesaAnexo7: number;
  despesaAnexo8: number;
  deducaoIcmsIss: number;
  deducaoPisCofins: number;
  deducaoDescontos: number;
  deducaoIbsCbs: number;
  despesaSimplesNacional: number;
  despesaSimplesNacionalReduzido30: number;
  imoveis: number;
  aluguel: number;
  iptu: number;
  luz: number;
  agua: number;
  telefone: number;
  internet: number;
  prestadores: number;
  seguros: number;
  marketing: number;
  viagens: number;
  depreciacao: number;
  despesasGerais: number;
  financeiros: number;
}

export interface SimulationParams {
  anoSimulacao: string;
  faturamentoAliquotaIBS: number;
  faturamentoAliquotaCBS: number;
  despesasAliquotaIBS: number;
  despesasAliquotaCBS: number;
  regimeCreditoSn: 'porDentro' | 'porFora';
  snAliqDentro: number;
  snAliqIbsFora: number;
  snAliqCbsFora: number;
  ultrapassouSublimite: boolean;
  creditoEstoqueVal: number;
  redutorIbsCbs: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  savedAt: string;
  companyData: CompanyData;
  firmData: FirmData;
  revenueData: RevenueData[];
  monthlyExpenses: MonthlyExpenses[];
  simulationParams: SimulationParams;
  xmlFaturamento: ParsedXmlSales[];
  xmlDespesas: ParsedXmlExpense[];
}

// ==================== STATE ====================

interface DiagnosisState {
  currentStep: number;
  currentMonth: number;
  analysisMode: 'monthly' | 'average';
  companyData: CompanyData;
  firmData: FirmData;
  professionalData: ProfessionalData;
  revenueData: RevenueData[];
  monthlyExpenses: MonthlyExpenses[];
  simulationParams: SimulationParams;
  xmlFaturamento: ParsedXmlSales[];
  xmlDespesas: ParsedXmlExpense[];
  calculationResults: Record<number, TaxCalculatorResult | null>;
  savedClients: ClientProfile[];
  activeClientId: string | null;
  currentXmlMonth: number;
  cnpjCache: Record<string, string>;

  setStep: (step: number) => void;
  setCurrentMonth: (month: number) => void;
  setAnalysisMode: (mode: 'monthly' | 'average') => void;
  updateCompanyData: (data: Partial<CompanyData>) => void;
  updateFirmData: (data: Partial<FirmData>) => void;
  updateProfessionalData: (data: Partial<ProfessionalData>) => void;
  updateRevenueData: (monthIndex: number, data: Partial<RevenueData>) => void;
  updateMonthlyExpenses: (monthIndex: number, data: Partial<MonthlyExpenses>) => void;
  updateSimulationParams: (data: Partial<SimulationParams>) => void;
  setXmlFaturamento: (xmls: ParsedXmlSales[]) => void;
  setXmlDespesas: (xmls: ParsedXmlExpense[]) => void;
  addXmlDespesa: (xml: ParsedXmlExpense) => void;
  removeXmlDespesa: (id: string) => void;
  runCalculation: (monthIndex?: number) => TaxCalculatorResult | null;
  saveClient: (id: string, name: string) => void;
  loadClient: (id: string) => void;
  deleteClient: (id: string) => void;
  newClient: () => void;
  setCurrentXmlMonth: (month: number) => void;
  updateXmlSalesStatus: (id: string, updates: Partial<ParsedXmlSales>) => void;
  updateXmlExpenseStatus: (id: string, updates: Partial<ParsedXmlExpense>) => void;
  addCnpjToCache: (cnpj: string, regime: string) => void;
}

// ==================== DEFAULTS ====================

const defaultCompanyData: CompanyData = {
  cnpj: '', razaoSocial: '', responsavelReceita: '',
  inscricaoEstadual: '', inscricaoMunicipal: '',
  cep: '', endereco: '', cnaePrincipal: '',
  cnaesSecundarios: Array(14).fill('')
};

const defaultFirmData: FirmData = {
  nome: '', email: '', telefone: '', endereco: '', logo: ''
};

const defaultProfessionalData: ProfessionalData = {
  nome: '', crc: '', cargo: 'Contador ResponsÃ¡vel', assinatura: ''
};

const defaultAnexosData = {
  '1': { mercadoInterno: 0, mercadoExterno: 0, isIcmsStSegregado: false, receitaComIcmsSt: 0 },
  '2': { mercadoInterno: 0, mercadoExterno: 0, isIcmsStSegregado: false, receitaComIcmsSt: 0 },
  '3': { mercadoInterno: 0, mercadoExterno: 0, isIcmsStSegregado: false, receitaComIcmsSt: 0 },
  '4': { mercadoInterno: 0, mercadoExterno: 0, isIcmsStSegregado: false, receitaComIcmsSt: 0 },
  '5': { mercadoInterno: 0, mercadoExterno: 0, isIcmsStSegregado: false, receitaComIcmsSt: 0 },
};

const defaultRevenueDataMonth: RevenueData = {
  competencia: '', rbt12: 0, rba: 0, rbaa: 0,
  anexosAtivos: [],
  anexosData: JSON.parse(JSON.stringify(defaultAnexosData))
};

const defaultMonthlyExpensesMonth: MonthlyExpenses = {
  despesaGeral: 0, despesaCreditoIntegral: 0, despesaAnexo1: 0, despesaAnexo15: 0, despesaAnexo7: 0, despesaAnexo8: 0,
  deducaoIcmsIss: 0, deducaoPisCofins: 0, deducaoDescontos: 0, deducaoIbsCbs: 0,
  despesaSimplesNacional: 0, despesaSimplesNacionalReduzido30: 0,
  imoveis: 0, aluguel: 0, iptu: 0, luz: 0, agua: 0,
  telefone: 0, internet: 0, prestadores: 0, seguros: 0,
  marketing: 0, viagens: 0, depreciacao: 0, despesasGerais: 0, financeiros: 0,
};

const makeRevenueArray = (): RevenueData[] => Array(12).fill(null).map(() => JSON.parse(JSON.stringify(defaultRevenueDataMonth)));
const makeExpensesArray = (): MonthlyExpenses[] => Array(12).fill(null).map(() => ({ ...defaultMonthlyExpensesMonth }));

const defaultSimulationParams: SimulationParams = {
  anoSimulacao: 'definitivo',
  faturamentoAliquotaIBS: 0, faturamentoAliquotaCBS: 0,
  despesasAliquotaIBS: 0, despesasAliquotaCBS: 0,
  regimeCreditoSn: 'porDentro',
  snAliqDentro: 0, snAliqIbsFora: 0, snAliqCbsFora: 0,
  ultrapassouSublimite: false,
  creditoEstoqueVal: 0, redutorIbsCbs: 0,
};

// ==================== STORE ====================

export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      currentMonth: 0,
      analysisMode: 'monthly' as const,
      companyData: defaultCompanyData,
      firmData: defaultFirmData,
      professionalData: defaultProfessionalData,
      revenueData: makeRevenueArray(),
      monthlyExpenses: makeExpensesArray(),
      simulationParams: defaultSimulationParams,
      xmlFaturamento: [],
      xmlDespesas: [],
      calculationResults: {},
      savedClients: [],
      activeClientId: null,
      currentXmlMonth: 0,
      cnpjCache: {},

      setStep: (step) => set({ currentStep: step }),
      setCurrentMonth: (month) => set({ currentMonth: month, currentXmlMonth: month }),
      setCurrentXmlMonth: (month) => set({ currentXmlMonth: month }),
      setAnalysisMode: (mode) => set({ analysisMode: mode }),

      updateCompanyData: (data) => set((state) => {
        const newCompanyData = { ...state.companyData, ...data };
        if (data.cnaePrincipal !== undefined) {
          const reduction = verificarReducaoCnae(data.cnaePrincipal);
          return {
            companyData: newCompanyData,
            simulationParams: { ...state.simulationParams, redutorIbsCbs: reduction.percentage / 100 }
          };
        }
        return { companyData: newCompanyData };
      }),

      updateFirmData: (data) => set((state) => ({
        firmData: { ...state.firmData, ...data }
      })),

      updateProfessionalData: (data) => set((state) => ({
        professionalData: { ...state.professionalData, ...data }
      })),

      updateRevenueData: (monthIndex, data) => set((state) => {
        const newRevenueData = [...state.revenueData];
        newRevenueData[monthIndex] = { ...newRevenueData[monthIndex], ...data };
        return { revenueData: newRevenueData };
      }),

      updateMonthlyExpenses: (monthIndex, data) => set((state) => {
        const newExpenses = [...state.monthlyExpenses];
        newExpenses[monthIndex] = { ...newExpenses[monthIndex], ...data };
        return { monthlyExpenses: newExpenses };
      }),

      updateSimulationParams: (data) => set((state) => ({
        simulationParams: { ...state.simulationParams, ...data }
      })),

      updateXmlSalesStatus: (id, updates) => set((state) => ({
        xmlFaturamento: state.xmlFaturamento.map(xml => xml.id === id ? { ...xml, ...updates } : xml)
      })),

      updateXmlExpenseStatus: (id, updates) => set((state) => {
        const newXmls = state.xmlDespesas.map(xml => xml.id === id ? { ...xml, ...updates } : xml);
        const consolidado = consolidarXmlDespesas(newXmls);
        const newExpenses = [...state.monthlyExpenses];
        
        for (let i = 0; i < 12; i++) {
          newExpenses[i] = {
             ...newExpenses[i],
             despesaGeral: 0,
             despesaCreditoIntegral: 0, despesaAnexo1: 0, despesaAnexo15: 0, despesaAnexo7: 0, despesaAnexo8: 0,
             deducaoIcmsIss: 0,
             deducaoPisCofins: 0,
             deducaoDescontos: 0,
             despesaSimplesNacional: 0,
             despesaSimplesNacionalReduzido30: 0,
          };
          if (consolidado[i]) {
             newExpenses[i] = {
                ...newExpenses[i],
                despesaGeral: consolidado[i].despesaGeral || 0,
                despesaCreditoIntegral: consolidado[i].despesaCreditoIntegral || 0, despesaAnexo1: consolidado[i].despesaAnexo1 || 0, despesaAnexo15: consolidado[i].despesaAnexo15 || 0, despesaAnexo7: consolidado[i].despesaAnexo7 || 0, despesaAnexo8: consolidado[i].despesaAnexo8 || 0,
                deducaoIcmsIss: consolidado[i].deducaoIcmsIss || 0,
                deducaoPisCofins: consolidado[i].deducaoPisCofins || 0,
                deducaoDescontos: consolidado[i].deducaoDescontos || 0,
                despesaSimplesNacional: consolidado[i].despesaSimplesNacional || 0,
                despesaSimplesNacionalReduzido30: consolidado[i].despesaSimplesNacionalReduzido30 || 0,
             };
          }
        }
        
        return {
          xmlDespesas: newXmls,
          monthlyExpenses: newExpenses
        };
      }),

      addCnpjToCache: (cnpj, regime) => set((state) => ({
        cnpjCache: { ...state.cnpjCache, [cnpj]: regime }
      })),

      setXmlFaturamento: (xmls) => set({ xmlFaturamento: xmls }),
      setXmlDespesas: (xmls) => set((state) => {
        const consolidado = consolidarXmlDespesas(xmls);
        const newExpenses = [...state.monthlyExpenses];
        for (let i = 0; i < 12; i++) {
          if (consolidado[i]) {
             newExpenses[i] = {
                ...newExpenses[i],
                despesaGeral: consolidado[i].despesaGeral || 0,
                despesaCreditoIntegral: consolidado[i].despesaCreditoIntegral || 0, despesaAnexo1: consolidado[i].despesaAnexo1 || 0, despesaAnexo15: consolidado[i].despesaAnexo15 || 0, despesaAnexo7: consolidado[i].despesaAnexo7 || 0, despesaAnexo8: consolidado[i].despesaAnexo8 || 0,
                deducaoIcmsIss: consolidado[i].deducaoIcmsIss || 0,
                deducaoPisCofins: consolidado[i].deducaoPisCofins || 0,
                deducaoDescontos: consolidado[i].deducaoDescontos || 0,
                despesaSimplesNacional: consolidado[i].despesaSimplesNacional || 0,
                despesaSimplesNacionalReduzido30: consolidado[i].despesaSimplesNacionalReduzido30 || 0,
             };
          }
        }
        return { 
          xmlDespesas: xmls,
          monthlyExpenses: newExpenses
        };
      }),

      addXmlDespesa: (xml) => set((state) => {
        const newXmls = [...state.xmlDespesas, xml];
        const consolidado = consolidarXmlDespesas(newXmls);
        const newExpenses = [...state.monthlyExpenses];
        
        for (let i = 0; i < 12; i++) {
          if (consolidado[i]) {
             newExpenses[i] = {
                ...newExpenses[i],
                despesaGeral: consolidado[i].despesaGeral || 0,
                despesaCreditoIntegral: consolidado[i].despesaCreditoIntegral || 0, despesaAnexo1: consolidado[i].despesaAnexo1 || 0, despesaAnexo15: consolidado[i].despesaAnexo15 || 0, despesaAnexo7: consolidado[i].despesaAnexo7 || 0, despesaAnexo8: consolidado[i].despesaAnexo8 || 0,
                deducaoIcmsIss: consolidado[i].deducaoIcmsIss || 0,
                deducaoPisCofins: consolidado[i].deducaoPisCofins || 0,
                deducaoDescontos: consolidado[i].deducaoDescontos || 0,
                despesaSimplesNacional: consolidado[i].despesaSimplesNacional || 0,
                despesaSimplesNacionalReduzido30: consolidado[i].despesaSimplesNacionalReduzido30 || 0,
             };
          }
        }
        
        return {
          xmlDespesas: newXmls,
          monthlyExpenses: newExpenses
        };
      }),

      removeXmlDespesa: (id) => set((state) => {
        const newXmls = state.xmlDespesas.filter(x => x.id !== id);
        const consolidado = consolidarXmlDespesas(newXmls);
        const newExpenses = [...state.monthlyExpenses];
        
        for (let i = 0; i < 12; i++) {
          newExpenses[i] = {
             ...newExpenses[i],
             despesaGeral: 0,
             despesaCreditoIntegral: 0, despesaAnexo1: 0, despesaAnexo15: 0, despesaAnexo7: 0, despesaAnexo8: 0,
             deducaoIcmsIss: 0,
             deducaoPisCofins: 0,
             deducaoDescontos: 0,
             despesaSimplesNacional: 0,
             despesaSimplesNacionalReduzido30: 0,
          };
          if (consolidado[i]) {
             newExpenses[i] = {
                ...newExpenses[i],
                despesaGeral: consolidado[i].despesaGeral || 0,
                despesaCreditoIntegral: consolidado[i].despesaCreditoIntegral || 0, despesaAnexo1: consolidado[i].despesaAnexo1 || 0, despesaAnexo15: consolidado[i].despesaAnexo15 || 0, despesaAnexo7: consolidado[i].despesaAnexo7 || 0, despesaAnexo8: consolidado[i].despesaAnexo8 || 0,
                deducaoIcmsIss: consolidado[i].deducaoIcmsIss || 0,
                deducaoPisCofins: consolidado[i].deducaoPisCofins || 0,
                deducaoDescontos: consolidado[i].deducaoDescontos || 0,
                despesaSimplesNacional: consolidado[i].despesaSimplesNacional || 0,
                despesaSimplesNacionalReduzido30: consolidado[i].despesaSimplesNacionalReduzido30 || 0,
             };
          }
        }
        
        return {
          xmlDespesas: newXmls,
          monthlyExpenses: newExpenses
        };
      }),

      runCalculation: (monthIndex?: number) => {
        const state = get();
        const idx = monthIndex !== undefined ? monthIndex : state.currentMonth;
        const monthData = state.revenueData[idx];
        const expenseData = state.monthlyExpenses[idx];
        if (!monthData || monthData.rbt12 <= 0) return null;

        const anexos: TaxCalculatorParams['anexos'] = {};
        for (let i = 1; i <= 5; i++) {
          const key = i.toString();
          const ad = monthData.anexosData[key as AnexoId];
          anexos[key] = {
            active: monthData.anexosAtivos.includes(key as AnexoId),
            receitaMercadoInterno: ad.mercadoInterno,
            receitaMercadoExterno: ad.mercadoExterno,
            isIcmsStSegregado: ad.isIcmsStSegregado,
            receitaComIcmsSt: ad.receitaComIcmsSt,
          };
        }

        const totalCreditoBruto = expenseData.despesaGeral + expenseData.despesaCreditoIntegral
          + expenseData.despesaAnexo15
          - expenseData.deducaoIcmsIss - expenseData.deducaoPisCofins
          - expenseData.deducaoDescontos - expenseData.deducaoIbsCbs;

        const totalCreditoReduzido30 = expenseData.despesaAnexo7 + expenseData.despesaAnexo8;
        
        const totalCreditoSimplesNacional = expenseData.despesaSimplesNacional || 0;
        const totalCreditoSimplesNacionalReduzido30 = expenseData.despesaSimplesNacionalReduzido30 || 0;

        const params: TaxCalculatorParams = {
          rbt12: monthData.rbt12,
          activeYear: state.simulationParams.anoSimulacao as TaxCalculatorParams['activeYear'],
          ultrapassouSublimiteAnual: state.simulationParams.ultrapassouSublimite,
          redutorIbsCbs: state.simulationParams.redutorIbsCbs,
          aliqIbsDebitoOriginal: state.simulationParams.faturamentoAliquotaIBS / 100,
          aliqCbsDebitoOriginal: state.simulationParams.faturamentoAliquotaCBS / 100,
          aliqIbsCredito: state.simulationParams.despesasAliquotaIBS / 100,
          aliqCbsCredito: state.simulationParams.despesasAliquotaCBS / 100,
          snRegimeCredito: state.simulationParams.regimeCreditoSn,
          snAliqDentro: state.simulationParams.snAliqDentro / 100,
          snAliqIbsFora: state.simulationParams.snAliqIbsFora / 100,
          snAliqCbsFora: state.simulationParams.snAliqCbsFora / 100,
          creditoEstoqueVal: state.simulationParams.creditoEstoqueVal,
          anexos,
          expenses: {
            totalCreditoBruto: Math.max(0, totalCreditoBruto),
            totalCreditoReduzido30,
            totalCreditoSimplesNacional,
            totalCreditoSimplesNacionalReduzido30,
          }
        };

        const results = calculateResults(params);
        set({ calculationResults: { ...state.calculationResults, [idx]: results } });
        return results;
      },

      saveClient: (id, name) => set((state) => {
        const profile: ClientProfile = {
          id, name, savedAt: new Date().toISOString(),
          companyData: state.companyData,
          firmData: state.firmData,
          revenueData: state.revenueData,
          monthlyExpenses: state.monthlyExpenses,
          simulationParams: state.simulationParams,
          xmlFaturamento: state.xmlFaturamento,
          xmlDespesas: state.xmlDespesas,
        };
        const newClients = [...state.savedClients];
        const existingIdx = newClients.findIndex(c => c.id === id);
        if (existingIdx >= 0) { newClients[existingIdx] = profile; }
        else { newClients.push(profile); }
        return { savedClients: newClients, activeClientId: id };
      }),

      loadClient: (id) => set((state) => {
        const profile = state.savedClients.find(c => c.id === id);
        if (!profile) return {};
        return {
          activeClientId: id, companyData: profile.companyData,
          firmData: profile.firmData || defaultFirmData,
          revenueData: profile.revenueData,
          monthlyExpenses: profile.monthlyExpenses || makeExpensesArray(),
          simulationParams: profile.simulationParams,
          xmlFaturamento: profile.xmlFaturamento,
          xmlDespesas: profile.xmlDespesas,
          calculationResults: {},
        };
      }),

      deleteClient: (id) => set((state) => ({
        savedClients: state.savedClients.filter(c => c.id !== id),
        activeClientId: state.activeClientId === id ? null : state.activeClientId,
      })),

      newClient: () => set({
        activeClientId: null, companyData: defaultCompanyData,
        firmData: defaultFirmData,
        revenueData: makeRevenueArray(), monthlyExpenses: makeExpensesArray(),
        simulationParams: defaultSimulationParams,
        xmlFaturamento: [], xmlDespesas: [], calculationResults: {},
      }),
    }),
    {
      name: 'simples-nacional-storage',
      storage: createJSONStorage(() => idbStorage),
      version: 5,
      partialize: (state) => ({
        currentStep: state.currentStep, currentMonth: state.currentMonth,
        analysisMode: state.analysisMode, companyData: state.companyData,
        firmData: state.firmData, professionalData: state.professionalData,
        revenueData: state.revenueData, monthlyExpenses: state.monthlyExpenses,
        simulationParams: state.simulationParams,
        xmlFaturamento: state.xmlFaturamento, xmlDespesas: state.xmlDespesas,
        savedClients: state.savedClients, activeClientId: state.activeClientId,
        currentXmlMonth: state.currentXmlMonth, cnpjCache: state.cnpjCache,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 5) {
          persistedState.firmData = persistedState.firmData || defaultFirmData;
          persistedState.professionalData = persistedState.professionalData || defaultProfessionalData;
          
          if (!Array.isArray(persistedState.revenueData)) {
            persistedState.revenueData = makeRevenueArray();
          }
          if (!Array.isArray(persistedState.monthlyExpenses)) {
            persistedState.monthlyExpenses = makeExpensesArray();
          }

          persistedState.currentMonth = persistedState.currentMonth || 0;
          persistedState.analysisMode = persistedState.analysisMode || 'monthly';
          
          persistedState.savedClients = persistedState.savedClients || [];
          if (Array.isArray(persistedState.savedClients)) {
            persistedState.savedClients.forEach((client: any) => {
              if (!Array.isArray(client.revenueData)) {
                client.revenueData = makeRevenueArray();
              }
              if (!Array.isArray(client.monthlyExpenses)) {
                client.monthlyExpenses = makeExpensesArray();
              }
              if (!client.firmData) client.firmData = defaultFirmData;
            });
          }

          persistedState.activeClientId = persistedState.activeClientId || null;
          persistedState.simulationParams = {
            ...defaultSimulationParams,
            ...(persistedState.simulationParams || {}),
            creditoEstoqueVal: 0, redutorIbsCbs: 0,
          };
          persistedState.currentXmlMonth = persistedState.currentMonth || 0;
          persistedState.cnpjCache = persistedState.cnpjCache || {};
        }
        return persistedState;
      },
    }
  )
);
