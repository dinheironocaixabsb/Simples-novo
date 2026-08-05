import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LucroPresumidoConfig, ReceitaMensalLP, DespesaMensalLP } from '../domain/types/lucro-presumido';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const defaultReceitas = MESES.map(mes => ({
  mes,
  receitaServicos: 0,
  receitaComercio: 0,
  receitaMonofasica: 0,
  icmsDestacado: 0,
  issRetido: 0,
  devolucoesDescontos: 0
}));

const defaultDespesas = MESES.map(mes => ({
  mes,
  despesasGeraCredito: 0,
  comprasSimplesNacional: 0
}));

interface LucroPresumidoState {
  currentStep: number;
  config: LucroPresumidoConfig;
  receitasMensais: ReceitaMensalLP[];
  despesasMensais: DespesaMensalLP[];
  
  // Ações
  setStep: (step: number) => void;
  updateConfig: (updates: Partial<LucroPresumidoConfig>) => void;
  updateReceitaMes: (mesIndex: number, updates: Partial<ReceitaMensalLP>) => void;
  updateDespesaMes: (mesIndex: number, updates: Partial<DespesaMensalLP>) => void;
  reset: () => void;
}

export const useLucroPresumidoStore = create<LucroPresumidoState>()(
  persist(
    (set) => ({
      currentStep: 1,
      
      config: {
        isEquiparadaHospitalar: false,
        regimePisCofins: 'cumulativo',
        aliquotaPisCumulativo: 0.0065,
        aliquotaCofinsCumulativo: 0.03,
        aliquotaIss: 0.05,
        aliquotaIbsDebito: 0.177,
        aliquotaCbsDebito: 0.088,
        aliquotaIbsCredito: 0.177,
        aliquotaCbsCredito: 0.088
      },
      
      receitasMensais: [...defaultReceitas],
      despesasMensais: [...defaultDespesas],
      
      setStep: (step) => set({ currentStep: step }),
      
      updateConfig: (updates) => set((state) => ({ 
        config: { ...state.config, ...updates } 
      })),
      
      updateReceitaMes: (mesIndex, updates) => set((state) => {
        const novasReceitas = [...state.receitasMensais];
        novasReceitas[mesIndex] = { ...novasReceitas[mesIndex], ...updates };
        return { receitasMensais: novasReceitas };
      }),
      
      updateDespesaMes: (mesIndex, updates) => set((state) => {
        const novasDespesas = [...state.despesasMensais];
        novasDespesas[mesIndex] = { ...novasDespesas[mesIndex], ...updates };
        return { despesasMensais: novasDespesas };
      }),
      
      reset: () => set({ 
        currentStep: 1,
        config: {
          isEquiparadaHospitalar: false,
          regimePisCofins: 'cumulativo',
          aliquotaPisCumulativo: 0.0065,
          aliquotaCofinsCumulativo: 0.03,
          aliquotaIss: 0.05,
          aliquotaIbsDebito: 0.177,
          aliquotaCbsDebito: 0.088,
          aliquotaIbsCredito: 0.177,
          aliquotaCbsCredito: 0.088
        },
        receitasMensais: [...defaultReceitas],
        despesasMensais: [...defaultDespesas]
      }),
    }),
    {
      name: 'lucro-presumido-storage',
    }
  )
);
