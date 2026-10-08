/**
 * SISTEMA MAGIA FESTEIRA - ATUALIZAÇÃO DO WORKFLOW NO N8N
 * Configura ferramentas diretas para:
 * 1. Lançamento completo de locações com dados do cliente (CPF, endereço, cel), evento (nome, horário, local) e tema.
 * 2. Listagem de todos os temas reais (evita alucinação do modelo).
 * 3. Relatórios consolidados do Assessor.
 * 4. Disponibilidade de temas.
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const N8N_BASE_URL = 'https://n8n.grupokaldiris.com.br/api/v1';
const WORKFLOW_ID = 'GIwxf2EyvbdEK0MB';

const EVOLUTION_API_KEY = 'F43CA559BE94-4337-9CE0-2557FC9F9772';
const EVOLUTION_SEND_URL = 'https://evolutionapi.grupokaldiris.com.br/message/sendText/Magia%20festeira';

const systemPrompt = `Você é o Assessor Executivo e Operacional oficial do Sistema Magia Festeira.
Sua missão é gerenciar a operação de locações de temas de decoração e festas para a Magia Festeira.
O ano base atual das datas é 2026.

Você atende os proprietários e gestores (Renan e equipe) via WhatsApp e possui ferramentas diretas conectadas ao sistema oficial:

============================================================
1. LANÇAMENTO DE LOCAÇÕES VIA FORMULÁRIO OU TEXTO DE CLIENTE:
============================================================
Quando o gestor enviar uma mensagem contendo os dados de um cliente e da festa (geralmente texto padronizado encaminhado do cliente), faça a leitura completa de TODOS os dados e chame a ferramenta "lancar_locacao".

Exemplo típico de mensagem recebida:
"Nome: mariana panza de oliveira
CPF: 34549031816
End: av paes de barros 701 apto 201
Cep: 03115020
Bairro: mooca
Cidade: sao paulo
Cel: 11 998674538

DADOS DO EVENTO: ANIVERSARIO DO RENAN
Data: 17/10
Horário do início: 13H 
Horário do término: 20H
End: AV. PAES DE BARROS 701 - SALAO DE FESTAS
Bairro: MOOCA
Cep: 03115-020

DADOS DE LOCAÇÃO
Tema Escolhido: Rei Leão
Valor total: 189,99
Forma de pagamento: PIX - 50% 09/10 E 50% 16/10
observação: RENAN VAI RETIRAR NA SEXTA 16/10 (COMBINA COM VOCÊ)"

Como mapear esses dados na ferramenta "lancar_locacao":
- customerName: "mariana panza de oliveira"
- customerPhone: "11 998674538"
- customerDocument: "34549031816"
- customerAddress: "av paes de barros 701 apto 201, mooca, sao paulo, CEP: 03115020"
- eventName: "ANIVERSARIO DO RENAN"
- eventDate: "2026-10-17" (calcule sempre ano 2026 para a data informada)
- pickupDate: "2026-10-16" (se a observação disser que retira na sexta 16/10, use essa data; senão, a véspera ou o dia do evento)
- returnDate: "2026-10-18" (geralmente dia posterior ao evento)
- startTime: "13H"
- endTime: "20H"
- deliveryLocation: "AV. PAES DE BARROS 701 - SALAO DE FESTAS, MOOCA, CEP: 03115-020"
- themeQuery: "Rei Leão"
- total: 189.99
- paid: 95.00 (ou o valor de sinal pago se indicado; se ainda pendente, 0)
- paymentMethod: "pix" (ou cartao/dinheiro)
- paymentTerms: "PIX - 50% 09/10 E 50% 16/10"
- notes: "RENAN VAI RETIRAR NA SEXTA 16/10 (COMBINA COM VOCÊ)"

Ao receber a confirmação da ferramenta "lancar_locacao", responda ao gestor com um comprovante completo, bonito e organizado no WhatsApp:
🎉 *Locação Confirmada no Sistema Magia Festeira!*

📋 *Pedido:* #[ID do pedido]
👤 *Cliente:* [Nome do Cliente]
🪪 *CPF:* [CPF do Cliente]
📞 *Telefone:* [Telefone]
🏠 *Endereço Cliente:* [Endereço residencial]

🎈 *Tema:* [Nome do tema]
🎂 *Evento:* [Nome do evento]
📅 *Data da Festa:* [Data DD/MM/AAAA]
⏰ *Horário:* [Horário início às término]
📍 *Local do Evento:* [Endereço da festa / salão]

💰 *Valor Total:* R$ [Total]
✅ *Sinal/Pago:* R$ [Pago] ([Forma])
⏳ *Saldo a Receber:* R$ [Saldo]
💳 *Condição:* [Condição de pagamento]

📝 *Observação de Retirada:* [Observação]
✨ _Cliente vinculado no histórico sem duplicidade e estoque reservado com sucesso!_

============================================================
2. LISTA E NOMES DOS TEMAS (CATÁLOGO COMPLETO):
============================================================
SEMPRE que o usuário pedir:
- "Quero uma lista com todos os nomes dos temas que temos"
- "Quais temas temos?" ou "Lista de temas" ou "Catálogo de temas" ou pedir somente os nomes
-> Chame OBRIGATORIAMENTE a ferramenta "listar_todos_temas".
-> NUNCA invente nomes genéricos como "Tema 1", "Tema 2", "Tema 3"!
-> Use o retorno real da ferramenta com os nomes dos temas cadastrados.

============================================================
3. RELATÓRIOS E MÉTRICAS GERAIS:
============================================================
- "Quantos temas tenho disponíveis?" ou "Quantos temas estão livres?" -> Chame "relatorio_assessor" com query "themes".
- "Quais locações eu tenho para o próximo final de semana?" -> Chame "relatorio_assessor" com query "next_weekend".
- "Quantas locações eu fiz no mês passado?" ou "Faturamento mês passado" -> Chame "relatorio_assessor" com query "last_month".
- "Como está este mês?" ou "Faturamento deste mês" -> Chame "relatorio_assessor" com query "current_month".

============================================================
4. CONSULTA DE DISPONIBILIDADE ESPECÍFICA:
============================================================
Se o usuário perguntar se um tema específico está livre em uma data específica:
-> Chame "consultar_disponibilidade_tema" passando themeName e data (YYYY-MM-DD).

SEJA SEMPRE CLARO, EXECUTIVO, ÁGIL E EFICIENTE. Use formatação limpa do WhatsApp (*negrito*, quebras de linha e emojis).`;

const updatedWorkflow = {
  name: '[Magia Festeira] - Assessor Operacional & Lançamento de Locações',
  settings: {
    executionOrder: 'v1'
  },
  nodes: [
    // 1. Webhook Evolution API
    {
      id: 'webhook-magia-whatsapp',
      name: 'Webhook WhatsApp (Magia Festeira)',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [-1000, 0],
      webhookId: 'magia-festeira-webhook-2026',
      parameters: {
        httpMethod: 'POST',
        path: 'magiafesteira',
        options: {}
      }
    },

    // 2. Filtro & Sanitização
    {
      id: 'filter-magia-input',
      name: 'Filtro & Sanitização WhatsApp',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-750, 0],
      parameters: {
        jsCode: `const item = $input.first().json;
const body = item.body || item;

// 1. Ignora mensagens enviadas pelo próprio bot
if (body.data?.key?.fromMe === true) {
  return [];
}

// 2. Extrai dados do remetente
const senderName = body.data?.pushName || 'Gestor Magia Festeira';
const remoteJid = body.data?.key?.remoteJid || '';
const senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

// 3. Extrai texto da mensagem
const messageType = body.data?.messageType || '';
const messageText = body.data?.message?.conversation ||
                    body.data?.message?.extendedTextMessage?.text ||
                    body.data?.message?.imageMessage?.caption ||
                    body.message || body.text || '';

if (!messageText.trim()) {
  return [];
}

// 4. Data e Hora atual formatada
const now = new Date();
const currentDateTime = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

return [{
  json: {
    senderName,
    remoteJid,
    senderPhone,
    messageType,
    messageText,
    currentDateTime,
    chatInput: messageText
  }
}];`
      }
    },

    // 2.1 Filtro de Segurança: Telefones Autorizados
    {
      id: 'if-telefones-autorizados',
      name: 'Telefones autorizados',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.3,
      position: [-500, 0],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'loose',
            version: 3
          },
          conditions: [
            {
              id: 'c1-renan-pessoal',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '5511976371317',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            },
            {
              id: 'c2-renan-pessoal-sem-9',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '551176371317',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            },
            {
              id: 'c3-renan-com-9',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '5511976330783',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            },
            {
              id: 'c4-renan-sem-9',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '551176330783',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            },
            {
              id: 'c5-socio-com-9',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '5511991049200',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            },
            {
              id: 'c6-socio-sem-9',
              leftValue: '={{ $json.senderPhone }}',
              rightValue: '551191049200',
              operator: {
                type: 'string',
                operation: 'equals',
                name: 'filter.operator.equals'
              }
            }
          ],
          combinator: 'or'
        },
        looseTypeValidation: true,
        options: {}
      }
    },

    // 3. Memória da Conversa (Window Buffer)
    {
      id: 'memory-magia-buffer',
      name: 'Memória da Conversa',
      type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
      typeVersion: 1.3,
      position: [-350, 240],
      parameters: {
        sessionIdType: 'customKey',
        sessionKey: '={{ $json.remoteJid }}',
        contextWindowLength: 10
      }
    },

    // 4. Modelo de Linguagem OpenAI
    {
      id: 'model-magia-openai',
      name: 'OpenAI Chat Model',
      type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
      typeVersion: 1.3,
      position: [-200, 240],
      parameters: {
        model: {
          __rl: true,
          mode: 'list',
          value: 'gpt-4o-mini'
        },
        options: {
          temperature: 0.2
        }
      },
      credentials: {
        openAiApi: {
          id: 'eShyGFnKXwuTr0mz',
          name: 'OpenAI account'
        }
      }
    },

    // 5. Tool: Lançar Locação (toolCode)
    {
      id: 'tool-lancar-locacao',
      name: 'lancar_locacao',
      type: '@n8n/n8n-nodes-langchain.toolCode',
      typeVersion: 1.1,
      position: [-50, 240],
      parameters: {
        name: 'lancar_locacao',
        description: 'Lança uma nova locação no Sistema Magia Festeira. Recebe JSON com customerName, customerPhone, customerDocument (CPF), customerAddress (residencial), eventName, eventDate (YYYY-MM-DD), pickupDate, returnDate, startTime, endTime, themeQuery, total, paid, paymentMethod, paymentTerms, deliveryLocation (local da festa) e notes.',
        jsCode: `let params = {};
try {
  params = typeof query === 'string' ? JSON.parse(query) : (query || {});
} catch (e) {
  params = { raw: query };
}

const payload = {
  customerName: params.customerName || params.nome || 'Cliente WhatsApp',
  customerPhone: String(params.customerPhone || params.telefone || params.cel || '').replace(/\\D/g, ''),
  customerDocument: params.customerDocument || params.cpf || params.document || null,
  customerAddress: params.customerAddress || params.enderecoCliente || params.enderecoResidencial || null,
  customerEmail: params.customerEmail || params.email || null,

  eventName: params.eventName || params.nomeEvento || params.dadosEvento || null,
  eventDate: params.eventDate || params.data || '',
  pickupDate: params.pickupDate || params.dataRetirada || params.eventDate || params.data || '',
  returnDate: params.returnDate || params.dataDevolucao || params.eventDate || params.data || '',
  startTime: params.startTime || params.horarioInicio || null,
  endTime: params.endTime || params.horarioTermino || null,

  themeQuery: params.themeQuery || params.tema || params.temaEscolhido || params.themeName || '',
  total: Number(params.total || params.valorTotal || params.valor || 0),
  paid: Number(params.paid || params.sinal || params.entrada || 0),
  paymentMethod: params.paymentMethod || params.formaPagamento || 'pix',
  paymentTerms: params.paymentTerms || params.condicaoPagamento || params.formaPagamento || null,
  extraItems: params.extraItems || params.itensExtras || null,

  deliveryLocation: params.deliveryLocation || params.enderecoEvento || params.localEntrega || params.local || null,
  notes: params.notes || params.observacao || params.observacoes || null,
  forceOverride: params.forceOverride !== undefined ? params.forceOverride : true
};

try {
  const res = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://sistema-magia-festeira-kaldiris-financial-os.vercel.app/api/v1/rentals',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'mf_live_sec_magiafesteira2026'
    },
    body: payload,
    json: true
  });
  return JSON.stringify(res);
} catch (err) {
  return JSON.stringify({ success: false, error: err.message });
}`
      }
    },

    // 6. Tool: Relatório Executivo (toolCode)
    {
      id: 'tool-relatorio-assessor',
      name: 'relatorio_assessor',
      type: '@n8n/n8n-nodes-langchain.toolCode',
      typeVersion: 1.1,
      position: [150, 240],
      parameters: {
        name: 'relatorio_assessor',
        description: 'Consulta métricas consolidadas do Sistema Magia Festeira. Passe como query apenas a palavra do período: "themes", "next_weekend", "last_month" ou "current_month".',
        jsCode: `let period = 'current_month';
const q = String(query || '').toLowerCase();
if (q.includes('theme') || q.includes('tema')) {
  period = 'themes';
} else if (q.includes('weekend') || q.includes('fim de semana') || q.includes('final de semana') || q.includes('proximo')) {
  period = 'next_weekend';
} else if (q.includes('last') || q.includes('passado') || q.includes('anterior')) {
  period = 'last_month';
} else if (q.includes('atual') || q.includes('current') || q.includes('este mes') || q.includes('mês')) {
  period = 'current_month';
}

try {
  const res = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://sistema-magia-festeira-kaldiris-financial-os.vercel.app/api/v1/reports/summary?period=' + period,
    headers: {
      'x-api-key': 'mf_live_sec_magiafesteira2026'
    },
    json: true
  });
  return JSON.stringify(res.data || res);
} catch (err) {
  return JSON.stringify({ error: err.message });
}`
      }
    },

    // 7. Tool: Listar Todos os Temas Reais do Catálogo (toolCode)
    {
      id: 'tool-listar-todos-temas',
      name: 'listar_todos_temas',
      type: '@n8n/n8n-nodes-langchain.toolCode',
      typeVersion: 1.1,
      position: [350, 240],
      parameters: {
        name: 'listar_todos_temas',
        description: 'Retorna a lista completa com todos os nomes reais dos temas cadastrados no acervo da Magia Festeira. Use SEMPRE que o usuário pedir uma lista de temas, nomes de temas, catálogo de temas ou perguntar quais temas existem. NUNCA invente nomes como Tema 1 ou Tema 2.',
        jsCode: `try {
  const res = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://sistema-magia-festeira-kaldiris-financial-os.vercel.app/api/v1/themes?namesOnly=true',
    headers: {
      'x-api-key': 'mf_live_sec_magiafesteira2026'
    },
    json: true
  });
  if (res && res.data && res.data.formattedList) {
    return res.data.formattedList;
  }
  if (res && res.formattedList) {
    return res.formattedList;
  }
  if (res && res.data && res.data.names) {
    return res.data.names.map((n, i) => (i + 1) + '. ' + n).join('\\n');
  }
  return JSON.stringify(res.data || res);
} catch (err) {
  return JSON.stringify({ error: err.message });
}`
      }
    },

    // 8. Tool: Disponibilidade de Tema (toolCode)
    {
      id: 'tool-disponibilidade-tema',
      name: 'consultar_disponibilidade_tema',
      type: '@n8n/n8n-nodes-langchain.toolCode',
      typeVersion: 1.1,
      position: [550, 240],
      parameters: {
        name: 'consultar_disponibilidade_tema',
        description: 'Consulta se um tema específico está disponível para alugar em um intervalo de datas. Passe um JSON string com themeName, pickupDate (YYYY-MM-DD) e returnDate (YYYY-MM-DD).',
        jsCode: `let params = {};
try {
  params = typeof query === 'string' ? JSON.parse(query) : (query || {});
} catch (e) {
  params = { themeName: query };
}

const themeName = encodeURIComponent(params.themeName || params.tema || '');
const pickupDate = params.pickupDate || params.data || '';
const returnDate = params.returnDate || pickupDate;

try {
  const res = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://sistema-magia-festeira-kaldiris-financial-os.vercel.app/api/v1/availability?themeName=' + themeName + '&pickupDate=' + pickupDate + '&returnDate=' + returnDate,
    headers: {
      'x-api-key': 'mf_live_sec_magiafesteira2026'
    },
    json: true
  });
  return JSON.stringify(res.data || res);
} catch (err) {
  return JSON.stringify({ error: err.message });
}`
      }
    },

    // 9. Agente Assessor Magia Festeira
    {
      id: 'agent-magia-festeira',
      name: 'Assessor Magia Festeira (IA)',
      type: '@n8n/n8n-nodes-langchain.agent',
      typeVersion: 1.7,
      position: [-100, 0],
      parameters: {
        promptType: 'define',
        text: '={{ $json.messageText }}',
        options: {
          systemMessage: systemPrompt,
          maxIterations: 10
        }
      }
    },

    // 10. Enviar Resposta WhatsApp
    {
      id: 'send-whatsapp-reply',
      name: 'Enviar Resposta WhatsApp (Evolution)',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [750, 0],
      parameters: {
        method: 'POST',
        url: EVOLUTION_SEND_URL,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'apikey', value: EVOLUTION_API_KEY },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'number',
              value: '={{ $(\'Filtro & Sanitização WhatsApp\').item.json.senderPhone }}'
            },
            {
              name: 'text',
              value: '={{ $json.output }}'
            }
          ]
        },
        options: {}
      }
    }
  ],
  connections: {
    'Webhook WhatsApp (Magia Festeira)': {
      main: [
        [{ node: 'Filtro & Sanitização WhatsApp', type: 'main', index: 0 }]
      ]
    },
    'Filtro & Sanitização WhatsApp': {
      main: [
        [{ node: 'Telefones autorizados', type: 'main', index: 0 }]
      ]
    },
    'Telefones autorizados': {
      main: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'main', index: 0 }]
      ]
    },
    'Memória da Conversa': {
      ai_memory: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_memory', index: 0 }]
      ]
    },
    'OpenAI Chat Model': {
      ai_languageModel: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_languageModel', index: 0 }]
      ]
    },
    'lancar_locacao': {
      ai_tool: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_tool', index: 0 }]
      ]
    },
    'relatorio_assessor': {
      ai_tool: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_tool', index: 0 }]
      ]
    },
    'listar_todos_temas': {
      ai_tool: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_tool', index: 0 }]
      ]
    },
    'consultar_disponibilidade_tema': {
      ai_tool: [
        [{ node: 'Assessor Magia Festeira (IA)', type: 'ai_tool', index: 0 }]
      ]
    },
    'Assessor Magia Festeira (IA)': {
      main: [
        [{ node: 'Enviar Resposta WhatsApp (Evolution)', type: 'main', index: 0 }]
      ]
    }
  }
};

async function update() {
  console.log(`Atualizando workflow ${WORKFLOW_ID}...`);
  const res = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatedWorkflow)
  });

  if (!res.ok) {
    console.error('Erro ao atualizar:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log('✅ Workflow atualizado com sucesso no N8N! ID:', data.id);
}

update().catch(console.error);
