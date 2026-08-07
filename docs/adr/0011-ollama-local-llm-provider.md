# ADR-0011: Provedor de LLM local gratuito via Ollama

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Gil, a pedido explícito (escolha de custo/privacidade entre
alternativas equivalentes na abstração já existente — critério de consulta
humana, Princípio 5); implementada pelo Chief AI Architect.

## Contexto

O único `LLMProvider` implementado até aqui era o Claude (ADR-0006), que cobra
por token via API da Anthropic. Gil quer poder rodar o ELIAS sem custo
recorrente, usando um modelo rodando localmente no Mac, mantendo a mesma
abstração `LLMProvider` — sem reescrever `ChatSession` nem nenhum agente.

Isso espelha a decisão já tomada para embeddings (ADR-0009: local por padrão,
por custo e privacidade). Para o LLM de conversação, porém, a escolha não é
"local por padrão" — é uma alternativa configurável que o usuário liga quando
quiser, porque a qualidade de raciocínio de modelos locais hoje fica atrás da
do Claude, especialmente em tarefas mais complexas.

## Decisão

- Novo `OllamaProvider` em `packages/llm/src/ollama.ts`, implementando o mesmo
  contrato `LLMProvider` do `ClaudeProvider`. Fala com a API HTTP local do
  [Ollama](https://ollama.com) (`POST {baseUrl}/api/chat`), com `model` e
  `baseUrl` configuráveis.
- `createLLMProvider()` (fábrica em `@elias/core`, único lugar que escolhe
  provedor concreto — ADR-0006) passa a aceitar `ELIAS_LLM_PROVIDER=ollama`,
  lendo `ELIAS_OLLAMA_MODEL` (padrão `llama3.1`) e `ELIAS_OLLAMA_URL` (padrão
  `http://localhost:11434`).
- Diferença de implementação relevante: ao contrário da API do Claude, o
  Ollama já aceita mensagens `role: "system"` diretamente no array
  `messages` — o adapter não precisa extrair e concatenar um campo `system`
  separado como o `ClaudeProvider` faz.
- Troca de provedor é 100% configuração (`ELIAS_LLM_PROVIDER` no `.env`); nada
  no `ChatSession` ou em código de agente muda.

## Consequências

**Positivas:**
- Custo marginal zero por conversa — sem depender de crédito de API.
- Nada trafega para fora da máquina do usuário nesse modo (mesmo raciocínio
  de privacidade do ADR-0009), útil para testes/uso offline.
- Valida na prática que a abstração `LLMProvider` (ADR-0006) realmente
  permite trocar de provedor sem retrabalho — segunda implementação real da
  interface, depois do Claude.

**Negativas:**
- Qualidade de resposta/raciocínio inferior à do Claude para tarefas
  complexas — trade-off aceito conscientemente pelo usuário ao escolher esse
  modo, não algo que o ELIAS deve esconder ou disfarçar.
- Desempenho depende do hardware do usuário (RAM/CPU/GPU do Mac); modelos
  maiores/melhores exigem mais recursos e ficam mais lentos.
- Fica sob responsabilidade do usuário manter o Ollama rodando
  (`ollama serve`) e os modelos baixados/atualizados — não há esse
  gerenciamento de ciclo de vida automatizado nesta fase.
- Sem streaming nem contagem de tokens tão precisa quanto a API paga (os
  campos `prompt_eval_count`/`eval_count` do Ollama são usados como proxy de
  uso de tokens, mas não são garantidamente idênticos ao tokenizador de
  outros provedores).

## Alternativas consideradas

- **Não oferecer opção local para o LLM de conversação:** rejeitada — Gil
  pediu explicitamente a opção gratuita, e a arquitetura (ADR-0006) já foi
  desenhada para suportar exatamente esse tipo de troca sem custo de
  engenharia relevante.
- **Integrar `llama.cpp` diretamente (sem Ollama) ou outro runtime tipo LM
  Studio:** rejeitada por ora — Ollama oferece uma API HTTP local estável e
  um fluxo de instalação/download de modelo (`ollama pull`) muito mais simples
  para um usuário não-programador, alinhado ao Princípio 2 (simplicidade).
  Nada impede um adapter alternativo depois, atrás da mesma interface, se
  surgir motivo concreto.
- **Roteamento automático (Claude para tarefas complexas, Ollama para
  simples):** fora de escopo agora — o Core Orchestrator ainda não tem lógica
  de roteamento por tipo de tarefa; a troca hoje é manual via
  `ELIAS_LLM_PROVIDER`. Fica como evolução natural quando o roteamento por
  agente for desenhado.
