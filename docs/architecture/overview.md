# ELIAS — Visão Geral da Arquitetura

**Versão:** 1.0
**Última atualização:** 2026-08-07

## Princípio norteador

ELIAS não é "um app que chama LLMs". É um sistema operacional pessoal (e familiar) de conhecimento e ação, projetado para operar e evoluir por muitos anos. LLMs (Claude, ChatGPT, futuros) são motores de raciocínio plugáveis; memória, integrações e agentes são infraestrutura própria e duradoura. Dados pessoais são o ativo mais valioso e mais sensível do sistema — segurança e privacidade são prioridade, não característica opcional.

Requisitos permanentes que moldam toda decisão:

- Integração com macOS, Android e Google Drive, GitHub, Supabase.
- **Os dispositivos pessoais do usuário (Mac, Android, e futuros dispositivos autorizados) são parte da arquitetura**, não clientes externos genéricos — toda decisão de acesso, segurança e sincronização deve considerá-los explicitamente.
- **Google Drive é fonte oficial de documentos do projeto**, não apenas mais um conector de leitura.
- **Extensibilidade contínua de conectores sem alterar a arquitetura principal**: além dos já previstos, candidatos futuros incluem Google Workspace, Microsoft 365, WhatsApp, Telegram, Email e outros serviços de nuvem/armazenamento/comunicação ainda não definidos (ver [ADR-0004](../adr/0004-mcp-as-connector-standard.md)).
- Suporte a múltiplos usuários autorizados, arquitetura modular, segurança como prioridade, e horizonte de expansão contínua por muitos anos — evitando qualquer solução que dificulte expansões futuras, mesmo que custe mais tempo de desenvolvimento agora.

### Princípios de decisão

Os princípios inegociáveis do projeto estão consolidados em [`docs/PROJECT_PRINCIPLES.md`](../PROJECT_PRINCIPLES.md). Os critérios operacionais abaixo derivam deles:

- Toda decisão arquitetural relevante é registrada em ADR, incluindo as alternativas descartadas e o motivo da escolha — nunca só a decisão final.
- Quando existe uma solução consolidada pela indústria, ela é preferida a reinventar uma solução própria; desvios exigem justificativa técnica explícita no ADR correspondente.
- A prioridade é um sistema robusto, elegante e sustentável a longo prazo — não velocidade de desenvolvimento no curto prazo.

## 1. Arquitetura geral

```
                    ┌─────────────────────────────────────┐
                    │   Interfaces (por usuário/dispositivo)│
                    │   CLI macOS  ·  PWA Android           │
                    └───────────────────┬────────────────────┘
                                         │  (HTTPS via Tailscale)
                    ┌───────────────────▼────────────────────┐
                    │   CORE ORCHESTRATOR (nuvem — VPS)        │
                    │   - Auth multiusuário (Supabase Auth)    │
                    │   - Router: intenção → agente            │
                    │   - Router: agente → provedor de LLM      │
                    │   - Gerenciamento de sessão/contexto       │
                    │   - Fila de tarefas (inclui as que          │
                    │     dependem do worker local)                │
                    └───┬──────────────┬──────────────┬────────┘
                        │              │              │
              ┌─────────▼───┐  ┌───────▼──────┐  ┌────▼────────────┐
              │ Agent Layer  │  │ Memory Layer │  │ Connector Layer  │
              │ (skills/     │  │ (Supabase:   │  │ (servidores MCP) │
              │ playbooks)   │  │ Postgres +   │  │ GitHub · Drive ·  │
              │              │  │ pgvector)    │  │ Supabase · futuras │
              └──────────────┘  └──────────────┘  └──────────────────┘

                    ┌───────────────────────────────────────┐
                    │  WORKER LOCAL (Mac do usuário)          │
                    │  - Processa dados classificados como     │
                    │    sensíveis (arquivos locais, embeddings │
                    │    de conteúdo pessoal)                    │
                    │  - Nunca expõe porta pública; conecta-se    │
                    │    ao core via túnel privado (Tailscale)     │
                    └───────────────────────────────────────────┘
```

Decisões fundacionais (ver ADRs para racional completo):

- **Topologia híbrida de hospedagem** — core leve na nuvem, worker de dados sensíveis no Mac. → [ADR-0001](../adr/0001-hybrid-hosting-topology.md)
- **TypeScript como runtime principal** em todas as camadas de aplicação. → [ADR-0002](../adr/0002-typescript-as-primary-runtime.md)
- **Supabase como backbone único de dados** (Postgres + pgvector + Auth + Realtime + Storage). → [ADR-0003](../adr/0003-supabase-as-data-backbone.md)
- **MCP como padrão de conector** para toda integração externa. → [ADR-0004](../adr/0004-mcp-as-connector-standard.md)
- **Modelo de dados multiusuário desde o início**, com RLS em toda tabela. → [ADR-0005](../adr/0005-multi-user-first-data-model.md)
- **Abstração plugável de provedores de LLM** (Claude, ChatGPT, futuros). → [ADR-0006](../adr/0006-pluggable-llm-provider-abstraction.md)
- **Cliente Android via PWA** na primeira fase, nativo avaliado depois. → [ADR-0007](../adr/0007-android-client-pwa-first.md)

## 2. Estrutura de diretórios (alvo, a ser escafoldada quando iniciarmos a implementação)

```
elias-core/
├── apps/
│   ├── cli/                  # interface de linha de comando (macOS)
│   ├── mobile/                # PWA Android
│   ├── api/                    # Core Orchestrator (deploy: nuvem)
│   └── worker/                  # Worker local de dados sensíveis (deploy: Mac)
├── packages/
│   ├── core/                     # orquestrador, roteamento, sessão
│   ├── llm/                       # LLMProvider + adapters (claude, openai)
│   ├── memory/                     # ingestão, embeddings, retrieval, consolidação
│   ├── agents/                      # definições declarativas de agentes/skills
│   ├── connectors/                   # um servidor MCP por integração
│   │   ├── github/
│   │   ├── gdrive/
│   │   ├── filesystem/
│   │   └── supabase/
│   ├── security/                      # auth, cofre de segredos, audit log
│   └── shared/                         # tipos, utils comuns
├── infra/
│   ├── supabase/                        # migrations, schema, RLS policies
│   ├── vps/                               # config de deploy do core na nuvem
│   └── scripts/                            # deploy, backup, setup
├── docs/
│   ├── architecture/                        # este documento
│   ├── adr/                                  # Architecture Decision Records
│   ├── security/
│   ├── agents/
│   └── integrations/
└── .env.example
```

## 3. Tecnologias

| Camada | Escolha | ADR |
|---|---|---|
| Runtime principal | TypeScript / Node.js | [0002](../adr/0002-typescript-as-primary-runtime.md) |
| Dados (estruturado + vetorial + auth + realtime + storage) | Supabase | [0003](../adr/0003-supabase-as-data-backbone.md) |
| Conectores | Servidores MCP | [0004](../adr/0004-mcp-as-connector-standard.md) |
| LLMs | Claude (Anthropic SDK) + ChatGPT (OpenAI SDK), atrás de `LLMProvider` | [0006](../adr/0006-pluggable-llm-provider-abstraction.md) |
| Hospedagem do core | VPS pessoal | [0001](../adr/0001-hybrid-hosting-topology.md) |
| Processamento de dados sensíveis | Worker local no Mac | [0001](../adr/0001-hybrid-hosting-topology.md) |
| Rede entre core, worker e dispositivos | Tailscale (VPN privada) | [0001](../adr/0001-hybrid-hosting-topology.md) |
| Cliente Android | PWA | [0007](../adr/0007-android-client-pwa-first.md) |
| Segredos | macOS Keychain (worker local) + Supabase Vault (core) | — |

## 4. Estratégia de memória

Modelo em camadas:

1. **Memória de trabalho** — contexto da sessão atual.
2. **Memória episódica** — interações recentes (tabela Postgres), resumidas periodicamente.
3. **Memória semântica (vetorial)** — embeddings via `pgvector`, recuperação híbrida (vetorial + keyword/RAG).
4. **Memória estruturada/explícita** — fatos, preferências, entidades em tabelas relacionais.
5. **Memória procedural** — skills/playbooks de agentes, versionados como configuração.

Toda memória é escopada por `user_id` desde o início ([ADR-0005](../adr/0005-multi-user-first-data-model.md)). Pipeline: ingestão → chunking → embedding → storage → retrieval híbrido → consolidação periódica → política de esquecimento (TTL/importância).

Classificação de dados por sensibilidade determina onde o processamento acontece (worker local vs. core na nuvem) e quais dados podem ser enviados a um provedor de LLM externo — política a detalhar em `docs/security/data-classification.md` antes da Fase 1.

## 5. Estratégia de agentes

- Um agente orquestrador raiz roteia para sub-agentes especializados (pesquisa, código, organização de arquivos, agenda, comunicação).
- Cada agente é uma definição declarativa (nome, descrição, ferramentas/conectores permitidos, provedor de LLM preferido, prompt de sistema), versionada em `packages/agents/`.
- Escopo mínimo de permissão por agente (menor privilégio) e por usuário (um agente executando para o usuário A nunca acessa dados do usuário B).
- Níveis de autonomia explícitos: (1) só leitura/sugestão, (2) executa com confirmação humana, (3) totalmente autônomo — reservado a ações reversíveis e de baixo risco. Ações destrutivas/irreversíveis sempre exigem checkpoint humano, independentemente do nível configurado.

## 6. Estratégia de integrações

- Cada integração é um servidor MCP isolado, com OAuth/credenciais e rate limiting próprios ([ADR-0004](../adr/0004-mcp-as-connector-standard.md)).
- Sync inicial via polling (cron); migração para webhooks (GitHub, push notifications do Drive) conforme volume/latência justificar.
- Google Drive é tratado como fonte oficial de documentos do projeto — conteúdo ingerido de lá tem a mesma prioridade/confiança que arquivos locais na estratégia de memória, não é tratado como fonte externa secundária.
- Novos serviços de nuvem/comunicação futuros (Google Workspace, Microsoft 365, WhatsApp, Telegram, Email, e outros ainda não definidos) entram como novo servidor MCP, sem alterar core, agentes ou outros conectores.

## 7. Estratégia de segurança

- Segredos nunca no repositório: Keychain local (worker) + Supabase Vault (core).
- Supabase Auth + RLS em toda tabela, desde o início ([ADR-0005](../adr/0005-multi-user-first-data-model.md)).
- Dispositivos explicitamente registrados e vinculados a um usuário autorizado (`authorized_devices`), não confiados apenas por estarem na rede Tailscale.
- Log de auditoria imutável para toda ação de agente, especialmente escrita/destrutiva, correlacionando ambiente (core/worker), usuário e dispositivo de origem.
- Classificação de dados por sensibilidade, determinando onde processar e o que pode ir a LLMs externos.
- Rede privada (Tailscale) entre core, worker e todos os dispositivos — nada exposto publicamente por padrão.
- Backup criptografado e automatizado do Supabase.
- Defesa contra prompt injection em conteúdo ingerido de fontes externas (email, documentos, web) para agentes com permissão de escrita.
- Kill switch global para revogar instantaneamente todas as permissões de todos os agentes.

## 8. Roadmap

| Fase | Escopo |
|---|---|
| 0 — Fundação | Scaffold do monorepo, provisionamento do VPS e do worker local, setup Supabase (com RLS desde a primeira migration), cofre de segredos, Core Orchestrator mínimo com Claude, CLI de chat no macOS |
| 1 — Memória MVP | `pgvector`, ingestão de arquivos locais via worker, RAG básico, tabelas de fatos/preferências, política de classificação de dados documentada |
| 2 — Primeiras integrações | Conectores MCP: GitHub (leitura + escrita limitada), filesystem, Google Drive (leitura) |
| 3 — Multi-LLM + agentes | Adapter ChatGPT, 2-3 agentes especializados, níveis de autonomia, audit log |
| 4 — Mobile/multiusuário real | PWA Android, ativação da esposa como segundo usuário autorizado, avaliação de app nativo |
| 5 — Autonomia & agendamento | Jobs em background, triggers por webhook, comportamentos proativos |
| 6 — Hardening & escala | Revisão de segurança, DR, observabilidade, reavaliação de banco vetorial dedicado |

## 9. Documentação necessária

- `docs/architecture/overview.md` — este documento
- `docs/adr/` — Architecture Decision Records, uma por decisão importante
- `docs/security/` — modelo de ameaças, política de classificação de dados, runbook de segredos (a escrever antes da Fase 1)
- `docs/agents/` — catálogo de agentes e seus escopos de permissão (a escrever na Fase 3)
- `docs/integrations/` — guia de setup por conector (a escrever conforme cada conector é implementado)
- Runbooks de incidente, backup/restore, rotação de chaves (a escrever antes da Fase 0 ir a produção)
