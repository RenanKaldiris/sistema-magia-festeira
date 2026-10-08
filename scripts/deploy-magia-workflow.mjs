/**
 * SISTEMA MAGIA FESTEIRA - CRIAÇÃO DO NOVO WORKFLOW NO N8N
 * Criação 100% isolada sem alterar nenhum workflow existente.
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const N8N_BASE_URL = 'https://n8n.grupokaldiris.com.br/api/v1';

// Base URL da API do Sistema Magia Festeira
const MAGIA_API_URL = 'https://sistema-magia-festeira.vercel.app/api/v1';
const MAGIA_API_KEY = 'mf_live_sec_magiafesteira2026';
const EVOLUTION_API_KEY = 'B95B39447FA7-4D33-BCAC-7C1954980036';
const EVOLUTION_SEND_URL = 'https://evolutionapi.grupokaldiris.com.br/message/sendText/grupokaldiris';

const systemPrompt = `Você é o Assessor Executivo e Operacional oficial do Sistema Magia Festeira.
Sua função é gerenciar a operação de locações de temas de decoração, festas infantis e eventos.

Você atende o proprietário/equipe via WhatsApp e possui ferramentas diretas conectadas ao sistema oficial:

1. LANÇAMENTO DE LOCAÇÕES:
Quando o usuário mandar uma mensagem informando o fechamento ou lançamento de uma locação contendo os dados da festa:
- Nome do cliente
- Telefone do cliente
- Tema alugado (ex: Vingadores, Wandinha, Minha Primeira Volta ao Sol, etc.)
- Data do evento (converter para YYYY-MM-DD com base no ano atual 2026)
- Valor total (número em reais)
- Valor pago / sinal (se informado, caso contrário 0)
- Condição/Método de pagamento (pix, cartao, dinheiro)
- Endereço / local da entrega (se informado)
-> Use a ferramenta "lancar_locacao".
Ao receber a resposta do sistema, monte uma confirmação elegante com emojis celebrando o agendamento, mostrando o ID da reserva, nome do cliente cadastrado/atualizado, tema reservado e status financeiro (total, sinal pago e saldo a receber).

2. CONSULTAS E RELATÓRIOS DO ASSESSOR:
Quando o usuário fizer perguntas como:
- "Quantos temas tenho disponíveis?" ou "Quais temas livres?" -> Use a ferramenta "relatorio_assessor" com period="themes".
- "Quais locações eu tenho para o próximo final de semana?" -> Use a ferramenta "relatorio_assessor" com period="next_weekend".
- "Quantas locações eu fiz no mês passado?" ou "Quanto faturei no mês passado?" -> Use a ferramenta "relatorio_assessor" com period="last_month".
- "Como está este mês?" ou "Qual o faturamento deste mês?" -> Use a ferramenta "relatorio_assessor" com period="current_month".

3. DISPONIBILIDADE ESPECÍFICA DE UM TEMA:
Se o usuário perguntar se um tema específico está livre para uma data específica (ex: "O tema Vingadores está livre dia 15/10?"):
-> Use a ferramenta "consultar_disponibilidade_tema".

SEJA SEMPRE CLARO, PROFISSIONAL, OBJETIVO E AMIGÁVEL. Use formatação do WhatsApp com negrito (*texto*) e quebras de linha organizadas.`;

const newWorkflow = {
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

    // 3. Memória da Conversa
    {
      id: 'memory-magia-buffer',
      name: 'Memória da Conversa',
      type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
      typeVersion: 1.3,
      position: [-350, 220],
      parameters: {
        sessionKey: '={{ $json.senderPhone }}',
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

    // 5. Tool: Lançar Locação
    {
      id: 'tool-lancar-locacao',
      name: 'lancar_locacao',
      type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
      typeVersion: 1.1,
      position: [0, 220],
      parameters: {
        name: 'lancar_locacao',
        description: 'Lança uma nova locação no Sistema Magia Festeira. Recebe JSON com customerName, customerPhone, themeQuery, eventDate (YYYY-MM-DD), total (numérico), paid (numérico), paymentMethod (pix/cartao/dinheiro), deliveryLocation e notes.',
        method: 'POST',
        url: `${MAGIA_API_URL}/rentals`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'x-api-key', value: MAGIA_API_KEY }
          ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ $fromAI("payload", "JSON com customerName, customerPhone, themeQuery, eventDate, total, paid, paymentMethod, notes, deliveryLocation") }}'
      }
    },

    // 6. Tool: Relatório Executivo
    {
      id: 'tool-relatorio-assessor',
      name: 'relatorio_assessor',
      type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
      typeVersion: 1.1,
      position: [200, 220],
      parameters: {
        name: 'relatorio_assessor',
        description: 'Consulta relatórios consolidados do Sistema Magia Festeira. Parâmetro period pode ser: "themes" (temas disponíveis e livres), "next_weekend" (locações do próximo final de semana), "last_month" (total de locações e faturamento do mês anterior), ou "current_month" (mês atual).',
        method: 'GET',
        url: `=${MAGIA_API_URL}/reports/summary?period={{ $fromAI("period", "Período: themes, next_weekend, last_month ou current_month", "string") }}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'x-api-key', value: MAGIA_API_KEY }
          ]
        }
      }
    },

    // 7. Tool: Disponibilidade de Tema
    {
      id: 'tool-disponibilidade-tema',
      name: 'consultar_disponibilidade_tema',
      type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
      typeVersion: 1.1,
      position: [400, 220],
      parameters: {
        name: 'consultar_disponibilidade_tema',
        description: 'Consulta se um tema específico está disponível para alugar em um intervalo de datas. Parâmetros: themeName, pickupDate (YYYY-MM-DD) e returnDate (YYYY-MM-DD).',
        method: 'GET',
        url: `=${MAGIA_API_URL}/availability?themeName={{ $fromAI("themeName", "Nome do tema", "string") }}&pickupDate={{ $fromAI("pickupDate", "Data de retirada YYYY-MM-DD", "string") }}&returnDate={{ $fromAI("returnDate", "Data de devolução YYYY-MM-DD", "string") }}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'x-api-key', value: MAGIA_API_KEY }
          ]
        }
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

async function main() {
  console.log('🚀 Criando novo workflow no N8N: "' + newWorkflow.name + '"...');
  const res = await fetch(`${N8N_BASE_URL}/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(newWorkflow)
  });

  const responseText = await res.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error('❌ Falha ao criar workflow:', res.status, responseText);
    return;
  }

  console.log('✅ WORKFLOW CRIADO COM SUCESSO NO N8N!');
  console.log(`🆔 ID do Workflow: ${json.id}`);
  console.log(`📋 Nome: ${json.name}`);
  console.log(`🔗 URL de Edição no N8N: https://n8n.grupokaldiris.com.br/workflow/${json.id}`);
  console.log(`⚡ Webhook URL de Produção: https://n8n.grupokaldiris.com.br/webhook/magiafesteira`);
  console.log(`🧪 Webhook URL de Teste: https://n8n.grupokaldiris.com.br/webhook-test/magiafesteira`);
}

main().catch(console.error);
