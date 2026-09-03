# Sistema Magia Festeira - Regras de Contexto do Projeto

Este arquivo define o contexto, as regras de arquitetura e os padrões de desenvolvimento exclusivos do **Sistema Magia Festeira**.

---

## 🎈 Visão Geral do Projeto
- **Nome:** Sistema Magia Festeira
- **Objetivo:** Plataforma de gestão para locação de decorações, temas de festas, catálogo visual, orçamentos, controle de disponibilidade de datas e clientes para a Magia Festeira.
- **Ambiente Isolado:** Este projeto é 100% independente do Kaldiris Financial OS. Não reutilize credenciais de banco nem regras financeiras específicas do outro app.

---

## 🛠️ Stack & Padrões Técnicos Recomendados
- **Frontend:** React (Vite) / Next.js + Tailwind CSS
- **Ícones & UI:** Lucide React, Radix UI / Shadcn UI ou Tailwind components
- **Design:** Mobile-First, visual atraente, profissional e acolhedor (adequado para catálogo de festas infantis e eventos temáticos)
- **Módulos Centrais Previstos:**
  1. **Catálogo de Temas:** Galeria de decorações e temas (ex: Tardezinha, Minha Primeira Volta ao Sol, Temas Infantis/Personagens).
  2. **Gestão de Eventos / Agenda:** Controle de datas, horários e locais de montagem/desmontagem.
  3. **Orçamentos & Contratos:** Geração rápida de propostas e controle de status (pendente, aprovado, entregue).
  4. **Acervo / Inventário:** Peças, painéis, mobília e itens decorativos disponíveis.

---

## 📋 Diretrizes de Código
- Manter componentes modulares e desacoplados em `src/components/`.
- Priorizar facilidade de uso para o cliente e para a equipe de montagem no dia a dia.
- Código limpo, com tipagem ou validações de formulário consistentes.
