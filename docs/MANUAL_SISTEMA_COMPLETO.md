# 📖 MANUAL MESTRE DO SISTEMA MAGIA FESTEIRA
> **Documento Oficial de Referência Técnica, Arquitetural e Design System**  
> **Versão do Sistema:** 1.2.0 | **Data de Atualização:** 19/10/2026  
> **Regra Primordial de Memória:** Este documento é a **Fonte Única da Verdade** do projeto. Ele deve ser consultado obrigatoriamente antes de qualquer alteração de código e deve ser atualizado imediatamente após qualquer adição, edição ou remoção de funcionalidades.

---

## 1. 🎈 VISÃO GERAL DO PROJETO

O **Sistema Magia Festeira** é uma plataforma completa e integrada desenvolvida especificamente para a operação da empresa **Magia Festeira** (locação de decorações, temas de festas infantis e eventos). O sistema une catálogo visual público, gestão administrativa de acervo/itens, controle rigoroso de reservas de estoque com prevenção de conflitos, gestão de clientes, orçamentos, financeiro de locações e um agente autônomo de inteligência artificial (Sofia) conectado ao WhatsApp via n8n.

### Princípios Norteadores:
1. **Uma Única Fonte da Verdade:** PostgreSQL / Supabase como base central de dados operacionais.
2. **Mobile-First & Usabilidade Rápida:** Telas intuitivas, densas e rápidas tanto para a equipe de montagem no galpão quanto para o cliente no smartphone.
3. **Prevenção Inflexível de Conflitos:** Nenhum tema ou item pode ser reservado para duas festas simultâneas se o estoque disponível for insuficiente para cobrir o intervalo integral (retirada até devolução).
4. **Resiliência e Continuidade:** O front-end possui camada reativa (`store.ts`) com sincronização em tempo real e fallback local, operando com agilidade mesmo em variações de rede.

---

## 2. 🎨 IDENTIDADE VISUAL & DESIGN SYSTEM OFICIAL

Para garantir consistência absoluta na interface, todos os novos componentes, botões, modais e telas **devem** obedecer estritamente aos padrões definidos abaixo:

### 2.1 Paleta de Cores e Tokens
- **Cor Primária (Rose Magia):**
  - Base: `#f43f5e` (`rose-500` / `rose-600`)
  - Hover: `#e11d48` (`rose-700`)
  - Fundo Suave / Ativo: `bg-rose-50` (Light) | `bg-rose-950/40` (Dark)
  - Bordas Primárias: `border-rose-200` (Light) | `border-rose-800` (Dark)
- **Cores Neutras e Superfícies:**
  - Background Geral Light: `#f8fafc` (`bg-slate-50`)
  - Background Geral Dark: `#090d16` (customizado em `globals.css`)
  - Cards e Superfícies Light: `#ffffff` (`bg-white`)
  - Cards e Superfícies Dark: `#151e2e` (`--color-slate-850`) / `#243147` (`--color-slate-750`)
  - Bordas Neutras Light: `#e2e8f0` (`border-slate-200`)
  - Bordas Neutras Dark: `#1e293b` (`border-slate-800`)
  - Texto Principal: `text-slate-900` (Light) | `text-slate-100` (Dark)
  - Texto Secundário: `text-slate-500` (Light) | `text-slate-400` (Dark)
- **Cores Semânticas de Status:**
  - **Devolvido / Pago / Sucesso / WhatsApp:** `emerald` (`#10b981`, `emerald-600`, `bg-emerald-50`, `text-emerald-700`)
  - **Reservado / Pendente / Atenção:** `amber` (`#f59e0b`, `amber-500`, `bg-amber-50`, `text-amber-700`)
  - **Alugado / Em Andamento / Ativo:** `blue` (`#3b82f6`, `blue-600`, `bg-blue-50`, `text-blue-700`)
  - **Cancelado / Exclusão / Perigo:** `rose` (`#e11d48`, `rose-600`, `bg-rose-50`, `text-rose-700`)
  - **Histórico / Sofia IA / Automação:** `purple` (`#8b5cf6`, `purple-600`, `bg-purple-50`, `text-purple-700`)

### 2.2 Padrões de Botões e Interações
1. **Botão Primário de Ação (Adicionar, Salvar, Confirmar):**
   ```tsx
   className="h-10 px-4 rounded-xl font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
   ```
2. **Botão Secundário / Cancelar:**
   ```tsx
   className="h-10 px-4 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
   ```
3. **Botão Outline / Filtros / Exportação:**
   ```tsx
   className="h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer text-sm"
   ```
4. **Botão de WhatsApp Direto:**
   ```tsx
   className="h-10 px-4 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
   ```

### 2.3 Componentes Estruturais de UI
- **Gaveta Lateral de Edição (Drawer):** Desliza da direita para a esquerda (`fixed inset-y-0 right-0 w-full sm:max-w-xl z-50 bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800`). Utilizado para edição rápida de temas, itens, locações e clientes sem perder o scroll da listagem principal.
- **Gaveta de Contrato Inteligente (`RentalContractDrawer`):** Drawer lateral especializado para personalização de itens locados do acervo, cálculo dinâmico de sinal/saldo e geração de contrato no Google Drive com link editável e envio facilitado por WhatsApp.
- **Barra de Ações em Lote Flutuante (`BatchActionBar`):** Fixada no rodapé central da tela quando itens são selecionados por checkbox (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-4`). Permite exclusão múltipla, alteração de categoria ou aplicação de desconto em massa.
- **Badges de Status:** Pílulas compactas com cantos arredondados totais (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).
- **Logo Oficial:**
  - Modo Claro: `/logo/logo-dark.png`
  - Modo Escuro: `/logo/logo-light.png`
  - Alternância automática via `ThemeToggle` e classes Tailwind `block dark:hidden` / `hidden dark:block`.

---

## 3. 🛠️ ARQUITETURA TÉCNICA & STACK

- **Framework Web:** Next.js 16 (App Router) + React 19 + TypeScript.
- **Estilização:** Tailwind CSS v4 + PostCSS `@tailwindcss/postcss`.
- **Ícones:** `lucide-react`.
- **Manipulação de Datas:** `date-fns` v4 com formatação brasileira `formatDateBR` (`dd/MM/yyyy`).
- **Tratamento e Otimização de Imagens:**
  - Conversão de fotos de iPhone `.heic` no cliente (`heic2any`) e no servidor (`heic-convert` + `sharp`).
  - Otimização automática para `.webp` no upload.
  - Componente especializado `OptimizedImage.tsx` para evitar quebra de layout durante carregamento.
- **Banco de Dados Operacional:** Supabase (PostgreSQL 15+) com schemas e migrações em `supabase/migrations/`.
- **Motor Reativo de Dados:** `src/lib/store.ts` gerencia o estado operacional, cache e sincronização reativa com Supabase.
- **Orquestração e Agente WhatsApp:** n8n conectado à Meta WhatsApp Cloud API e IA Sofia multimodal.

---

## 4. 🗂️ MAPA COMPLETO DE ROTAS & TELAS

### 4.1 Painel Administrativo (`/admin`)

| Rota | Nome da Tela | Finalidade & Principais Componentes |
| :--- | :--- | :--- |
| `/admin` | Visão Geral / Dashboard | Indicadores operacionais (faturamento previsto, temas ativos, total de locações no mês, cards de alertas e atalhos rápidos). |
| `/admin/temas` | Temas, Itens e Estoque | Central do acervo. Contém 3 Abas: <br>• **Aba Temas:** Galeria/Grid com filtros, ordenação, busca, edição via Drawer, modal de orçamentos, catálogo personalizado e exclusão.<br>• **Aba Itens & Estoque:** Controle de peças avulsas (cilindros, painéis, bandejas) reutilizáveis entre temas.<br>• **Aba Histórico e Importações:** Histórico de lotes enviados por ZIP ou Google Drive. |
| `/admin/temas/[id]` | Detalhes do Tema | Página interna com galeria de fotos, itens vinculados, kits, variações e histórico de locações daquele tema específico. |
| `/admin/importacoes` | Central de Importações | Página dedicada para upload e processamento em lote de imagens de temas via ZIP ou Google Drive. |
| `/admin/itens` | Itens Avulsos | Listagem e gestão de estoque de peças avulsas com quantidades totais e reservadas. |
| `/admin/itens/[id]` | Detalhe do Item | Especificações de mobília, cores, dimensões e histórico de utilização. |
| `/admin/locacoes` | Gestão de Locações & Agenda | Controle de reservas de festas. Filtros por período (mês atual, próximos 60 dias, etc.), filtro financeiro (pendente, pago, histórico) e operacional. Modal de criação de locação com teste de disponibilidade anti-conflito e drawer de edição de pagamentos. |
| `/admin/clientes` | Gestão de Clientes | Cadastro completo de clientes, histórico de locações por cliente, importação e exportação de base em formato CSV/JSON. |
| `/admin/orcamentos` | Orçamentos Rápidos | Criação de propostas comerciais com seleção de temas, frete, desconto, valor de sinal e geração de texto para WhatsApp. |
| `/admin/relatorios` | Relatórios & Métricas | Métricas de conversão, temas mais alugados, faturamento mensal, ticket médio e exportador de relatórios contábeis. |
| `/admin/integracoes` | Conexões & APIs | Status da conexão com Supabase, webhooks de WhatsApp, endpoints n8n e saúde dos serviços. |
| `/admin/ia` | Central da IA Sofia | Monitoramento dos atendimentos realizados pelo bot, histórico de conversas do WhatsApp e decisões tomadas pelo modelo. |
| `/admin/usuarios` | Usuários & Perfis | Gestão de permissões de operadores e colaboradores (Administrador, Gerente, Operação, Catálogo, Somente Leitura). |
| `/admin/logs` | Logs de Auditoria | Registro completo de ações no sistema (quem alterou preço, quem excluiu tema, quem confirmou reserva). |

### 4.2 Catálogo Público do Cliente (`/catalogo`)

| Rota | Finalidade | Comportamento & Recursos |
| :--- | :--- | :--- |
| `/` | Landing / Redirecionamento | Rota raiz que redireciona automaticamente o visitante para `/catalogo`. |
| `/catalogo` | Catálogo Geral de Temas | Vitrine responsiva e acolhedora com busca em tempo real, filtro por categorias (ex: Aniversário Menino, Menina, Batizado, Chá Revelação), visualização em cards com foto principal, badges e link direto para WhatsApp com mensagem personalizada. |
| `/catalogo/[slug]` | Página do Tema | Exibe carrossel de fotos em alta qualidade, lista de itens inclusos (ex: arco de ferro, cilindros, boleiras), opções de kits e botão fixo de solicitação de reserva no WhatsApp com o nome do tema injetado. |

---

## 5. 🔌 MAPA DE APIS & ENDPOINTS DO BACKEND

Todas as rotas de API residem em `src/app/api/...` e possuem validação estrita:

1. `GET /api/v1/availability?themeId=...&pickupDate=...&returnDate=...`
   - Checa se o tema ou item possui unidades de estoque desimpedidas no intervalo de datas solicitado.
2. `GET / POST /api/v1/themes`
   - Listagem com filtros e cadastro de novos temas de decoração.
3. `GET / POST /api/v1/rentals`
   - Listagem e criação de locações com verificação de bloqueio anti-colisão.
4. `GET / PATCH / DELETE /api/v1/rentals/[id]`
   - Leitura detalhada, atualização de status e exclusão de locações.
5. `POST /api/v1/rentals/[id]/payments`
   - Registro de pagamentos parciais (sinal) ou liquidação total de locação.
6. `GET / POST /api/v1/customers`
   - Consulta e cadastro de clientes por telefone/documento.
7. `GET /api/v1/customers/by-phone?phone=...`
   - Localização rápida do cliente pelo número de WhatsApp (usado pela Sofia).
8. `POST /api/v1/orcamentos`
   - Geração de propostas comerciais de locação.
9. `POST /api/v1/webhook/whatsapp`
   - Recebe payloads de mensagens recebidas pela Meta API / n8n para acionar o fluxo da IA Sofia.
10. `POST /api/convert-heic` & `POST /api/convert-image`
    - Converte formatos HEIC de smartphones Apple para JPEG/WebP otimizado.
11. `POST /api/upload`
    - Upload direto de mídia para o Supabase Storage com geração de URLs públicas permanentes.
12. `GET /api/db/status`
    - Checagem de integridade e latência do PostgreSQL.
13. `POST /api/v1/rentals/[id]/contract`
    - Gera ou atualiza o contrato no Google Docs (modelo oficial blindado) e agenda no Google Calendar oficial. Permite personalização de peças do acervo, acréscimos/descontos e devolução pelo Drawer `RentalContractDrawer.tsx`.

---

## 6. 🗄️ MODELO DE DADOS & BANCO (22 ENTIDADES)

O schema relacional está estruturado no PostgreSQL do Supabase:
1. `tenants`: Multi-inquilino (preparado para escala SaaS, sendo a Magia Festeira o tenant principal).
2. `roles`: Perfis de acesso (`Administrador`, `Gerente`, `Operação`, `Catálogo`, `Somente Leitura`).
3. `permissions`: Chaves granulares de permissão de sistema.
4. `role_permissions`: Tabela associativa entre papéis e permissões.
5. `users`: Usuários autenticados do painel administrativo.
6. `categories`: Categorias de temas (ex: Meninas, Meninos, 1º Aninho, Chás, Adulto).
7. `themes`: Tema de decoração (código único ex: `MF-0127`, nome, slug, preço base, preço promocional, descrição padrão, estoque total).
8. `theme_variants`: Variações de cor ou estilo de um mesmo tema.
9. `kits`: Kits fechados montados para locação (Pegue e Monte, Kit Luxo, Mini Table).
10. `kit_items`: Peças e componentes associados a cada kit.
11. `items`: Peças avulsas do acervo com estoque físico próprio.
12. `stock_units`: Unidades físicas individuais rastreáveis com número de patrimônio/código de barras.
13. `theme_items`: Associação de itens avulsos que compõem o tema padrão.
14. `media`: Fotos e vídeos de temas e itens no Supabase Storage.
15. `customers`: Clientes (nome, telefone WhatsApp normalizado com DDI/DDD, CPF, endereço).
16. `rentals`: Locações (código `LOC-YYYY-XXXX`, cliente, data de retirada, data do evento, data de devolução, status, valor total, desconto, frete, status de pagamento).
17. `rental_lines`: Linha de itens alugados em uma locação (quantidade e valores unitários).
18. `payments`: Histórico de pagamentos recebidos (valor, método: Pix, Cartão, Dinheiro, comprovante).
19. `calendar_sync`: Espelho de sincronização com o Google Calendar.
20. `imports`: Lotes de importação de fotos em massa (ZIP ou Google Drive).
21. `import_assets`: Arquivos individuais processados dentro de cada lote de importação.
22. `ai_runs` & `audit_logs`: Registro de execuções das ferramentas de inteligência artificial e trilha de auditoria.

---

## 7. 🤖 REGRAS DE NEGÓCIO DA IA SOFIA & N8N

- **WhatsApp Oficial Configurado:** `+55 11 97782-3876` (função utilitária `src/lib/whatsapp.ts`).
- **Debouncer Anti-Burst:** Quando o cliente manda 3 ou mais mensagens em sequência no WhatsApp, o n8n agrupa todas as mensagens em um bloco único de até 15 segundos antes de disparar o modelo de IA, evitando respostas fragmentadas ou repetidas.
- **Tratamento de Lead Duplicado:** O sistema sempre verifica a existência do telefone antes de cadastrar novo cliente, mantendo o histórico de locações anteriores associado ao mesmo contato.
- **Regra de Consulta de Disponibilidade:**
  - A Sofia nunca confirma uma data sem antes executar a tool interna `consultar_disponibilidade`.
  - A indisponibilidade de um tema aciona sugestões de temas similares da mesma categoria.

---

## 8. 🔄 PROTOCOLO PERMANENTE "ZERO-AMNÉSIA"

Para eliminar completamente o esquecimento em futuras sessões de desenvolvimento:

1. **Consulta Obrigatória (Pre-Flight):**  
   Antes de propor, refatorar ou implementar qualquer alteração, o assistente **deve consultar as seções relevantes deste manual** (`docs/MANUAL_SISTEMA_COMPLETO.md`) para extrair a paleta exata de cores, as rotas existentes, as convenções de botões e os schemas de banco.
2. **Atualização Imediata (Post-Flight):**  
   Ao finalizar qualquer tarefa que altere rotas, componentes, botões, regras de negócio ou tabelas, o assistente **deve atualizar este documento no mesmo turno**, registrando a alteração.
3. **Auditoria via Script:**  
   O comando `npm run docs:sync` executa a checagem automática e atualiza o inventário estático do sistema em `docs/PROJECT_MAP.json`.
