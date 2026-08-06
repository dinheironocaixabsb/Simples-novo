import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { AnexoId } from '../domain/types/tax.types';
import { ParsedXmlSales, ParsedXmlExpense } from '../domain/types/xml.types';
import { calculateResults, TaxCalculatorParams, TaxCalculatorResult } from '../services/tax-calculator';
import { verificarReducaoCnae } from '../services/cnae-reducer';
import { consolidarXmlDespesas } from '../services/xml/xml-consolidator';
import { useClientStore } from './useClientStore';

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

interface DiagnosisState {
  currentStep: number;
  currentMonth: number;
  analysisMode: 'monthly' | 'average';
  
  revenueData: RevenueData[];
  monthlyExpenses: MonthlyExpenses[];
  simulationParams: SimulationParams;
  
  calculationResults: Record<number, TaxCalculatorResult | null>;
  currentXmlMonth: number;
  cnpjCache: Record<string, string>;

  setStep: (step: number) => void;
  setCurrentMonth: (month: number) => void;
  setAnalysisMode: (mode: 'monthly' | 'average') => void;
  
  updateRevenueData: (monthIndex: number, data: Partial<RevenueData>) => void;
  updateMonthlyExpenses: (monthIndex: number, data: Partial<MonthlyExpenses>) => void;
  updateSimulationParams: (data: Partial<SimulationParams>) => void;
  
  runCalculation: (monthIndex?: number) => TaxCalculatorResult | null;
  saveClient: () => void;
  loadClient: (id: string) => void;
  deleteClient: (id: string) => void;
  newClient: () => void;
  
  setCurrentXmlMonth: (month: number) => void;
  addCnpjToCache: (cnpj: string, regime: string) => void;
  
  // Utilidades para refazer os expenses baseados nos XMLs globais
  recalcularDespesasDosXmls: () => void;
}

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

export const defaultSimulationParams: SimulationParams = {
  anoSimulacao: '2026',
  faturamentoAliquotaIBS: 0.10, faturamentoAliquotaCBS: 0.90,
  despesasAliquotaIBS: 0.10, despesasAliquotaCBS: 0.90,
  regimeCreditoSn: 'porDentro',
  snAliqDentro: 4, snAliqIbsFora: 0.10, snAliqCbsFora: 0.90,
  ultrapassouSublimite: false,
  creditoEstoqueVal: 0, redutorIbsCbs: 0,
};

export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      currentMonth: 0,
      analysisMode: 'monthly' as const,
      revenueData: makeRevenueArray(),
      monthlyExpenses: makeExpensesArray(),
      simulationParams: defaultSimulationParams,
      calculationResults: {},
      currentXmlMonth: 0,
      cnpjCache: {},

      setStep: (step) => set({ currentStep: step }),
      setCurrentMonth: (month) => set({ currentMonth: month, currentXmlMonth: month }),
      setCurrentXmlMonth: (month) => set({ currentXmlMonth: month }),
      setAnalysisMode: (mode) => set({ analysisMode: mode }),

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

      recalcularDespesasDosXmls: () => set((state) => {
        const xmls = useClientStore.getState().activeXmlDespesas;
        const consolidado = consolidarXmlDespesas(xmls);
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
        return { monthlyExpenses: newExpenses };
      }),

      addCnpjToCache: (cnpj, regime) => set((state) => ({
        cnpjCache: { ...state.cnpjCache, [cnpj]: regime }
      })),

      runCalculation: (monthIndex?: number) => {
        const state = get();
        const idx = monthIndex !== undefined ? monthIndex : state.currentMonth;
        const monthData = state.revenueData[idx];
        const expenseData = state.monthlyExpenses[idx];
        
        const rbt12 = monthData?.rbt12 || 0;

        const anexos: TaxCalculatorParams['anexos'] = {};
        for (let i = 1; i <= 5; i++) {
          const key = i.toString();
          const ad = monthData?.anexosData?.[key as AnexoId];
          anexos[key] = {
            active: monthData?.anexosAtivos?.includes(key as AnexoId) || false,
            receitaMercadoInterno: ad?.mercadoInterno || 0,
            receitaMercadoExterno: ad?.mercadoExterno || 0,
            isIcmsStSegregado: ad?.isIcmsStSegregado || false,
            receitaComIcmsSt: ad?.receitaComIcmsSt || 0,
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
          rbt12: rbt12,
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

      saveClient: () => {
        const state = get();
        useClientStore.getState().saveClient({
          simplesNacional: {
            revenueData: state.revenueData,
            monthlyExpenses: state.monthlyExpenses,
            simulationParams: state.simulationParams
          }
        });
      },

      loadClient: (id) => {
        const profile = useClientStore.getState().loadClient(id);
        if (profile) {
           if (profile.simplesNacional) {
              set({
                 revenueData: profile.simplesNacional.revenueData,
                 monthlyExpenses: profile.simplesNacional.monthlyExpenses,
                 simulationParams: profile.simplesNacional.simulationParams,
                 calculationResults: {},
              });
           } else {
              set({
                 revenueData: makeRevenueArray(), monthlyExpenses: makeExpensesArray(),
                 simulationParams: defaultSimulationParams, calculationResults: {},
              });
           }
        }
      },

      deleteClient: (id) => {
        useClientStore.getState().deleteClient(id);
      },

      newClient: () => {
        useClientStore.getState().newClient();
        set({
          revenueData: makeRevenueArray(), monthlyExpenses: makeExpensesArray(),
          simulationParams: defaultSimulationParams, calculationResults: {},
        });
      }
    }),
    {
      name: 'simples-nacional-storage',
      storage: createJSONStorage(() => idbStorage),
      version: 6,
      partialize: (state) => ({
        currentStep: state.currentStep, currentMonth: state.currentMonth,
        analysisMode: state.analysisMode,
        revenueData: state.revenueData, monthlyExpenses: state.monthlyExpenses,
        simulationParams: state.simulationParams,
        currentXmlMonth: state.currentXmlMonth, cnpjCache: state.cnpjCache,
      })
    }
  )
);
