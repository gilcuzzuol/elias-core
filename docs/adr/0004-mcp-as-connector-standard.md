# ADR-0004: MCP como padrão de conector

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão técnica sem impacto de custo/privacidade/irreversibilidade significativos — conectores são isolados e substituíveis por natureza)

## Contexto

O ELIAS precisa integrar um número crescente de serviços ao longo de muitos anos — GitHub, Google Drive, Supabase, e APIs futuras ainda desconhecidas hoje. É preciso um padrão de integração que mantenha o Core Orchestrator desacoplado de cada API específica, para que adicionar uma integração nova nunca exija alterar o núcleo do sistema.

## Decisão

Toda integração externa é implementada como um **servidor MCP (Model Context Protocol)** independente, com seu próprio escopo de credenciais e permissões. O Core Orchestrator consome MCP como client, e cada agente recebe acesso apenas aos servidores MCP relevantes ao seu escopo (princípio do menor privilégio).

Quando já existir um servidor MCP maduro e mantido publicamente para um serviço (ex: GitHub), ele é adotado/adaptado em vez de reescrito do zero. Servidores MCP custom são escritos apenas para integrações sem opção madura disponível.

## Consequências

**Positivas:**
- Extensibilidade real: nova integração = novo servidor MCP, sem tocar no Core Orchestrator nem nos agentes existentes.
- Compatibilidade nativa com Claude, que consome MCP diretamente.
- Reaproveitamento de um ecossistema crescente de servidores MCP open-source, reduzindo trabalho de manutenção própria.
- Isolamento natural de falhas e permissões: um servidor MCP comprometido ou com bug não tem acesso automático a outros conectores.

**Negativas:**
- MCP é um protocolo relativamente novo (2024+) e pode evoluir de forma incompatível entre versões — mitigado por versionar e isolar cada conector em seu próprio processo, permitindo atualizar um de cada vez.

## Alternativas consideradas

- **Chamadas diretas de API por conector, sem padronização:** mais simples no curto prazo, mas gera acoplamento crescente e duplicação de lógica de autenticação/retry/rate-limiting conforme o número de integrações cresce — inadequado para um sistema pensado para expandir continuamente por décadas.
