# ADR-0003: Supabase como espinha dorsal de dados

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica; custo inicial é o free/starter tier do Supabase, não significativo)

## Contexto

O ELIAS precisa de: banco de dados estruturado, autenticação multiusuário, sincronização em tempo real entre dispositivos (Mac, Android de múltiplos usuários), armazenamento de arquivos, e um banco vetorial para memória semântica — sem fragmentar a operação em vários serviços desde o primeiro dia, dado que o projeto é mantido por uma pessoa.

Supabase já era um requisito explícito de integração do projeto.

## Decisão

Supabase é o **backbone de dados único** do ELIAS:

- **Auth:** identidade de todos os usuários autorizados, base do modelo multiusuário (ver ADR-0005).
- **Postgres:** todos os dados estruturados (fatos, preferências, entidades, configuração de agentes, log de auditoria).
- **pgvector (extensão do Postgres):** memória vetorial/semântica — embeddings de documentos, conversas e arquivos.
- **Realtime:** sincronização de estado entre dispositivos (Mac ↔ Android de cada usuário).
- **Storage:** arquivos que precisam ser acessíveis de qualquer dispositivo.

Um banco vetorial dedicado (Qdrant, Weaviate, etc.) **não** é adotado agora. Fica reservado como evolução futura (Fase 6 do roadmap), a ser avaliado apenas se `pgvector` demonstrar limitação real de performance/escala — o que é improvável no volume de uso pessoal/familiar nos próximos anos.

## Consequências

**Positivas:**
- Um único serviço para operar, proteger e fazer backup nas fases iniciais — reduz superfície de risco operacional para um projeto mantido solo.
- Row-Level Security nativa do Postgres resolve isolamento de dados multiusuário sem precisar de um componente de autorização separado.
- Menos superfícies de integração/autenticação a proteger (menos "coisas" com credenciais próprias).

**Negativas:**
- `pgvector` tem performance de busca vetorial inferior a bancos vetoriais dedicados em escala muito grande — aceitável na escala de uso pessoal/familiar prevista; monitorar em fases futuras.
- Lock-in relativo ao Supabase — mitigado por ser Postgres padrão por baixo (migração de dados estruturados e vetoriais para outra infraestrutura Postgres-compatível é viável se necessário).

## Alternativas consideradas

- **Banco vetorial dedicado desde o início:** complexidade operacional desnecessária na escala atual; adiado para quando houver evidência real de necessidade.
- **Firebase:** sem suporte robusto a SQL relacional/pgvector, pior encaixe para o modelo de memória estruturada + semântica que o ELIAS precisa.
