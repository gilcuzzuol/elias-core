# ADR-0002: TypeScript como runtime principal

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem impacto de custo/privacidade/irreversibilidade significativos)

## Contexto

O ELIAS é composto por várias camadas de aplicação (Core Orchestrator, CLI macOS, API, conectores MCP, futuro cliente mobile) que precisam compartilhar tipos e contratos de dados, e ser mantidas por uma única pessoa ao longo de muitos anos. É preciso escolher a linguagem/runtime principal do sistema.

## Decisão

**TypeScript sobre Node.js** é o runtime principal de todas as camadas de aplicação: Core Orchestrator, API, CLI, conectores MCP e (via React Native, ver ADR-0007) o futuro cliente mobile nativo, se necessário.

Python pode ser usado pontualmente para pipelines de dados/ML pesados no futuro (ex: treinamento ou fine-tuning local), mas sempre isolado como serviço/processo separado, nunca misturado ao core.

## Consequências

**Positivas:**
- Tipos e contratos de dados compartilhados entre todas as camadas via monorepo, reduzindo bugs de integração.
- SDKs oficiais de primeira classe em TypeScript para Anthropic (Claude), OpenAI e MCP.
- Mesma linguagem cobre backend, CLI e (via React Native) mobile, reduzindo a superfície de conhecimento necessária para manter o projeto sozinho por anos.
- Ecossistema maduro para tudo que não é ML pesado: filas, servidores HTTP, clientes OAuth, etc.

**Negativas:**
- Ecossistema de ML/embeddings historicamente mais maduro em Python — mitigado porque a estratégia de memória (ADR-0003) usa serviços gerenciados (Supabase/pgvector) e SDKs oficiais que já cobrem geração de embeddings em TypeScript, sem exigir treinamento de modelos.

## Alternativas consideradas

- **Python:** ecossistema forte em ML, mas fragmentaria a stack entre camadas de aplicação/infra (que se beneficiam mais de TS) e a eventual camada de ML — pior para manutenção solo de longo prazo.
- **Go:** excelente performance e concorrência, mas ecossistema de SDKs de LLM/MCP menos maduro em 2026, curva de manutenção maior para um projeto mantido por uma pessoa.
