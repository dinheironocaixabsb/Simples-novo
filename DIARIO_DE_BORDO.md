# Diário de Bordo: Transição SaaS SIMPLES NOVO

## Início da Fase 1 - Setup e Extração do Motor Tributário
- **Data/Hora:** Operação autônoma iniciada e concluída.
- **Ações Planejadas:** 
  1. Criação da base Next.js.
  2. Extração da inteligência contábil (Javascript) para módulos tipados (TypeScript).

### Logs de Execução:
- **[CONCLUÍDO]** Criação do projeto Next.js com App Router, TailwindCSS e TypeScript configurado em modo Strict.
- **[CONCLUÍDO]** Limpeza de todos os boilerplates do framework para uma tela em branco limpa (`page.tsx` e `globals.css`).
- **[CONCLUÍDO]** Instalação de bibliotecas essenciais para persistência local pesada: `zustand`, `idb` (IndexedDB) e ícones `lucide-react`.
- **[CONCLUÍDO]** **Brain Extraction (1/2):** Mapeadas e extraídas todas as constantes e tipagens fiscais (`SIMPLES_TABLES`, e estruturas de Anexo) da linha 1696 do `app_v4.js` para `src/domain/types/tax.types.ts`.
- **[CONCLUÍDO]** **Brain Extraction (2/2):** Mapeado e extraído o "Coração Matemático" (função `calculateResults` na linha 1783 do `app_v4.js`). Criado o módulo 100% puro `src/services/tax-engine/simples-calculator.ts` que lida com deduções, ST, partições e crédito IBS/CBS.
- **[CONCLUÍDO]** **Testes de Paridade (Golden Rule):** Instalado `vitest` e executada simulação (Faixa 1, Anexo 1, Sem ST e Com ST). Todos os resultados bateram centavo por centavo com a regra matemática original.

## Início da Fase 2 - Componentização e Persistência Visual
- **Data/Hora:** Operação autônoma iniciada e concluída.
- **Ações Planejadas:**
  1. Configuração do Zustand com IndexedDB para armazenar o estado global sem limite de 5MB.
  2. Construção da interface com Tailwind e componentização dos Passos 1, 2 e Simulação (5).

### Logs de Execução:
- **[CONCLUÍDO]** Instalado `idb-keyval` e construída a store `useDiagnosisStore.ts` com tipagem para Dados da Empresa e Receita.
- **[CONCLUÍDO]** Criado o Layout Principal da aplicação com Sidebar dinâmica (`AppLayout.tsx`, `Sidebar.tsx`).
- **[CONCLUÍDO]** Criado `Step1CompanyData.tsx` para input da Razão Social e CNPJ.
- **[CONCLUÍDO]** Criado `Step2Revenue.tsx` que permite ao usuário informar o `RBT12` e selecionar Anexos (1 a 5), incluindo detalhamento de ST e mercado interno/externo.
- **[CONCLUÍDO]** **Integração Crucial:** Desenvolvido o hook reativo `useTaxSimulation.ts` que escuta as mudanças no Zustand (Passo 2) e recalcula instantaneamente os tributos usando a engine `simples-calculator.ts` extraída na Fase 1.
- **[CONCLUÍDO]** Criado o visualizador `Step5Simulation.tsx` (Passo 5) provando a integração da UI com o motor.

A arquitetura visual primária e o fluxo de dados React -> Zustand -> Engine -> UI estão comprovadamente funcionando e responsivos.
Pronto para a Fase 3 (Migração do Fator R, Lucro Presumido/Real e Upload de XML).
