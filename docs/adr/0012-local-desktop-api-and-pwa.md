# ADR-0012: Servidor HTTP local + PWA instalável como interface de desktop

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (autônoma) — objetivo definido por Gil
(app de desktop no Mac, com ícone, rodando local e sem custo); as escolhas
técnicas (framework, protocolo, empacotamento, modelo de sessão) não têm
impacto de custo/privacidade além do já coberto pelos princípios existentes,
nem alternativas equivalentes que dependam de preferência pessoal.

## Contexto

Até aqui o ELIAS só era usável via `apps/cli` (terminal). Gil quer abrir o
ELIAS por um ícone na dock do Mac e conversar numa janela normal, sem
terminal, rodando 100% local e sem custo recorrente (Ollama, ADR-0011).

O projeto ainda está na Fase 1 (roadmap em
`docs/architecture/overview.md#8-roadmap`): o "core na nuvem" da ADR-0001
(topologia híbrida) e o PWA servido por ele para o cliente Android da
ADR-0007 ainda não existem — hoje tudo roda local, no Mac de Gil. Esta ADR
cobre a experiência de **desktop macOS local** desta fase, não a substituição
da ADR-0007: quando o core cloud existir, a mesma base de `apps/web` pode ser
reaproveitada e apontada para ele, como a própria ADR-0007 já previa
("mesma base de código web reaproveitada por qualquer dispositivo").

## Decisão

- **`apps/api` (`@elias/api`):** servidor HTTP local em Fastify, reaproveitando
  exatamente a mesma inicialização do CLI (`createLLMProvider`,
  `createMemoryLayer`, `createMemoryRetrievalConfig`) e a mesma classe
  `ChatSession` de `@elias/core` — nenhuma lógica de chat, LLM ou memória é
  duplicada. Bind fixo em `127.0.0.1` (nunca `0.0.0.0`), porta configurável via
  `ELIAS_API_PORT` (padrão `4787`). Endpoints: `POST /api/chat`,
  `GET /api/chat/history`, `GET /api/health`.
- **Uma única `ChatSession` por processo**, criada no boot do servidor —
  mesmo modelo do CLI (single-user local, ADR-0005). Reiniciar o servidor
  começa uma conversa nova; não há roteamento multi-sessão nesta fase, porque
  o uso é de um único usuário local por vez.
- **`apps/api` também serve os arquivos estáticos do PWA** (`apps/web/dist`)
  no mesmo processo e porta — sem CORS, sem configuração de URL no
  frontend, um único comando (`pnpm app`) sobe tudo.
- **`apps/web` (`@elias/web`):** PWA de chat (TypeScript vanilla + Vite, sem
  framework de UI — uma página só). `manifest.json` + service worker +
  ícones tornam o app instalável no Chrome/Safari, com ícone na dock do Mac.
  Não depende de `@elias/core` nem de nenhuma credencial: fala só HTTP com
  `apps/api` na mesma origem.
- **Sem camada de autenticação:** o bind é loopback-only; quem tem acesso ao
  Mac já tem acesso ao `.env` e ao Ollama locais — mesmo modelo de confiança
  que o CLI já tem hoje. Se `apps/api` algum dia passar a escutar além de
  `127.0.0.1` (ex.: acesso via Tailscale, como o worker local da ADR-0001),
  isso exige uma nova ADR, por ser mudança de superfície de exposição
  (critério de segurança/privacidade da convenção de ADRs).

## Consequências

**Positivas:**
- Gil ganha uma janela de chat de verdade, com ícone na dock, sem tocar
  terminal — sem reescrever nada da lógica de chat/memória/LLM já validada.
- `apps/cli` continua funcionando sem nenhuma alteração — os dois clientes
  coexistem atrás da mesma `ChatSession`.
- Base reaproveitável quando o core cloud (ADR-0001) e o PWA Android
  (ADR-0007) forem implementados: `apps/web` já nasce como PWA instalável
  falando um protocolo HTTP simples, só muda o servidor por trás.

**Negativas / limitações aceitas:**
- Histórico visível na janela não sobrevive a reiniciar o servidor (a
  memória episódica no Supabase continua sendo persistida por trás — só a
  sessão em memória do processo é que reinicia). Aceitável como MVP, mesmo
  comportamento que o CLI já tem hoje.
- Sem streaming de resposta — `LLMProvider.complete()` (ADR-0006) é
  request/response único; a resposta só aparece inteira ao final. Evolução
  futura exigiria estender a interface `LLMProvider`.
- Um usuário local por vez (uma `ChatSession` por processo); não serve
  múltiplos usuários simultâneos na mesma porta. Não é um problema hoje
  (single-user ativo), mas é uma limitação explícita desta decisão.

## Alternativas consideradas

- **Electron/Tauri (app nativo empacotado):** rejeitado por ora — mais peso
  de build/empacotamento e manutenção do que o valor entregue nesta fase, e
  contraria o espírito "PWA-first" já estabelecido na ADR-0007 (entrega
  rápida, reaproveitável). Nada impede revisitar se limitações de PWA
  (acesso a hardware, updates automáticos) virarem bloqueio real — mesmo
  critério de revisão já usado na ADR-0007 para o cliente Android nativo.
- **PWA falando diretamente com o Supabase do navegador (sem `apps/api`):**
  rejeitado — exigiria expor a chave `service_role` no navegador (quebra o
  Princípio 3 e a nota explícita em `packages/memory/src/client.ts`) ou
  montar um fluxo de autenticação de usuário só para uso local de uma única
  pessoa no próprio Mac, complexidade desproporcional ao problema.
- **Um processo por porta para API e para os estáticos do PWA (dev server
  separado):** rejeitado para o fluxo principal — adicionaria CORS,
  configuração de URL da API no frontend e um segundo comando para o
  usuário rodar. Mantido apenas como modo `dev` opcional (`vite`) para
  iteração de UI, com proxy para a API.
