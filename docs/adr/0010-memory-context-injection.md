# ADR-0010: Injeção de contexto de memória semântica nas chamadas ao LLM

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem impacto de custo/privacidade/irreversibilidade significativos — a memória recuperada já pertence ao próprio usuário da conversa e já seria enviada ao provedor de LLM externo pelo fluxo existente, ADR-0006)

## Contexto

O CLI (Fase 0) passou a ter memória de verdade plugada (Fase 1): memória
episódica (`conversations`/`messages`, migration 0003) e memória semântica
(`memory_chunks` via `MemoryStore.search`, ADR-0009). Faltava decidir *como*
o resultado de `MemoryStore.search` chega até a chamada ao `LLMProvider`, e
como isso se relaciona com o que fica persistido como histórico da conversa.

Duas perguntas concretas motivaram a decisão:

1. O contexto recuperado deve virar uma mensagem persistida (gravada em
   `messages`) ou é efêmero, existindo só para aquela chamada ao modelo?
2. Se a busca de memória ou a persistência de uma mensagem falhar (ex.:
   Supabase indisponível), a conversa deve parar ou seguir sem essa camada?

## Decisão

- A cada turno, `ChatSession.send` chama `MemoryStore.search` com a mensagem
  do usuário como query, filtrando por `user_id` (ADR-0005) e por um limiar
  mínimo de similaridade (`ELIAS_MEMORY_MIN_SIMILARITY`, padrão 0.5) e um
  número máximo de trechos (`ELIAS_MEMORY_MATCH_COUNT`, padrão 5).
- Os trechos retornados são formatados como **uma mensagem `system` efêmera**,
  montada só para aquela chamada ao `LLMProvider.complete`. Ela **não** entra
  no histórico em memória de trabalho (`ChatSession.messages`) nem é
  persistida em `messages` — é puramente retrieval augmentation daquele
  turno, reconstruível a qualquer momento a partir do próprio
  `memory_chunks` via nova busca.
- O histórico persistido (`conversations`/`messages`) grava exatamente o que
  o usuário digitou e o que o assistente respondeu — nada de metadado de
  retrieval misturado no transcript.
- Tanto a busca de contexto quanto a persistência do turno são
  **best-effort**: falha em qualquer uma delas loga um aviso (`console.warn`)
  e a conversa continua sem aquela camada, em vez de derrubar o turno. A
  resposta do LLM já existe e o usuário não deve perder a interação por uma
  falha secundária de infraestrutura de memória.

## Consequências

**Positivas:**
- Sem duplicação: o mesmo trecho não vive em dois lugares (`memory_chunks` e
  `messages`) com o risco de divergir se `memory_chunks` for reindexado/editado.
- Histórico de conversa limpo — útil se um dia virar insumo de resumo ou de
  nova ingestão em `memory_chunks` (fora do escopo desta ADR).
- Degradação graciosa: Supabase fora do ar, embedding falhando ou usuário sem
  memória ainda populada não impedem o chat de funcionar — só reduzem a
  qualidade das respostas.

**Negativas:**
- Sem registro de qual contexto foi de fato injetado em cada resposta
  passada — se for preciso auditar/depurar por que o modelo respondeu de um
  jeito, não há trilha persistida do contexto efêmero (mitigável depois com
  log estruturado, se a necessidade aparecer).
- Falha best-effort silenciosa (só `console.warn`) pode passar despercebida
  em uso interativo — aceitável na Fase 1 (CLI local, um usuário rodando e
  olhando o terminal); reavaliar nível de alerta quando houver superfícies
  sem operador humano observando em tempo real.

## Alternativas consideradas

- **Persistir o contexto injetado como mensagem no transcript:** rejeitada.
  Polui o histórico da conversa com dado derivado (já existe em
  `memory_chunks`), complica qualquer resumo futuro do transcript e infla o
  tamanho de `messages` sem necessidade.
- **Falhar o turno se a busca de memória falhar:** rejeitada. Memória
  semântica é um reforço, não uma dependência rígida do chat — travar a
  conversa por indisponibilidade de uma camada auxiliar contraria robustez e
  a experiência de um assistente pessoal que deve responder mesmo com
  infraestrutura parcialmente degradada.
- **Sempre injetar os top-K resultados, sem limiar de similaridade:**
  rejeitada. Com pouca memória ainda indexada, os top-K podem ser irrelevantes
  e só adicionam ruído ao prompt; o limiar mínimo configurável evita isso sem
  esconder a opção de zerá-lo depois, se a experiência mostrar que vale a pena.
