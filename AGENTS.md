# Sistema Magia Festeira - Regras de Contexto & Memória do Projeto

Este arquivo define o contexto, a arquitetura e as regras obrigatórias de desenvolvimento do **Sistema Magia Festeira**.

---

## 🎈 Visão Geral & Fonte da Verdade
- **Nome:** Sistema Magia Festeira
- **Objetivo:** Plataforma de gestão para locação de decorações, temas de festas, catálogo visual, orçamentos, controle de disponibilidade de datas, acervo e Sofia (IA WhatsApp).
- **Fonte Única da Verdade (Manual Mestre):** `docs/MANUAL_SISTEMA_COMPLETO.md`. Contém toda a arquitetura, todas as rotas (17 páginas, 17 APIs), 27 componentes, modelo de banco (22 entidades), regras da Sofia e paleta oficial de cores.
- **Ambiente Isolado:** 100% independente do Kaldiris Financial OS.

---

## 🧠 Protocolo de Memória Contínua ("Zero-Amnésia")
Para combater a limitação da janela de contexto entre sessões ou conversas longas:
1. **Consulta Prévia Obrigatória (Pre-Flight):**
   - Antes de iniciar qualquer codificação, alteração de tela, criação de botão ou ajuste de regra de negócio, você DEVE consultar as seções relevantes de `docs/MANUAL_SISTEMA_COMPLETO.md`.
   - Respeite rigorosamente a paleta de cores (Rose Primário `#f43f5e`, Hover `#e11d48`, Dark Background `#090d16`, status semânticos: Emerald, Amber, Blue, Rose, Purple) e os padrões de botões, modais e drawers.
2. **Atualização Imediata Obrigatória (Post-Flight):**
   - Toda vez que uma rota for criada/alterada, um componente for modificado, uma nova regra de negócio for introduzida ou uma tabela for alterada, você DEVE atualizar `docs/MANUAL_SISTEMA_COMPLETO.md` na mesma resposta.
   - Execute `npm run docs:sync` para sincronizar o inventário estático em `docs/PROJECT_MAP.json`.

---

## 🛠️ Stack & Padrões Técnicos
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
- **UI:** Lucide React, Drawers laterais deslizantes, Modais de confirmação, Barras de ação flutuantes (`BatchActionBar`), Badges de status.
- **Banco de Dados:** PostgreSQL via Supabase com migrações em `supabase/migrations/` e camada reativa em `src/lib/store.ts`.
- **Automação & IA:** n8n + Meta WhatsApp Cloud API + Agente Sofia multimodal.
- **Design:** Mobile-First, visual profissional, acolhedor e com suporte completo a Dark Mode.
