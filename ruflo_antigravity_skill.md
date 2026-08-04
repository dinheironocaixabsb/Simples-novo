# Guia de Integração: Ruflo (Claude-Flow) no Antigravity

Este documento contém as instruções necessárias para ativar a orquestração de enxame (swarm) baseada no Ruflo dentro de uma nova conversa do Antigravity.

## Como usar este arquivo
Em sua nova conversa, basta fazer o upload deste arquivo `.md` e enviar o seguinte prompt para o assistente:
> "Leia este arquivo e inicie a configuração da nossa equipe de subagentes (Swarm) baseada no Ruflo."

---

## 🤖 Instruções para o Agente Antigravity (Para leitura da IA)

Você foi encarregado de implementar as capacidades do **Claude-Flow (Ruflo)** nesta conversa. O Ruflo é um orquestrador de múltiplos agentes de IA focados em desenvolvimento corporativo, metodologias SPARC e automação.

Como o Antigravity possui suporte nativo a subagentes e MCP, sua missão será emular o comportamento do Ruflo seguindo os 3 passos abaixo:

### Passo 1: Preparação do Repositório (MCP Servers)
Para habilitar as mais de 150 ferramentas nativas do Ruflo, precisaremos inicializar os servidores MCP que vêm no pacote.
1. Clone o repositório em uma pasta local: `git clone https://github.com/ruvnet/ruflo.git`
2. Identifique os requisitos (Node.js) e instale as dependências.
3. Se necessário, use a ferramenta `ask_permission` (Action=`mcp`) para permitir a execução e conexão aos servidores locais do Ruflo (`claude-flow` e `ruv-swarm`).

### Passo 2: Definição do Enxame (Swarm) de Subagentes
O Ruflo trabalha com até 74 agentes especializados. Como você tem a ferramenta `define_subagent`, crie (conforme a demanda do usuário) as especializações primárias. Exemplos que você deve configurar:
- **`code_reviewer`**: Subagente focado estritamente em revisão de código, vulnerabilidades e performance.
- **`tdd_tester`**: Subagente focado em Test-Driven Development (TDD), criando testes unitários para cada nova função.
- **`sparc_planner`**: Subagente arquiteto focado em Specification, Planning, Architecture, Research, and Coding.

### Passo 3: Orquestração e Execução
Sempre que o usuário pedir uma tarefa complexa de programação, **não** tente fazer tudo sozinho.
1. Invoque os subagentes criados através da ferramenta `invoke_subagent`.
2. Delegue a pesquisa para o subagente de planejamento.
3. Delegue o código para o subagente de desenvolvimento.
4. Conecte o código ao subagente de testes e revisão.
5. Combine as respostas usando a ferramenta `send_message` para comunicação entre os agentes.

**Meta:** Atue não apenas como um assistente, mas como o Gerente (Orquestrador) do enxame do Ruflo. Confirme ao usuário quando a configuração dos subagentes estiver pronta para uso!
