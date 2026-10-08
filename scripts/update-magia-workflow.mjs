/**
 * SISTEMA MAGIA FESTEIRA - ATUALIZAÇÃO DO WORKFLOW NO N8N COM TOOLCODE ROBUSTO
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const N8N_BASE_URL = 'https://n8n.grupokaldiris.com.br/api/v1';
const WORKFLOW_ID = 'GIwxf2EyvbdEK0MB';

const MAGIA_API_URL = 'https://sistema-magia-festeira-kaldiris-financial-os.vercel.app/api/v1';
const MAGIA_API_KEY = 'mf_live_sec_magiafesteira2026';
const EVOLUTION_API_KEY = 'B95B39447FA7-4D33-BCAC-7C1954980036';
const EVOLUTION_SEND_URL = 'https://evolutionapi.grupokaldiris.com.br/message/sendText/grupokaldiris';

const systemPrompt = `Você é o Assessor Executivo e Operacional oficial do Sistema Magia Festeira.
Sua missão é gerenciar a operação de locações de temas de decoração e festas para a Magia Festeira.
O ano base atual das datas é 2026.

Você atende o proprietário/equipe via WhatsApp e possui ferramentas diretas conectadas ao sistema oficial:

1. LANÇAMENTO DE LOCAÇÕES:
Quando o usuário mandar uma mensagem com dados de uma locação realizada (ex: cliente, telefone, tema, data, valor, sinal/pagamento, local):
-> Chame a ferramenta "lancar_locacao" passando um JSON com:
{
  "customerName": "...",
  "customerPhone": "...",
  "themeQuery": "...",
  "eventDate": "YYYY-MM-DD",
  "total": 350.00,
  "paid": 100.00,
  "paymentMethod": "pix",
  "deliveryLocation": "...",
  "notes": "..."
}
Ao receber a resposta do sistema, monte um comprovante de confirmação muito elegante no WhatsApp com emojis:
🎉 *Locação Confirmada no Sistema!*
📋 *Pedido:* #ID
👤 *Cliente:* [Nome] ([Telefone])
🎈 *Tema:* [Nome do tema]
📅 *Data da Festa:* [Data formatada DD/MM/AAAA]
💰 *Valor Total:* R$ [Total]
✅ *Sinal Pago:* R$ [Pago] ([Forma de pagamento])
⏳ *Saldo Restante:* R$ [Saldo a receber]
📦 _Estoque reservado e cliente atualizado no histórico com sucesso!_

2. CONSULTAS E RELATÓRIOS DO ASSESSOR:
Quando o usuário fizer perguntas como:
- "Quantos temas tenho disponíveis?" ou "Quais temas estão livres?" -> Chame a ferramenta "relatorio_assessor" passando "themes".
- "Quais locações eu tenho para o próximo final de semana?" -> Chame a ferramenta "relatorio_assessor" passando "next_weekend".
- "Quantas locações eu fiz no mês passado?" ou "Quanto faturei no mês passado?" -> Chame a ferramenta "relatorio_assessor" passando "last_month".
- "Como está este mês?" ou "Qual o faturamento deste mês?" -> Chame a ferramenta "relatorio_assessor" passando "current_month".

3. DISPONIBILIDADE ESPECÍFICA DE UM TEMA:
Se o usuário perguntar se um tema específico está livre para uma data específica:
-> Chame a ferramenta "consultar_disponibilidade_tema" passando o nome do tema e a data (YYYY-MM-DD).

SEJA SEMPRE CLARO, DIRETO, EXECUTIVO E AMIGÁVEL. Use formatação do WhatsApp com negrito (*texto*) e quebras de linha organizadas.`;

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

    // 3. Memória da Conversa (Window Buffer)
    {
      id: 'memory-magia-buffer',
      name: 'Memória da Conversa',
      type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
      typeVersion: 1.3,
      position: [-350, 220],
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
      position: [-200, 220],
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
      position: [0, 220],
      parameters: {
        name: 'lancar_locacao',
        description: 'Lança uma nova locação no Sistema Magia Festeira. Passe um JSON string com customerName, customerPhone, themeQuery, eventDate (YYYY-MM-DD), total (numérico), paid (sinal pago), paymentMethod (pix/cartao/dinheiro), deliveryLocation e notes.',
        jsCode: `let params = {};
try {
  params = typeof query === 'string' ? JSON.parse(query) : (query || {});
} catch (e) {
  params = { raw: query };
}

const payload = {
  customerName: params.customerName || params.nome || 'Cliente WhatsApp',
  customerPhone: String(params.customerPhone || params.telefone || '').replace(/\\D/g, ''),
  themeQuery: params.themeQuery || params.tema || params.themeName || '',
  eventDate: params.eventDate || params.data || '',
  pickupDate: params.pickupDate || params.eventDate || params.data || '',
  returnDate: params.returnDate || params.eventDate || params.data || '',
  total: Number(params.total || params.valor || 0),
  paid: Number(params.paid || params.sinal || params.entrada || 0),
  paymentMethod: params.paymentMethod || params.formaPagamento || 'pix',
  deliveryLocation: params.deliveryLocation || params.endereco || params.local || null,
  notes: params.notes || params.observacoes || 'Lançado via WhatsApp pelo Assessor'
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
      position: [200, 220],
      parameters: {
        name: 'relatorio_assessor',
        description: 'Consulta relatórios consolidados do Sistema Magia Festeira. Passe como query apenas a palavra do período: "themes", "next_weekend", "last_month" ou "current_month".',
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

    // 7. Tool: Disponibilidade de Tema (toolCode)
    {
      id: 'tool-disponibilidade-tema',
      name: 'consultar_disponibilidade_tema',
      type: '@n8n/n8n-nodes-langchain.toolCode',
      typeVersion: 1.1,
      position: [400, 220],
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

    // 8. Agente Assessor Magia Festeira
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

    // 9. Enviar Resposta WhatsApp
    {
      id: 'send-whatsapp-reply',
      name: 'Enviar Resposta WhatsApp (Evolution)',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [600, 0],
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
  console.log('✅ Workflow atualizado com sucesso! ID:', data.id);
}

update().catch(console.error);
