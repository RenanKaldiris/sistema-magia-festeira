'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import {
  Bot,
  Send,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Terminal,
  Code2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { aiOrchestrator, AIProcessResponse } from '@/services/ai/orchestrator';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  timestamp: string;
  responseMeta?: AIProcessResponse;
}

export default function AdminIAPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Olá! Sou o Agente de IA da Magia Festeira. Posso consultar temas, checar datas disponíveis na agenda, cadastrar decorações por foto ou criar kits comerciais. Como posso te ajudar hoje?',
      timestamp: '10:00',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<AIProcessResponse | null>(null);

  // Amostras de fotos de cenários para teste de upload
  const samplePhotos = [
    {
      label: 'Foto Vingadores',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
      fingerprint: 'sha256-sample-vingadores',
    },
    {
      label: 'Foto Volta ao Sol',
      url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600',
      fingerprint: 'sha256-sample-volta-sol',
    },
    {
      label: 'Foto Tardezinha',
      url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600',
      fingerprint: 'sha256-sample-tardezinha',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : input;
    if (!text.trim() && !selectedPhoto) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      imageUrl: selectedPhoto || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const photoToProcess = selectedPhoto;
    setSelectedPhoto(null);
    setLoading(true);

    try {
      const response = await aiOrchestrator.processInput({
        channel: 'whatsapp',
        senderId: '5511999998888',
        text: userMsg.text,
        imageUrl: photoToProcess || undefined,
        imageFingerprint: photoToProcess ? `sha256-${Date.now()}` : undefined,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseMeta: response,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLastMeta(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Agente de IA Multimodal (WhatsApp Cloud API)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Simulador oficial de WhatsApp conectado ao orquestrador de inteligência e às 23 ferramentas internas de banco, estoque e calendário.
        </p>
      </div>

      {/* Main Workspace Grid: Simulator (Left 7 cols) & Tool Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* WhatsApp Simulator Frame */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col h-[700px]">
          {/* WhatsApp Header */}
          <div className="bg-emerald-700 dark:bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-800 dark:bg-emerald-900 flex items-center justify-center p-1.5 overflow-hidden shadow-xs border border-emerald-600/60">
                <NextImage
                  src="/logo/logo-icon-light.png"
                  alt="Magia Festeira"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Magia Festeira Agente IA</h3>
                <span className="text-[11px] text-emerald-200 block -mt-0.5">
                  online • WhatsApp Cloud API Oficial
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-800/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-mono">
              v2.5-flash
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/70 dark:bg-slate-950/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs text-xs sm:text-sm leading-relaxed space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {m.imageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-48 border border-black/10">
                      <img src={m.imageUrl} alt="Upload" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Multiple Choice Options Quick Buttons if Any */}
                  {m.responseMeta?.options && (
                    <div className="pt-2 flex flex-col gap-1.5">
                      {m.responseMeta.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(`${idx + 1}`)}
                          className="text-left px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] text-right font-medium ${
                      m.sender === 'user' ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Agente digitando e processando ferramentas...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => handleSendMessage('Esse tema está disponível dia 15?')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              📅 Checar Vingadores dia 15
            </button>
            <button
              onClick={() => handleSendMessage('Quais temas são de super-heróis?')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              🔍 Temas de Super-heróis
            </button>
            <button
              onClick={() => handleSendMessage('Crie o kit prata desse tema por 169,90')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              🏷️ Criar Kit Prata
            </button>
          </div>

          {/* Photo Attachment Drawer */}
          {selectedPhoto && (
            <div className="p-3 bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={selectedPhoto} alt="Thumb" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Foto anexada pronta para análise</span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
              >
                Remover
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
            {/* Camera / Photo Presets Popover */}
            <div className="relative group">
              <button
                type="button"
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Anexar foto"
              >
                <Camera className="w-5 h-5" />
              </button>

              <div className="absolute bottom-12 left-0 hidden group-hover:block bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-56 z-20 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase px-2">Fotos de Demonstração:</span>
                {samplePhotos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(p.url);
                      setInput('Cadastre esse tema');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-2"
                  >
                    <img src={p.url} alt="p" className="w-6 h-6 rounded object-cover" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite uma mensagem ou comando para o agente..."
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={loading || (!input.trim() && !selectedPhoto)}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tool Calling Inspector & Observability (Right 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 text-slate-200 rounded-3xl p-6 shadow-xl space-y-6 h-[700px] overflow-y-auto border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-sm text-white">Inspetor de Tool Calling</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
              RLS + Schemas Ativos
            </span>
          </div>

          {lastMeta ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[10px]">Confiança da IA:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {((lastMeta.confidence || 0) * 100).toFixed(1)}%
                </span>
                {lastMeta.identifiedTheme && (
                  <span className="text-[11px] text-slate-300 block">
                    Tema: <strong>{lastMeta.identifiedTheme}</strong> ({lastMeta.code})
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold block mb-2 uppercase tracking-wide">
                  Ferramentas Executadas ({lastMeta.toolCalls.length}):
                </span>

                {lastMeta.toolCalls.map((tc, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-rose-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        {tc.toolName}
                      </span>
                      <span className="text-[10px] text-emerald-400">sucesso</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Parâmetros Validados (Zod):</span>
                      <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 rounded bg-slate-900 mt-1">
                        {JSON.stringify(tc.args, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Retorno Estruturado:</span>
                      <pre className="text-[11px] text-slate-400 overflow-x-auto p-2 rounded bg-slate-900 mt-1">
                        {JSON.stringify(tc.result.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Bot className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-xs">
                Nenhuma ferramenta executada na sessão atual. Envie uma foto ou comando no simulador ao lado.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
