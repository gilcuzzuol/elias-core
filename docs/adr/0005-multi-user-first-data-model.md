# ADR-0005: Modelo de dados multiusuário desde o início

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem alternativa razoável equivalente — ver justificativa de irreversibilidade abaixo)

## Contexto

Suporte a múltiplos usuários autorizados (o usuário principal, sua esposa, e futuros usuários) é um requisito permanente do projeto, mesmo que hoje exista apenas um usuário ativo. A alternativa óbvia — construir como single-user agora e adicionar multiusuário depois — foi avaliada e descartada por representar uma migração de alto risco (retrofitting de isolamento de dados em um sistema já populado com memórias e embeddings pessoais), exatamente o tipo de decisão difícil de reverter que vale mais a pena acertar de saída. Por não haver uma alternativa tecnicamente equivalente e razoável, esta decisão foi tomada autonomamente em vez de levada para consulta.

## Decisão

- Toda tabela em Supabase que armazena dado de usuário é modelada com uma coluna de escopo (`user_id`) desde a primeira migration, mesmo havendo um único usuário ativo hoje.
- **Row-Level Security (RLS)** é habilitada em todas essas tabelas desde o início, não adicionada depois.
- Autenticação via **Supabase Auth**.
- Dispositivos são explicitamente registrados e vinculados a um usuário autorizado numa tabela `authorized_devices` — um dispositivo não é confiado apenas por estar na rede (Tailscale) ou por IP; precisa estar associado a uma identidade autorizada.
- Memória (episódica, semântica, estruturada) é sempre escopada por usuário; não existe memória "global" compartilhada implicitamente entre usuários — compartilhamento explícito entre usuários (ex: informação familiar) é um recurso a desenhar deliberadamente mais adiante, não um efeito colateral da ausência de escopo.

## Consequências

**Positivas:**
- Zero custo de migração dolorosa quando um segundo usuário (esposa) for de fato ativado.
- Modelo de permissão de agentes e memória nasce isolado por usuário, reduzindo o risco de vazamento cruzado de dados pessoais dentro da própria família.
- Alinhado ao requisito permanente de segurança como prioridade.

**Negativas:**
- Overhead marginal de design: toda query e toda tabela precisa considerar `user_id` mesmo com um único usuário ativo hoje — custo aceito conscientemente por ser muito menor que o custo de uma migração retroativa.

## Alternativas consideradas

- **Modelar como single-user agora, migrar depois:** rejeitada. Retrofitting de RLS e isolamento de dados em um sistema já populado com memórias e embeddings pessoais é uma migração de alto risco (potencial vazamento de dados entre usuários durante a transição) e alto custo de engenharia — o oposto do que se busca em um sistema pensado para durar décadas.
