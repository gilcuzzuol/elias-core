# ADR-0006: Abstração plugável de provedores de LLM

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem impacto de custo/privacidade/irreversibilidade significativos)

## Contexto

O ELIAS deve integrar tanto Claude quanto ChatGPT, e permanecer aberto a modelos futuros (outros provedores, ou modelos locais), sem exigir reescrever o Core Orchestrator ou os agentes a cada mudança de provedor.

## Decisão

Definir uma interface única `LLMProvider` (operações como completar, fazer streaming, contar tokens) implementada por adapters específicos por provedor (`ClaudeProvider`, `OpenAIProvider`, e futuros). O Core Orchestrator e os agentes nunca chamam SDKs de provedor diretamente — sempre através da interface comum. A escolha de qual provedor usar para qual tarefa é **configuração**, não lógica hardcoded no código dos agentes.

## Consequências

**Positivas:**
- Trocar ou adicionar um provedor de LLM não exige mudanças em agentes ou no core.
- Permite estratégias como fallback automático entre provedores, ou uso de modelos diferentes por tipo de tarefa (ex: Claude para raciocínio/código, ChatGPT como segunda opinião).
- Prepara o sistema para a chegada de novos provedores relevantes nos próximos anos sem retrabalho estrutural.

**Negativas:**
- A abstração introduz uma camada extra de indireção e pode esconder features específicas e exclusivas de um provedor — mitigado permitindo um "escape hatch" tipado para quando um agente realmente precisar de uma capacidade exclusiva de um provedor específico.

## Alternativas consideradas

- **Integrar SDKs diretamente onde necessário:** mais rápido de implementar no início, mas contraria o requisito permanente de "expansão contínua por muitos anos" e cria acoplamento espalhado pelo código que se torna caro de desfazer conforme o número de agentes cresce.
