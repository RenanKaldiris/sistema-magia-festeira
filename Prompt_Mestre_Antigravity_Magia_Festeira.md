# PROMPT MESTRE - ANTIGRAVITY
## Sistema Magia Festeira: Catálogo + Inventário + Agenda + IA

Você é o principal agente de engenharia deste projeto. Construa, teste e entregue um sistema web profissional para a operação da Magia Festeira, usando o repositório atual como fonte de verdade do código.

IMPORTANTE: não apenas gere telas. Implemente uma aplicação funcional, com banco, autenticação, regras de estoque, importação, integrações, agente de IA, catálogo público e testes.

---

## 1. OBJETIVO DO PRODUTO

Criar um sistema único em que:

- o acervo de temas da Magia Festeira seja catalogado;
- cada tema possa ter várias fotos, uma foto principal, variações e kits;
- itens avulsos tenham estoque próprio e possam ser reutilizados entre temas;
- humanos possam cadastrar e editar tudo pelo dashboard;
- fotos possam ser importadas em lote por pasta local;
- uma pasta do Google Drive possa ser importada por link;
- um agente de IA possa receber fotos, múltiplas fotos, textos e links de Google Drive pelo WhatsApp;
- a IA identifique o tema/variação e use ferramentas para cadastrar ou atualizar o banco;
- ambiguidades importantes gerem perguntas de confirmação;
- o sistema controle reservas, retirada, devolução, pagamentos, saldo e status;
- o estoque impeça conflitos;
- a agenda seja visualizada em mês, semana e dia;
- reservas sejam sincronizadas com Google Calendar;
- exista um catálogo público, visual e responsivo, com busca, filtros, página de tema e botão direto para WhatsApp;
- existam usuários e permissões para funcionários;
- existam indicadores e exportação de relatórios;
- a arquitetura nasça preparada para futuro SaaS multiempresa.

---

## 2. STACK PREFERENCIAL

Use, salvo incompatibilidade real já existente no repositório:

- Frontend: Next.js + TypeScript.
- UI: componentes acessíveis, design system consistente, layout responsivo e minimalista/profissional.
- Backend: Supabase/PostgreSQL.
- Auth: Supabase Auth.
- Imagens: Supabase Storage.
- Automação: n8n.
- WhatsApp: Meta WhatsApp Business Cloud API.
- Google Drive: Google Drive API.
- Google Calendar: Google Calendar API.
- IA multimodal: escolher um modelo atual com visão e tool/function calling. O projeto deve desacoplar o provedor do domínio para permitir trocar entre Google Gemini/OpenAI/outro sem reescrever regras de negócio.
- Desenvolvimento: Antigravity deve usar editor, terminal, browser e os recursos de verificação disponíveis.

Não crie uma segunda fonte de verdade em outro PostgreSQL. O Supabase/Postgres será o banco operacional principal.

---

## 3. REGRA ARQUITETURAL CENTRAL

O sistema deve ter UMA fonte de verdade:

Supabase/PostgreSQL.

Google Calendar é uma integração/espelho da agenda.
Google Drive é uma origem de importação.
WhatsApp é canal de entrada/saída.
n8n é orquestração.
LLM é inteligência, não banco.

Nunca use Google Calendar como fonte definitiva de disponibilidade de estoque.

Nunca use o n8n como banco principal de estoque.

Nunca permita que o LLM execute SQL arbitrário.

O agente de IA deve chamar ferramentas/serviços internos explícitos, com schemas validados.

---

## 4. MODELO DE DOMÍNIO

Crie pelo menos estas entidades:

- tenants
- users
- roles
- permissions
- categories
- themes
- theme_variants
- kits
- kit_items
- items
- stock_units
- theme_items
- media
- customers
- rentals
- rental_lines
- payments
- calendar_sync
- imports
- import_assets
- ai_runs
- audit_logs

Toda entidade de negócio deve ser preparada para multi-tenancy com tenant_id, mesmo que exista apenas a Magia Festeira inicialmente.

### Tema
Campos mínimos:
- id
- tenant_id
- internal_code
- name
- category_id
- characters
- piece_count
- base_price ou price_from
- description
- notes
- status
- created_at
- updated_at

### Variação
Exemplos:
- Vingadores Baby
- Vingadores Verde
- Vingadores Todos os Heróis

A IA deve preservar um nome principal e tratar o restante como variável/variação. Evite criar temas independentes quando é apenas variação do mesmo conceito.

### Kit
Exemplos:
- Bronze
- Prata
- Ouro

Cada kit deve ter preço, status e composição por itens.

### Item avulso
Exemplo:
- Cômoda fake
- Display de chão

Itens devem possuir estoque independente quando puderem ser reutilizados entre temas.

### Unidade física
Quando houver mais de uma unidade do mesmo item/tema, o sistema deve poder representar cada unidade ou quantidade agregada, conforme o tipo de estoque. O desenho deve suportar ambos.

---

## 5. REGRAS DE ESTOQUE

Exemplo:

Tema Vingadores
Quantidade total: 2

Reserva A: retirada 14/09, devolução 16/09
Reserva B: retirada 14/09, devolução 16/09

As duas podem coexistir.

Uma terceira reserva no mesmo intervalo deve gerar:

CONFLITO DE ESTOQUE.

A tentativa não deve ser confirmada automaticamente. O sistema deve mostrar o conflito e permitir uma decisão administrativa explícita.

A disponibilidade deve considerar o intervalo inteiro entre retirada e devolução, não apenas a data da festa.

Itens adicionais também comprometem estoque.

---

## 6. LOCAÇÃO

Campos mínimos:

- data do evento
- cliente
- tema
- variação
- kit
- itens inclusos
- valor total
- valor pago
- saldo
- retirada
- devolução
- status
- observações

Status iniciais:
- reservado
- alugado
- devolvido
- cancelado

Não é obrigatório criar etapas de entrega/montagem/desmontagem nesta versão.

---

## 7. GOOGLE CALENDAR

Ao criar ou confirmar uma reserva:

1. Validar estoque interno.
2. Criar/atualizar reserva no Supabase.
3. Criar evento no Google Calendar.
4. Salvar external_event_id e sync_status.

Ao editar a reserva, atualizar o evento associado.

Se o Google Calendar falhar, manter a reserva interna e registrar erro de sincronização. Nunca apagar ou perder a reserva interna por uma falha externa.

Use OAuth e escopo mínimo necessário.

---

## 8. IMPORTAÇÃO DE IMAGENS

Suportar:

A) cadastro manual pelo dashboard;
B) pasta local com várias fotos;
C) link de pasta do Google Drive;
D) WhatsApp com uma ou várias fotos;
E) WhatsApp com link de pasta Google Drive;
F) arquitetura preparada para Telegram/API.

A importação deve ser assíncrona e baseada em fila.

Estados:
- received
- downloading
- processing
- grouped
- review
- published
- error

Cada asset deve possuir:
- origem
- nome original
- mime type
- tamanho
- fingerprint/hash
- status
- entidade detectada
- confiança da IA
- mensagem de erro, quando houver

Não reimportar a mesma imagem sem necessidade.

---

## 9. IMAGENS

Regra crítica:

PRESERVE O ARQUIVO ORIGINAL EXATAMENTE COMO FOI RECEBIDO.

Nunca sobrescreva a imagem original com uma versão comprimida.

Pode gerar thumbnails e versões para web, mas sempre mantenha o original.

Suporte a:
- foto principal
- galeria
- ordenação
- exclusão lógica/controle de histórico quando necessário
- associação a tema, variação ou item

---

## 10. AGENTE DE IA

O agente será usado principalmente pelo WhatsApp.

Exemplos de comandos:

"Cadastre esse tema"
"Cadastre essas 12 fotos"
"Atualize o Vingadores"
"Adicione essa foto ao Homem-Aranha"
"Crie o kit prata desse tema por 169,90"
"Quais temas são de super-heróis?"
"Quais temas têm Batman?"
"Esse tema está disponível dia 15?"
"Cadastre os temas desta pasta do Drive"

### A IA deve:

- interpretar texto;
- analisar imagem;
- identificar nome principal;
- reconhecer personagem quando possível;
- sugerir categoria;
- sugerir variação;
- descrever características visíveis;
- identificar itens visíveis quando a confiança permitir;
- buscar cadastros existentes antes de criar novos;
- usar ferramentas para alterar dados;
- responder com resumo do que fez;
- permitir correção humana.

### Não faça:

- inventar dados desconhecidos;
- criar duplicatas por baixa confiança;
- escolher arbitrariamente entre duas variações semelhantes;
- alterar preço sem comando/autorização;
- apagar registros sem regra explícita;
- executar SQL livre;
- expor chaves ou dados internos.

---

## 11. EXEMPLO DE FLUXO DE FOTO

Usuário envia foto:

[IMAGEM]

IA:

"Identifiquei este tema como Vingadores.
Encontrei possível variação Vingadores Baby.
Confiança: 0,89.

Cadastro realizado: MF-0127.
4 fotos adicionadas.

Não consegui confirmar se a variação é Baby ou Kids.
1 - Baby
2 - Kids"

Se o usuário escolher 1, a ferramenta atualiza o registro.

---

## 12. FERRAMENTAS INTERNAS DO AGENTE

Crie serviços/tools equivalentes a:

- search_themes
- get_theme
- create_theme
- update_theme
- create_theme_variant
- update_theme_variant
- add_media_to_theme
- create_item
- update_item
- create_kit
- update_kit
- add_item_to_kit
- get_stock_availability
- search_rentals
- create_rental_draft
- confirm_rental
- update_rental
- record_payment
- import_drive_folder
- process_import
- get_import_status
- create_calendar_event
- update_calendar_event
- log_ai_action

Cada ferramenta deve ter:
- schema de entrada;
- validação;
- autorização;
- tenant_id derivado do contexto, não enviado livremente pelo modelo;
- resultado estruturado;
- logs;
- idempotency quando necessário.

---

## 13. WHATSAPP

Receber mensagens via webhook oficial da Meta.

Processar:
- texto
- imagem
- múltiplas imagens
- link do Google Drive

Para mídia do WhatsApp:

1. receber evento;
2. obter media id/url autenticado;
3. baixar imediatamente;
4. gravar original no Storage;
5. registrar mensagem/asset;
6. processar IA;
7. responder ao usuário.

Nunca dependa da URL temporária de mídia como armazenamento definitivo.

---

## 14. GOOGLE DRIVE

Ao receber um link de pasta:

1. validar URL;
2. autenticar com a conta Google autorizada;
3. resolver folder ID;
4. listar descendentes;
5. filtrar imagens suportadas;
6. criar import job;
7. baixar assets;
8. armazenar originais;
9. processar em lote;
10. agrupar por tema;
11. apresentar pendências para revisão.

Se a mesma pasta for importada novamente, evitar duplicação por fileId + fingerprint.

---

## 15. DASHBOARD

Criar navegação clara:

- Visão geral
- Temas
- Itens e estoque
- Kits e opcionais
- Agenda
- Locações
- Clientes
- Importações
- IA
- Relatórios
- Usuários e permissões
- Configurações

### Dashboard inicial
Exibir, no mínimo:

- total de temas
- total de itens
- temas disponíveis
- temas com reserva ativa
- próximos eventos
- conflitos
- valores a receber
- importações pendentes
- atividades recentes

---

## 16. AGENDA

Visualizações:
- mensal
- semanal
- diária

Na visão de reserva mostrar:
- data do evento
- cliente
- tema
- kit
- retirada
- devolução
- valor
- pago
- saldo
- status

Não criar conflito apenas por evento do Google Calendar. O estoque interno é quem decide.

---

## 17. CATÁLOGO PÚBLICO

Criar área pública sem autenticação para portfólio.

Recursos:
- busca
- filtros
- categorias
- cards de temas
- página detalhada
- galeria
- variações
- kits
- opcionais quando públicos
- botão de WhatsApp
- URL compartilhável do tema

Exemplo de CTA:

"Tenho interesse neste tema"

Ao abrir WhatsApp, incluir uma mensagem pré-preenchida com:

"Olá! Tenho interesse no tema Vingadores (MF-0127): [URL]"

Não mostrar:
- quantidade de estoque
- reservas
- conflitos
- clientes
- pagamentos
- dados internos

---

## 18. RESPONSIVIDADE E DESIGN

Estética:
- minimalista
- profissional
- sofisticada
- limpa
- excelente fotografia
- foco no produto

O sistema deve funcionar bem em:
- celular
- tablet
- desktop

O catálogo deve priorizar imagem e descoberta.
O dashboard deve priorizar produtividade e densidade de informação sem ficar visualmente pesado.

Usar componentes consistentes, estados de loading, empty states, erros claros, confirmações, toasts e acessibilidade.

---

## 19. PERMISSÕES

Começar com perfis como:

Administrador:
- tudo

Gerente:
- temas, estoque, agenda, clientes, relatórios
- sem alterações de integração crítica

Operação:
- agenda, reservas, estoque e clientes
- sem configurações críticas

Catálogo:
- leitura/edição de catálogo
- sem financeiro/usuários

Somente leitura:
- leitura de dados autorizados

As permissões devem ser realmente aplicadas no backend/RLS, não apenas escondidas na interface.

---

## 20. SEGURANÇA

Obrigatório:

- RLS em tabelas expostas;
- políticas por tenant e papel;
- secrets somente no backend;
- nenhuma service-role key no browser;
- validação server-side;
- proteção de endpoints;
- auditoria;
- idempotência de webhooks;
- retries com backoff;
- logs estruturados;
- tratamento de erro sem expor secrets;
- verificação de MIME/tamanho antes de armazenar arquivos;
- proteção contra prompt injection em conteúdo externo;
- não permitir que imagem/texto externo altere regras do sistema sem tool authorization.

---

## 21. BANCO E MIGRATIONS

Crie migrations versionadas.

Não editar produção manualmente sem migration correspondente.

Crie seed de demonstração com:

- 5 categorias
- 3 temas
- 3 variações
- 3 kits
- 5 itens
- clientes
- reservas
- pagamentos

Inclua constraints, índices e foreign keys.

Criar índices para:
- tenant_id
- internal_code
- slug
- nomes de busca
- datas de reserva
- external_event_id
- fingerprints

---

## 22. PESQUISA E BUSCA

Implementar busca textual inicialmente com PostgreSQL.

Deixar arquitetura pronta para busca semântica/embeddings posteriormente.

Não introduzir pgvector sem necessidade no MVP, mas manter o modelo de dados compatível com evolução futura.

---

## 23. RELATÓRIOS

Exportar CSV no mínimo para:

- temas
- itens
- estoque
- locações
- pagamentos
- conflitos
- importações

Criar relatório consolidado da operação por período.

---

## 24. OBSERVABILIDADE

Registrar:

- execução de importações
- chamadas do agente
- tool calls
- erros de integração
- sync do Google Calendar
- webhooks WhatsApp
- falhas de download
- alterações críticas

Criar tela simples de logs operacionais para administrador.

---

## 25. UX DE ERROS

Exemplos:

"Não foi possível acessar esta pasta do Google Drive. Verifique a autorização da conta Google."

"A foto foi recebida, mas o tema não pôde ser identificado com confiança suficiente."

"Vingadores já possui 2 unidades comprometidas entre 14/09 e 16/09."

Nunca exibir stack trace para usuário comum.

---

## 26. IMPLEMENTAÇÃO EM FASES

Execute nesta ordem:

FASE 0 - analisar repositório atual e preservar tudo que estiver funcional.

FASE 1 - schema + migrations + Auth + RLS.

FASE 2 - dashboard de temas, variações, kits, itens e fotos.

FASE 3 - estoque e agenda.

FASE 4 - Google Calendar.

FASE 5 - catálogo público.

FASE 6 - importador local + Google Drive.

FASE 7 - WhatsApp + IA + tool calling.

FASE 8 - relatórios, permissões, auditoria e hardening.

FASE 9 - preparação de integrações futuras e multiempresa.

Não tente implementar tudo em um único salto se isso prejudicar qualidade. Porém, não pare em mockups: cada fase precisa terminar com funcionalidade real e testável.

---

## 27. PROCESSO OBRIGATÓRIO DO ANTIGRAVITY

Antes de alterar:

1. Inspecione o repositório e identifique stack atual.
2. Verifique se já existe aplicação, banco, autenticação e integração.
3. Não recrie projetos que já existem.
4. Liste o plano técnico antes das alterações.
5. Implemente em pequenas etapas.
6. Execute testes após cada etapa.
7. Rode lint/typecheck/build.
8. Use browser para verificar fluxos reais.
9. Corrija erros encontrados.
10. Gere migrations e documentação do que foi alterado.

Quando existir dúvida sobre requisito, use o manual do sistema deste projeto como fonte de decisão.

---

## 28. CRITÉRIOS DE ACEITE

Considere o projeto incompleto até que estes fluxos funcionem:

1. Criar Vingadores manualmente com fotos.
2. Adicionar novas fotos sem criar duplicata.
3. Criar Vingadores Baby como variação.
4. Criar Kit Prata e adicionar itens.
5. Cadastrar Cômoda fake como item avulso.
6. Ter estoque 2 para um tema.
7. Criar 2 reservas sobrepostas válidas.
8. Bloquear/alertar a terceira reserva.
9. Sincronizar uma reserva com Google Calendar.
10. Editar reserva e atualizar evento.
11. Receber uma foto pelo WhatsApp.
12. Identificar tema e cadastrar.
13. Perguntar quando houver ambiguidade.
14. Receber várias fotos e agrupá-las.
15. Importar uma pasta do Google Drive.
16. Não duplicar uma pasta já importada.
17. Exibir o tema no catálogo público.
18. Compartilhar página direta do tema.
19. Abrir WhatsApp com contexto do tema.
20. Aplicar permissões reais para funcionários.
21. Exportar relatório.
22. Manter logs de ações e falhas.

---

## 29. REGRAS FINAIS

- Priorize qualidade de dados e consistência do estoque.
- Nunca sacrifique segurança por velocidade.
- Nunca esconda uma falha de integração.
- Prefira serviços pequenos e testáveis a lógica gigante dentro do n8n.
- Toda mutação importante deve passar por backend/tool autorizado.
- O sistema deve ser simples para um funcionário usar sem treinamento técnico.
- O catálogo público deve parecer um portfólio profissional, não um ERP.
- O dashboard deve parecer uma ferramenta SaaS profissional, não um painel improvisado.
- Preserve originais de imagens.
- Nunca permita SQL livre ao agente.
- Mantenha a Magia Festeira isolada como tenant atual e preparada para futuros tenants.

Comece agora pela inspeção completa do repositório atual. Não invente a stack existente. Descubra o que já está implementado, faça um diagnóstico e então implemente a Fase 1, documentando as decisões e deixando o projeto executável.
