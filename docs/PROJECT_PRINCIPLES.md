# ELIAS — Princípios do Projeto

**Versão:** 1.0
**Última atualização:** 2026-08-07

Estes são os princípios inegociáveis que governam toda decisão técnica do ELIAS. Quando houver conflito entre conveniência imediata e um destes princípios, o princípio prevalece. Cada decisão arquitetural relevante deve poder ser justificada por um ou mais deles, e é registrada em [ADR](adr/README.md).

## 1. Manutenibilidade a longo prazo acima de velocidade no curto prazo

O ELIAS é projetado para operar e evoluir por muitos anos. Evitamos qualquer atalho que dificulte expansões futuras, mesmo que custe mais tempo de desenvolvimento agora.

## 2. Simplicidade acima de complexidade desnecessária

A solução mais simples que atende ao requisito é preferida. Complexidade só é adicionada quando há justificativa técnica explícita — nunca por antecipação especulativa.

## 3. Segurança por padrão

Dados pessoais são o ativo mais valioso e mais sensível do sistema. Segurança e privacidade são prioridade, não característica opcional: nada exposto publicamente por padrão, menor privilégio sempre, segredos nunca no repositório (ver [Estratégia de segurança](architecture/overview.md#7-estrat%C3%A9gia-de-seguran%C3%A7a)).

## 4. Local-first sempre que tecnicamente viável

Dados classificados como sensíveis são processados no worker local (Mac do usuário), não na nuvem. A nuvem hospeda apenas o núcleo leve de orquestração ([ADR-0001](adr/0001-hybrid-hosting-topology.md)).

## 5. O humano é responsável pelos objetivos; a IA é responsável pela arquitetura

O usuário define o que o sistema deve alcançar e mantém controle sobre metas e ações irreversíveis. O Chief AI Architect (Claude) é responsável pelas decisões arquiteturais, levadas à consulta humana apenas quando há impacto significativo de custo, privacidade/segurança, irreversibilidade relevante, ou preferência pessoal entre alternativas equivalentes.

## 6. Toda decisão arquitetural importante tem uma ADR

Nenhuma decisão relevante é tomada implicitamente. Cada uma é registrada em ADR com contexto, decisão, consequências e alternativas descartadas — nunca só a decisão final ([convenção de ADR](adr/README.md#conven%C3%A7%C3%A3o)).

## 7. Padrões consolidados da indústria acima de soluções próprias

Quando existe uma solução madura e adotada pela indústria, ela é preferida a reinventar algo interno. Desvios exigem justificativa técnica explícita no ADR correspondente.

## 8. A arquitetura deve permanecer modular e substituível

Cada camada (orquestração, memória, conectores, provedores de LLM, interfaces) é isolada por trás de contratos claros, de modo que qualquer parte possa ser trocada sem reescrever as demais.

## 9. Modelos de IA futuros devem ser substituíveis sem reescrever o sistema

LLMs são motores de raciocínio plugáveis. Claude, ChatGPT e modelos futuros ficam atrás da abstração `LLMProvider` ([ADR-0006](adr/0006-pluggable-llm-provider-abstraction.md)); memória, integrações e agentes são infraestrutura própria e duradoura, independente de qualquer provedor.

## 10. Cada componente tem uma única responsabilidade clara

Um módulo, um propósito. Conectores são um servidor MCP por integração; agentes têm escopo mínimo e definido; nenhuma camada acumula responsabilidades de outra.

---

Estes princípios se refletem na [Visão Geral da Arquitetura](architecture/overview.md) e são a base dos critérios de decisão descritos lá. Alterá-los é, em si, uma decisão arquitetural — e portanto exige uma ADR.
