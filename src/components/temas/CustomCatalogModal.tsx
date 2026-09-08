'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Printer, Sparkles, ExternalLink } from 'lucide-react';
import { Theme, ThemeWithDetails } from '@/types/database';
import Image from 'next/image';

interface CustomCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedThemes: (Theme | ThemeWithDetails)[];
}

export function CustomCatalogModal({
  isOpen,
  onClose,
  selectedThemes,
}: CustomCatalogModalProps) {
  const [copied, setCopied] = useState(false);
  const [clientName, setClientName] = useState('');

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://magiafesteira.com.br';

  const generateWhatsAppMessage = () => {
    const greeting = clientName.trim()
      ? `Olá, *${clientName.trim()}*! Tudo bem? 🎈\n`
      : `Olá! Tudo bem? 🎈\n`;

    let text = `${greeting}Aqui está a seleção personalizada de temas da *Magia Festeira* que separamos para o seu evento:\n\n`;

    selectedThemes.forEach((t, idx) => {
      const priceText = t.promotional_price
        ? `~R$ ${t.base_price.toFixed(2).replace('.', ',')}~ por *R$ ${t.promotional_price.toFixed(2).replace('.', ',')}*`
        : `*R$ ${t.base_price.toFixed(2).replace('.', ',')}*`;

      text += `${idx + 1}️⃣ *${t.name}*\n`;
      if (t.characters && t.characters.length > 0) {
        text += `   ✨ Personagens: ${t.characters.join(', ')}\n`;
      }
      text += `   💰 Valor de locação: ${priceText}\n`;
      text += `   📸 Ver fotos e detalhes: ${baseUrl}/catalogo/${t.slug}\n\n`;
    });

    text += `Qual deles você achou que combina mais com a comemoração? Ficamos à disposição para montar um orçamento completo! ✨🎈`;
    return text;
  };

  const handleCopy = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Catálogo Personalizado
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedThemes.length} {selectedThemes.length === 1 ? 'tema selecionado' : 'temas selecionados'} para proposta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 print:overflow-visible print:p-8">
          {/* Cliente input - Hidden on print */}
          <div className="print:hidden space-y-2 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40">
            <label className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              Nome do Cliente (opcional para personalizar mensagem):
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Vanessa, Mamãe do Bernardo..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Printable Header */}
          <div className="hidden print:block text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-pink-600">Magia Festeira Decorações</h1>
            <p className="text-sm text-zinc-600">Catálogo Personalizado de Temas Selecionados</p>
            {clientName && (
              <p className="text-sm font-semibold text-zinc-800 mt-1">Especial para: {clientName}</p>
            )}
          </div>

          {/* Preview of Themes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 print:text-zinc-700">
              Temas Inclusos nesta Seleção
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2">
              {selectedThemes.map((theme) => {
                const withDetails = theme as ThemeWithDetails;
                const photoUrl =
                  withDetails.primary_media?.storage_path ||
                  (withDetails.media && withDetails.media[0]?.storage_path) ||
                  (theme as any).imageUrl ||
                  '/placeholder-festas.png';

                return (
                  <div
                    key={theme.id}
                    className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl items-center print:bg-white print:border-zinc-300"
                  >
                    <div className="w-16 h-20 rounded-lg overflow-hidden relative shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={photoUrl}
                        alt={theme.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {theme.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {theme.code}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        {theme.promotional_price ? (
                          <>
                            <span className="text-xs text-zinc-400 line-through">
                              R$ {theme.base_price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm font-bold text-pink-600">
                              R$ {theme.promotional_price.toFixed(2).replace('.', ',')}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            R$ {theme.base_price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                      <a
                        href={`/catalogo/${theme.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-pink-600 hover:text-pink-700 font-medium mt-1 print:hidden"
                      >
                        Abrir no catálogo
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Text Preview - Hidden on print */}
          <div className="print:hidden space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                Mensagem Formatada para WhatsApp
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar texto
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed border border-zinc-200 dark:border-zinc-700/60 max-h-48 overflow-y-auto">
              {generateWhatsAppMessage()}
            </pre>
          </div>
        </div>

        {/* Footer - Hidden on print */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
