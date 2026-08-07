# ADR-0007: Cliente Android — PWA primeiro

**Status:** Aceita
**Data:** 2026-08-07
**Decidida por:** Chief AI Architect (decisão de engenharia/esforço, sem impacto de custo/privacidade/irreversibilidade significativos — caminho de evolução para nativo permanece aberto)

## Contexto

O ELIAS precisa de um cliente Android para o S23 Ultra do usuário e outros dispositivos autorizados (ex: celular da esposa). O projeto é mantido por uma única pessoa, então o esforço de desenvolvimento do cliente mobile precisa ser proporcional ao valor entregue em cada fase do roadmap.

## Decisão

O primeiro cliente Android é uma **PWA (Progressive Web App)** instalável, servida pelo core (cloud, ver ADR-0001) e acessível também via Tailscale quando precisar de recursos que dependem do worker local. Um app nativo (provavelmente React Native, reaproveitando TypeScript — ver ADR-0002) só é construído na Fase 4+ do roadmap, e apenas se as limitações da PWA (notificações push robustas, acesso a sensores, integração profunda com o SO) se mostrarem um bloqueio real de uso.

## Consequências

**Positivas:**
- Entrega muito mais rápida, sem depender de publicação em loja de apps.
- Mesma base de código web reaproveitada por qualquer dispositivo/usuário autorizado.
- Não fecha a porta para um app nativo depois — é uma sequência deliberada, não uma escolha definitiva.

**Negativas:**
- Notificações push e acesso a hardware/sensores são mais limitados que um app nativo — aceitável para o escopo inicial (uso pessoal/familiar, não dependente de push crítico).

## Alternativas consideradas

- **React Native nativo desde o início:** melhor experiência final, mas atrasa a entrega de valor e adiciona superfície de manutenção antes de validar o que o ELIAS realmente precisa fazer no mobile — revisitado explicitamente no roadmap (Fase 4) em vez de descartado.
