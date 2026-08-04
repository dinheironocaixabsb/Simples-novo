# Plano de Transição SaaS: Sistema Simples Nacional 🚀

Este documento é o plano de guerra definitivo para a transição do sistema "monolito" atual (baseado em HTML/JS puro) para uma arquitetura SaaS de nível global. O objetivo inegociável é: **Zero perda de funcionalidades, escalabilidade total e segurança máxima do código.**

> [!CAUTION]
> **A REGRA DE OURO (PARIDADE ESTRITA):** 
> É absolutamente proibido criar lógicas, comportamentos ou resultados matemáticos que fujam ou divirjam do resultado gerado pela ferramenta antiga. O Front-end novo deve obedecer de forma dogmática o fluxo original (Passos 1 ao 7). A ferramenta antiga é a "Bíblia" do projeto. Em caso de perda de contexto ou dúvida estrutural, a codificação deve ser paralisada para re-consultar o código fonte original (`app_v4.js` e `SISTEMA_ATUALIZADO.html`) e confirmar o fluxo com o usuário antes de prosseguir.

> [!IMPORTANT]
> **DIRETRIZ ESTRATÉGICA PRINCIPAL (LOCAL-FIRST E MODULARIDADE):** Todo o sistema deve funcionar 100% de forma autônoma e local no navegador antes de implementarmos qualquer banco de dados externo (Supabase) ou subirmos para produção. A nuvem é a última etapa. Além disso, o sistema sairá de um Monolito (um único arquivo gigante) para uma **Arquitetura 100% Modular**, dividida em micro-arquivos lógicos.

> [!NOTE]
> **DIÁRIO DE BORDO E LOGS (MANUTENÇÃO):** 
> A cada passo e módulo refatorado, manteremos um arquivo de log chamado `DIARIO_DE_BORDO.md` detalhando exatamente de onde o código veio (`app_v4.js`, linha X) e para qual módulo ele foi migrado. Isso servirá como documentação perene para manutenções futuras.

> [!TIP]
> **SEGURANÇA DE DADOS PESADOS (INDEXED-DB):** 
> Como a nossa diretriz é "Local-First", se o usuário fizer upload de 50 Notas Fiscais em XML, salvar tudo no `LocalStorage` padrão pode estourar o limite de 5MB do navegador e travar a tela (QuotaExceededError). Para evitar isso, a arquitetura usará **IndexedDB** (um banco de dados robusto e veloz nativo dos navegadores modernos) acoplado ao Zustand, garantindo que o usuário possa fazer diagnósticos absurdamente pesados offline sem travar a memória.

---

## 1. Minha Opinião Sincera sobre a Stack (O Padrão Ouro)

O código atual (um `app_v4.js` de 12.000 linhas) é um milagre da engenharia frontend. No entanto, para virar um SaaS monetizável, seguro e à prova de falhas, a base precisa mudar mantendo a mesma alma.

**Stack Recomendada para o Novo SaaS:**
1.  **Linguagem: TypeScript (Strict Mode)**
    *   *Por que?* Cálculos tributários lidam com dinheiro. Vamos aplicar as diretrizes do **Matt Pocock** (Type Transformations e Zod) para garantir que cada alíquota e RBT12 esteja tipada de forma impenetrável.
2.  **Framework: Next.js (App Router) + React**
    *   *Por que?* O Next.js permite que o sistema rode localmente em altíssima performance, mantendo a flexibilidade de virar um SaaS Vercel no futuro.
3.  **Estilização: Tailwind CSS + Shadcn UI**
    *   *Por que?* Permite desenvolver painéis modernos direto nas tags, sem side-effects.
4.  **State Management (Local-First): Zustand com IndexedDB Persist**
    *   *Por que?* Vai gerenciar os "Passos 1 a 7" de forma reativa e persistindo dados *offline* pesados sem travar a interface. Garantirá que tudo funcione localmente antes de conectarmos à nuvem.
5.  **Backend / Database: Supabase (Última Fase Exclusivamente)**
    *   *Por que?* Deixaremos a conexão externa, RLS e banco de dados para a última fase. O módulo de Inteligência Artificial ("Grill-me") será mockado (simulado com respostas padrão) nas fases locais 1 a 3 para testar a UI sem bater no servidor.

---

## 2. Estratégia de Transição: Dissecando o Monolito (A Modularização)

A regra de ouro de uma refatoração deste nível é a **Separação de Preocupações**. Sair de um arquivo de 12.000 linhas para dezenas de pequenos arquivos modulares focados em fazer uma única coisa perfeitamente.

### 📁 `src/domain/` (As Leis Fiscais & Tipos)
*   `types/tax.types.ts`: Tipagens para Anexos, Faixas, `RBT12`, `ICMS_ST`.

### 📁 `src/services/tax-engine/` (O Motor Matemático - 100% Modular e Isolado)
Vamos arrancar a função `calculateResults()` e suas subsidiárias das linhas 1600+ do código antigo e transformá-las em funções modulares.
*   *Vantagem da Modularidade:* Se o governo mudar a alíquota do Anexo III em 2027, você não vai procurar num arquivo de 12 mil linhas. Você irá apenas no arquivo `src/services/tax-engine/anexo-iii-rules.ts` e alterará 1 linha.

### 📁 `src/components/` (A Interface UI)
Os arquivos HTML de "Passo 1 ao 7" vão virar Componentes React isolados, respeitando visualmente o fluxo original.

### 📁 `src/hooks/` (A Conexão)
*   `useDiagnosisForm.ts`: Controla a navegação estrita entre os passos e validações.

---

## 3. Plano de Execução em 4 Fases (Operação de Guerra)

### Fase 1: Fundação Local-First e Engine Tributário (1 a 2 semanas)
*   Inicializar repositório Next.js com Tailwind, Zustand e TypeScript (Strict mode).
*   **Brain Extraction:** Migrar as funções matemáticas puras para `src/services/`.
*   Criar testes unitários exaustivos para a calculadora usando as calculadoras originais como espelho obrigatório.

### Fase 2: Componentização Visual e Persistência Local Avançada (2 semanas)
*   Reescrever a tela estática em componentes do React, mantendo a experiência idêntica.
*   Implementar a reatividade Zustand ligada ao **IndexedDB** para evitar travamentos de memória.

### Fase 3: Geração de Relatórios e Polimento (1 semana)
*   Implementar a exportação complexa de relatórios (Laudo/PDF e ExcelJS).
*   Validação de ponta a ponta garantindo paridade funcional absoluta com o monolito original.

### Fase 4: Inteligência SaaS e Nuvem (A Etapa Final - 1 a 2 semanas)
*   Plugar o banco de dados Supabase para backup em nuvem.
*   Criar o sistema de Autenticação (Login) para usuários e Painel de Assinante.
*   Deploy oficial.
