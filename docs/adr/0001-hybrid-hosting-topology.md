# ADR-0001: Topologia de hospedagem híbrida

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Consulta ao usuário (impacto de custo recorrente + privacidade de dados)

## Contexto

O ELIAS precisa estar disponível para múltiplos usuários autorizados (o usuário principal e sua esposa, com espaço para futuros usuários) em múltiplos dispositivos (macOS, Android), com segurança e privacidade como prioridade explícita, e desenhado para operar e crescer por muitos anos.

Três topologias foram avaliadas para onde o Core Orchestrator roda:

1. **Mac local always-on** — custo zero, dados nunca saem de casa por padrão, mas o sistema fica indisponível se o Mac estiver desligado ou sem rede — inaceitável para um segundo usuário (esposa) que pode precisar acessar o ELIAS independentemente do estado do Mac do usuário principal.
2. **VPS pessoal na nuvem** — disponibilidade 24/7, mas todos os dados (incluindo os mais sensíveis) residem por padrão em infraestrutura de terceiros, o que conflita com "segurança como prioridade".
3. **Híbrido** — core leve na nuvem + worker local no Mac para dados sensíveis.

## Decisão

Adotar topologia **híbrida**:

- **Core na nuvem (VPS pessoal):** orquestração, roteamento de intenção, chamadas a LLMs, agendamento de tarefas, e dados não-sensíveis (metadados, configuração, fila de tarefas). Sempre disponível, é o ponto de entrada para qualquer dispositivo autorizado.
- **Worker local (Mac):** processa dados sensíveis — arquivos locais, embeddings de documentos pessoais, qualquer credencial ou conteúdo que a política de classificação de dados (ver ADR-0005 e a futura ADR de classificação de dados) marcar como "não sai da rede local". O worker se comunica com o core via túnel privado (Tailscale), nunca expondo portas publicamente.
- Tarefas que dependem do worker local ficam em fila; se o Mac estiver offline, a tarefa aguarda em vez de falhar silenciosamente ou ser processada na nuvem por padrão.

## Consequências

**Positivas:**
- Funcionalidades essenciais (chat, agendamento, consulta a integrações não-sensíveis) disponíveis 24/7 para qualquer usuário autorizado, em qualquer dispositivo.
- Dados classificados como sensíveis nunca saem da rede do usuário por padrão — alinhado ao requisito de segurança como prioridade.
- Caminho de evolução claro: se no futuro o worker local precisar de mais capacidade, pode virar um segundo nó na nuvem com política de dados equivalente, sem redesenhar o core.

**Negativas / custos assumidos:**
- Custo recorrente de VPS (~US$5–20/mês) — assumido conscientemente pelo usuário.
- Complexidade operacional maior que uma topologia única: dois ambientes, comunicação entre eles, necessidade de lidar com o worker local ficando offline (fila/retry).
- Depuração de problemas pode exigir correlacionar logs em dois ambientes distintos — mitigado por um log de auditoria centralizado (ver estratégia de segurança) que registra em qual ambiente cada ação ocorreu.

## Alternativas consideradas

- **Mac local always-on:** rejeitada como topologia única — incompatível com acesso confiável de um segundo usuário quando o Mac está desligado.
- **VPS puro:** rejeitada como topologia única — todos os dados pessoais residiriam permanentemente fora da rede do usuário, o que não é a melhor opção para um sistema que prioriza privacidade/segurança sobre conveniência operacional.
