import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LucroPresumidoConfig, ReceitaMensalLP, DespesaMensalLP, CategoriaDespesa, DespesaNota } from '../domain/types/lucro-presumido';
import { useClientStore } from './useClientStore';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const defaultReceitas = MESES.map(mes => ({
  mes,
  atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transporteCargas: false, transportePassageiros: false },
  receitas: { mercadoInterno: 0, mercadoExterno: 0, cst04: 0, cst06Monofasico: 0, cst06AliquotaZero: 0, anexo1: 0, anexo5: 0, anexo7: 0, anexo8: 0 },
  exclusoes: { descontosIncondicionais: 0, devolucoesVendas: 0, iss: 0, icmsPisCofins: 0, icmsIbsCbs: 0, pisCofinsIbsCbs: 0 }
}));

const defaultDespesas = MESES.map(mes => ({
  mes,
  despesasGeraCredito: 0,
  comprasSimplesNacional: 0,
  notas: [] as DespesaNota[],
  despesaGeral: 0,
  despesaCreditoIntegral: 0,
  despesaAnexo1: 0,
  despesaAnexo15: 0,
  despesaAnexo7: 0,
  despesaAnexo8: 0,
  deducaoIcmsIss: 0,
  deducaoPisCofins: 0,
  deducaoDescontos: 0
}));

const defaultCategorias: CategoriaDespesa[] = [
  { id: '1', nome: 'Compras / Insumos / Mercadorias', enquadramento: 'Normal (100%)', percentualCredito: 1 },
  { id: '2', nome: 'Aluguel de Imóveis, Sede e Equipamentos', enquadramento: 'Normal (100%)', percentualCredito: 1 },
  { id: '3', nome: 'Advogados / Honorários', enquadramento: 'Reduzida (Redução 30%)', percentualCredito: 0.7 },
  { id: '4', nome: 'Alimentos para Consumo Humano (Anexo I)', enquadramento: 'Isento (Sem Crédito)', percentualCredito: 0 },
  { id: '5', nome: 'Hortifruti (Anexo XV)', enquadramento: 'Normal (100%)', percentualCredito: 1 },
];

const defaultConfig: LucroPresumidoConfig = {
  isEquiparadaHospitalar: false,
  regimePisCofins: 'cumulativo',
  aliquotaPisCumulativo: 0.0065,
  aliquotaCofinsCumulativo: 0.03,
  anoSimulacao: 'Regra Definitiva (2033+)',
  aliquotaIbsDebito: 0.17,
  aliquotaCbsDebito: 0.089,
  aliquotaIcms: 0.18,
  aliquotaIss: 0.05,
  creditoPresumidoEstoque: 0,
  redutorIbsCbs: 0,
  tipoCreditoSimples: 'por_dentro_estimado',
  aliquotaMediaSimples: 0.04,
  aliquotaIbsFornecedorSimples: 0.001,
  aliquotaCbsFornecedorSimples: 0.009,
  aliquotaIbsCreditoGeral: 0.17,
  aliquotaCbsCreditoGeral: 0.089,
};

interface LucroPresumidoState {
  currentStep: number;
  currentMonth: number;
  config: LucroPresumidoConfig;
  receitasMensais: ReceitaMensalLP[];
  despesasMensais: DespesaMensalLP[];
  categoriasDespesa: CategoriaDespesa[];
  
  // Ações
  setStep: (step: number) => void;
  setCurrentMonth: (month: number) => void;
  updateConfig: (updates: Partial<LucroPresumidoConfig>) => void;
  updateReceitaMes: (mesIndex: number, updates: Partial<ReceitaMensalLP>) => void;
  updateDespesaMes: (mesIndex: number, updates: Partial<DespesaMensalLP>) => void;
  
  adicionarNota: (nota: DespesaNota) => void;
  removerNota: (notaId: string) => void;
  limparNotas: () => void;
  adicionarCategoria: (cat: CategoriaDespesa) => void;
  
  // Global Actions
  saveClient: () => void;
  loadClient: (id: string) => void;
  newClient: () => void;
}

export const useLucroPresumidoStore = create<LucroPresumidoState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      currentMonth: 0,
      
      config: { ...defaultConfig },
      receitasMensais: JSON.parse(JSON.stringify(defaultReceitas)),
      despesasMensais: JSON.parse(JSON.stringify(defaultDespesas)),
      categoriasDespesa: [...defaultCategorias],
      
      setStep: (step) => set({ currentStep: step }),
      setCurrentMonth: (month) => set({ currentMonth: month }),
      
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
      
      adicionarNota: (nota) => set((state) => {
        const mesIndex = MESES.indexOf(nota.mes);
        if (mesIndex === -1) return state;
        const novasDespesas = [...state.despesasMensais];
        novasDespesas[mesIndex].notas = [...novasDespesas[mesIndex].notas, nota];
        return { despesasMensais: novasDespesas };
      }),

      removerNota: (notaId) => set((state) => {
        const novasDespesas = state.despesasMensais.map(dm => ({
          ...dm,
          notas: dm.notas.filter(n => n.id !== notaId)
        }));
        return { despesasMensais: novasDespesas };
      }),

      limparNotas: () => set((state) => {
        const novasDespesas = state.despesasMensais.map(dm => ({ ...dm, notas: [] }));
        return { despesasMensais: novasDespesas };
      }),

      adicionarCategoria: (cat) => set((state) => ({
        categoriasDespesa: [...state.categoriasDespesa, cat]
      })),
      
      saveClient: () => {
        const state = get();
        useClientStore.getState().saveClient({
          lucroPresumido: {
            config: state.config,
            receitasMensais: state.receitasMensais,
            despesasMensais: state.despesasMensais,
            categoriasDespesa: state.categoriasDespesa,
          }
        });
      },

      loadClient: (id) => {
        const profile = useClientStore.getState().loadClient(id);
        if (profile?.lucroPresumido) {
          set({
            config: profile.lucroPresumido.config,
            receitasMensais: profile.lucroPresumido.receitasMensais,
            despesasMensais: profile.lucroPresumido.despesasMensais,
            categoriasDespesa: profile.lucroPresumido.categoriasDespesa || [...defaultCategorias],
          });
        } else {
          set({
            config: { ...defaultConfig },
            receitasMensais: JSON.parse(JSON.stringify(defaultReceitas)),
            despesasMensais: JSON.parse(JSON.stringify(defaultDespesas)),
            categoriasDespesa: [...defaultCategorias],
          });
        }
      },

      newClient: () => {
        useClientStore.getState().newClient();
        set({
          currentStep: 1,
          currentMonth: 0,
          config: { ...defaultConfig },
          receitasMensais: JSON.parse(JSON.stringify(defaultReceitas)),
          despesasMensais: JSON.parse(JSON.stringify(defaultDespesas)),
          categoriasDespesa: [...defaultCategorias],
        });
      },
    }),
    {
      name: 'lucro-presumido-storage',
    }
  )
);
