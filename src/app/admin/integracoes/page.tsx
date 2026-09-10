'use client';

import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Key,
  Copy,
  Check,
  Globe,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  Package,
  Layers,
  ExternalLink,
  ShieldCheck,
  Code2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_DEV_API_KEY } from '@/lib/api-auth';

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  category: 'Clientes' | 'Locações' | 'Disponibilidade' | 'WhatsApp & IA' | 'Catálogo';
  description: string;
  requestExample: Record<string, unknown> | null;
  curlExample: string;
  responseExample: Record<string, unknown>;
}

export default function IntegracoesPage() {
  const [apiKey, setApiKey] = useState(DEFAULT_DEV_API_KEY);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000/api/v1');
  const [activeTab, setActiveTab] = useState<'endpoints' | 'guides' | 'playground'>('endpoints');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('/api/v1/customers');

  // Estado do Playground
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/api/v1/customers');
  const [playgroundMethod, setPlaygroundMethod] = useState<'GET' | 'POST'>('GET');
  const [playgroundBody, setPlaygroundBody] = useState(
    JSON.stringify(
      {
        name: 'Maria Fernanda',
        phone: '11988887777',
        email: 'maria@email.com',
        notes: 'Cliente teste via Playground',
      },
      null,
      2
    )
  );
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setBaseUrl(`${origin}/api/v1`);
    }
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCurl = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  const executePlayground = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    setPlaygroundStatus(null);

    try {
      const url = `${baseUrl.replace('/api/v1', '')}${playgroundEndpoint}`;
      const headers: Record<string, string> = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      };

      const options: RequestInit = {
        method: playgroundMethod,
        headers,
      };

      if (playgroundMethod === 'POST' && playgroundBody.trim()) {
        options.body = playgroundBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setPlaygroundStatus(res.status);
      setPlaygroundResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setPlaygroundStatus(500);
      setPlaygroundResponse(JSON.stringify({ error: (err as Error).message }, null, 2));
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const endpoints: EndpointDoc[] = [
    {
      method: 'POST',
      path: '/api/v1/customers',
      category: 'Clientes',
      title: 'Cadastrar ou Atualizar Cliente (CRM / WhatsApp)',
      description:
        'Cria um novo cliente no sistema. Se o telefone já existir, atualiza automaticamente os dados cadastrais (upsert: true).',
      requestExample: {
        name: 'Ana Carolina Santos',
        phone: '11977823876',
        email: 'anacarolina@gmail.com',
        document: '345.678.901-23',
        address: 'Rua das Flores, 120 - Santana, São Paulo - SP',
        notes: 'Contato vindo do WhatsApp de Vendas',
        upsert: true,
      },
      curlExample: `curl -X POST "${baseUrl}/customers" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "name": "Ana Carolina Santos",
    "phone": "11977823876",
    "email": "anacarolina@gmail.com",
    "address": "Rua das Flores, 120"
  }'`,
      responseExample: {
        success: true,
        message: 'Cliente cadastrado com sucesso!',
        data: {
          id: 'c5a71df8-5d20-4e4b-b0b3-112233445566',
          name: 'Ana Carolina Santos',
          phone: '11977823876',
          email: 'anacarolina@gmail.com',
          created_at: '2026-09-10T15:00:00.000Z',
        },
        isNew: true,
      },
    },
    {
      method: 'GET',
      path: '/api/v1/customers/by-phone?phone=11977823876',
      category: 'Clientes',
      title: 'Buscar Cliente pelo WhatsApp',
      description:
        'Verifica instantaneamente se o número do WhatsApp já possui cadastro no sistema da Magia Festeira. Higieniza caracteres e ignora formatos com ou sem DDI 55.',
      requestExample: null,
      curlExample: `curl -X GET "${baseUrl}/customers/by-phone?phone=11977823876" \\
  -H "x-api-key: ${apiKey}"`,
      responseExample: {
        success: true,
        found: true,
        data: {
          id: 'c5a71df8-5d20-4e4b-b0b3-112233445566',
          name: 'Ana Carolina Santos',
          phone: '11977823876',
          email: 'anacarolina@gmail.com',
        },
      },
    },
    {
      method: 'GET',
      path: '/api/v1/availability?themeName=Vingadores&pickupDate=2026-10-15&returnDate=2026-10-17',
      category: 'Disponibilidade',
      title: 'Consultar Disponibilidade de Data & Estoque',
      description:
        'Calcula a disponibilidade do tema no intervalo completo entre retirada e devolução. Aceita o código do tema (ex: MF-0127) ou o nome aproximado.',
      requestExample: null,
      curlExample: `curl -X GET "${baseUrl}/availability?themeName=Vingadores&pickupDate=2026-10-15&returnDate=2026-10-17" \\
  -H "x-api-key: ${apiKey}"`,
      responseExample: {
        success: true,
        data: {
          found: true,
          theme: {
            id: 'e0000000-0000-0000-0000-000000000001',
            code: 'MF-0127',
            name: 'Vingadores',
            base_price: 180,
            stock_quantity: 2,
          },
          available: true,
          stockTotal: 2,
          stockCommitted: 0,
          stockAvailable: 2,
        },
      },
    },
    {
      method: 'POST',
      path: '/api/v1/rentals',
      category: 'Locações',
      title: 'Lançar Pedido / Locação (com auto-cadastro de cliente)',
      description:
        'Lança a locação no sistema. Se o cliente ainda não existir, basta enviar "customerName" e "customerPhone" para criá-lo automaticamente. Valida sobreposição de estoque com retorno 409 em caso de choque de datas.',
      requestExample: {
        customerName: 'Juliana Paes',
        customerPhone: '11981234567',
        customerAddress: 'Av. Paulista, 1000 - Bela Vista',
        themeQuery: 'Vingadores',
        eventDate: '2026-10-20',
        pickupDate: '2026-10-19',
        returnDate: '2026-10-21',
        total: 280.0,
        paid: 100.0,
        paymentMethod: 'pix',
        deliveryLocation: 'Salão de Festas do Edifício',
        notes: 'Sinal de R$ 100 pago via Pix na aprovação do orçamento',
        forceOverride: false,
      },
      curlExample: `curl -X POST "${baseUrl}/rentals" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "customerName": "Juliana Paes",
    "customerPhone": "11981234567",
    "themeQuery": "Vingadores",
    "eventDate": "2026-10-20",
    "total": 280.0,
    "paid": 100.0,
    "paymentMethod": "pix"
  }'`,
      responseExample: {
        success: true,
        message: 'Pedido de locação lançado com sucesso!',
        data: {
          rental: {
            id: 'r8b92ef1-1234-5678-90ab-cdef11223344',
            theme_id: 'e0000000-0000-0000-0000-000000000001',
            event_date: '2026-10-20',
            status: 'reservado',
            total: 280,
            paid: 100,
            balance: 180,
          },
          customer: {
            id: 'c1234567-89ab-cdef-0123-456789abcdef',
            name: 'Juliana Paes',
            phone: '11981234567',
          },
        },
      },
    },
    {
      method: 'POST',
      path: '/api/v1/rentals/{id}/payments',
      category: 'Locações',
      title: 'Lançar Pagamento / Sinal (Pix, Cartão ou Dinheiro)',
      description:
        'Abate valores do saldo pendente de um pedido e atualiza automaticamente o total pago.',
      requestExample: {
        amount: 180.0,
        method: 'pix',
        note: 'Quitação final da locação via Pix',
      },
      curlExample: `curl -X POST "${baseUrl}/rentals/ID_DA_LOCACAO/payments" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "amount": 180.0,
    "method": "pix",
    "note": "Quitação da locação"
  }'`,
      responseExample: {
        success: true,
        message: 'Pagamento de R$ 180.00 registrado com sucesso!',
        data: {
          payment: {
            id: 'p9988776-5544-3322-1100-aabbccddeeff',
            amount: 180,
            method: 'pix',
          },
          rental: {
            id: 'r8b92ef1-1234-5678-90ab-cdef11223344',
            total: 280,
            paid: 280,
            balance: 0,
          },
        },
      },
    },
    {
      method: 'POST',
      path: '/api/v1/webhook/whatsapp',
      category: 'WhatsApp & IA',
      title: 'Webhook Inteligente para WhatsApp (Evolution / Z-API / n8n)',
      description:
        'Recebe mensagens diretas do WhatsApp, executa comandos em linguagem natural ou cadastros e já devolve a resposta pronta e formatada para o robô reenviar no chat.',
      requestExample: {
        senderPhone: '5511977823876',
        message: 'Cadastrar cliente Carlos Eduardo 11999998888',
      },
      curlExample: `curl -X POST "${baseUrl}/webhook/whatsapp" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "senderPhone": "5511977823876",
    "message": "Cadastrar cliente Carlos Eduardo 11999998888"
  }'`,
      responseExample: {
        success: true,
        action: 'CUSTOMER_UPSERT',
        replyMessage:
          '✅ *Cliente Cadastrado com Sucesso!*\n\n👤 *Nome:* Carlos Eduardo\n📱 *WhatsApp:* 11999998888\n\nVocê já pode lançar pedidos para este cliente.',
        data: {
          name: 'Carlos Eduardo',
          phone: '11999998888',
        },
      },
    },
    {
      method: 'GET',
      path: '/api/v1/themes',
      category: 'Catálogo',
      title: 'Consultar Catálogo de Temas & Kits',
      description:
        'Retorna todos os temas disponíveis, kits, variações e fotos para envio pelo WhatsApp.',
      requestExample: null,
      curlExample: `curl -X GET "${baseUrl}/themes" \\
  -H "x-api-key: ${apiKey}"`,
      responseExample: {
        success: true,
        total: 12,
        data: [
          {
            code: 'MF-0127',
            name: 'Vingadores',
            base_price: 180,
            primary_image: 'https://...',
            kits: [{ name: 'Kit Prata', price: 169.9 }],
          },
        ],
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                API & Integrações Externas
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Conecte WhatsApp (Evolution API, Z-API), CRMs (Kommo, RD Station) e automações (n8n, Make)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            API v1 Ativa & Online
          </span>
        </div>
      </div>

      {/* Credenciais & Chaves de API */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Chave de API */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
              <Key className="w-4 h-4 text-amber-500" />
              Chave de API (Secret Key)
            </div>
            <span className="text-xs text-slate-400">Header: x-api-key</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
            <input
              type={showKey ? 'text' : 'password'}
              readOnly
              value={apiKey}
              className="bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 w-full focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-md"
            >
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0 shadow-xs"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envie esta chave no cabeçalho <code className="text-rose-600 dark:text-rose-400 font-mono">x-api-key</code> ou como <code className="text-rose-600 dark:text-rose-400 font-mono">Authorization: Bearer</code>.
          </p>
        </div>

        {/* Card 2: URL Base da API */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
              <Globe className="w-4 h-4 text-sky-500" />
              URL Base da API (Base URL)
            </div>
            <span className="text-xs text-slate-400">RESTful v1</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
            <input
              type="text"
              readOnly
              value={baseUrl}
              className="bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 w-full focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleCopyUrl(baseUrl)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todos os endpoints devem ser prefixados com esta URL base em suas requisições.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'endpoints'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Documentação de Endpoints
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'guides'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Como Conectar no WhatsApp (n8n / Evolution API)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'playground'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Play className="w-4 h-4" />
          Playground de Teste
        </button>
      </div>

      {/* TAB 1: ENDPOINTS */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Todas as rotas exigem autenticação com o header <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">x-api-key</code>.
          </div>

          <div className="space-y-3">
            {endpoints.map((ep) => {
              const isExpanded = expandedEndpoint === ep.path;
              return (
                <div
                  key={ep.path}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
                >
                  {/* Header do Endpoint */}
                  <button
                    type="button"
                    onClick={() => setExpandedEndpoint(isExpanded ? '' : ep.path)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                          ep.method === 'GET'
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : ep.method === 'POST'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {ep.method}
                      </span>

                      <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {ep.path}
                      </span>

                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ep.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden md:inline text-xs font-medium text-slate-500 dark:text-slate-400">
                        {ep.title}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Conteúdo Expansível */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-4 text-xs">
                      <p className="text-slate-600 dark:text-slate-300 text-sm">{ep.description}</p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Exemplo de Chamada cURL */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-slate-400" />
                              Comando cURL
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCurl(ep.path, ep.curlExample)}
                              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
                            >
                              {copiedCurl === ep.path ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedCurl === ep.path ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                            {ep.curlExample}
                          </pre>
                        </div>

                        {/* Exemplo de Resposta JSON */}
                        <div className="space-y-1.5">
                          <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                            Exemplo de Resposta (200 / 201 OK)
                          </div>
                          <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                            {JSON.stringify(ep.responseExample, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {ep.requestExample && (
                        <div className="space-y-1.5">
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">
                            Corpo da Requisição (Body JSON):
                          </div>
                          <pre className="p-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-200 dark:border-slate-800">
                            {JSON.stringify(ep.requestExample, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GUIAS DE INTEGRAÇÃO */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          {/* Guia Evolution API / Z-API */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Conexão com Evolution API / Z-API / WhatsApp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure o Webhook da sua instância de WhatsApp para responder e registrar dados automaticamente
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p>
                Nas configurações de <strong>Webhook</strong> da sua instância da Evolution API ou Z-API:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  No campo <strong>Webhook URL</strong>, insira:{' '}
                  <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">
                    {baseUrl}/webhook/whatsapp
                  </code>
                </li>
                <li>
                  No campo de <strong>Headers Personalizados</strong>, adicione:
                  <pre className="mt-1 p-2 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px]">
                    {`"x-api-key": "${apiKey}"`}
                  </pre>
                </li>
                <li>
                  Marque os eventos de <strong>MESSAGES_UPSERT</strong> ou <strong>SEND_MESSAGE</strong>.
                </li>
              </ol>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                💡 <strong>Como funciona na prática:</strong> O cliente ou você envia mensagens no WhatsApp como{' '}
                <em>"Cadastrar cliente Roberto Carlos 11999998888"</em> ou <em>"O tema Vingadores está livre dia 15/10?"</em>. O sistema processa, consulta o estoque ou cadastra no banco e devolve a mensagem formatada para envio imediato!
              </div>
            </div>
          </div>

          {/* Guia n8n */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Automação no n8n (HTTP Request Node)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Como alimentar clientes e criar pedidos a partir de formulários, Typebot ou Kommo CRM
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p>No nó <strong>HTTP Request</strong> do n8n:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Method:</strong> POST</li>
                <li><strong>URL:</strong> <code className="font-mono text-rose-600 dark:text-rose-400">{baseUrl}/rentals</code></li>
                <li><strong>Authentication:</strong> Generic Credential Type &gt; Header Auth</li>
                <li><strong>Header Name:</strong> <code className="font-mono">x-api-key</code></li>
                <li><strong>Header Value:</strong> <code className="font-mono">{apiKey}</code></li>
                <li><strong>Body Content Type:</strong> JSON</li>
              </ul>

              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px]">
                {`{
  "customerName": "={{ $json.nome_cliente }}",
  "customerPhone": "={{ $json.telefone }}",
  "themeQuery": "={{ $json.tema_escolhido }}",
  "eventDate": "={{ $json.data_festa }}",
  "total": "={{ $json.valor_total }}",
  "paid": "={{ $json.sinal_pago }}",
  "paymentMethod": "pix"
}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-rose-600" />
              Playground de Teste da API em Tempo Real
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispare requisições reais contra a sua API local diretamente desta tela
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Método
              </label>
              <select
                value={playgroundMethod}
                onChange={(e) => setPlaygroundMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Rota / Endpoint
              </label>
              <select
                value={playgroundEndpoint}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlaygroundEndpoint(val);
                  if (val.includes('by-phone') || val.includes('availability') || val.includes('themes')) {
                    setPlaygroundMethod('GET');
                  } else if (val === '/api/v1/customers' || val === '/api/v1/rentals' || val.includes('webhook')) {
                    setPlaygroundMethod('POST');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200"
              >
                <option value="/api/v1/customers">/api/v1/customers (Listar ou Criar)</option>
                <option value="/api/v1/customers/by-phone?phone=11977823876">/api/v1/customers/by-phone?phone=11977823876</option>
                <option value="/api/v1/availability?themeName=Vingadores&pickupDate=2026-10-15&returnDate=2026-10-17">/api/v1/availability (Checar Estoque)</option>
                <option value="/api/v1/rentals">/api/v1/rentals (Listar ou Lançar Pedido)</option>
                <option value="/api/v1/themes">/api/v1/themes (Catálogo de Temas)</option>
                <option value="/api/v1/webhook/whatsapp">/api/v1/webhook/whatsapp (Comandos WhatsApp)</option>
              </select>
            </div>
          </div>

          {playgroundMethod === 'POST' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                JSON do Body (Payload)
              </label>
              <textarea
                rows={6}
                value={playgroundBody}
                onChange={(e) => setPlaygroundBody(e.target.value)}
                className="w-full p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs border border-slate-800 focus:outline-hidden focus:border-rose-500"
              />
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={executePlayground}
              disabled={playgroundLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              {playgroundLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              {playgroundLoading ? 'Executando Requisição...' : 'Disparar Requisição'}
            </button>
          </div>

          {playgroundResponse && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resposta da API:
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold font-mono ${
                    playgroundStatus && playgroundStatus < 300
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  HTTP {playgroundStatus}
                </span>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
                {playgroundResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
