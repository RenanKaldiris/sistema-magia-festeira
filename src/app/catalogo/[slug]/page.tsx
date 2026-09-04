'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { store } from '@/lib/store';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const theme = store.getThemeBySlug(resolvedParams.slug);

  if (!theme || theme.status !== 'active') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="max-w-md mx-auto my-auto text-center p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Tema Indisponível no Momento</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            O tema solicitado não está disponível no catálogo público no momento.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const [activeImage, setActiveImage] = useState<string>(
    theme.primary_media?.storage_path ||
      (theme.media.length > 0 ? theme.media[0].storage_path : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200')
  );

  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  // Formata o link oficial wa.me com mensagem contextualizada do tema
  const whatsappUrl = getWhatsAppUrl(
    `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${currentUrl ? `: ${currentUrl}` : ''}. Gostaria de consultar datas e valores!`
  );

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${theme.name} - Magia Festeira`,
          text: `Confira a decoração do tema ${theme.name} na Magia Festeira:`,
          url: window.location.href,
        });
        return;
      } catch {
        // Usuário cancelou o share nativo, fallback para clipboard
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Todos os Temas</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copiado!' : 'Compartilhar Tema'}</span>
          </button>
        </div>
      </div>

      {/* Main Theme Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Showcase & Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-4/3 sm:aspect-16/10 w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group">
              <img
                src={activeImage}
                alt={theme.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-bold">
                  {theme.code}
                </span>
                {theme.category && (
                  <span className="px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur text-white text-xs font-semibold">
                    {theme.category.name}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {theme.media && theme.media.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {theme.media.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.storage_path)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                      activeImage === img.storage_path
                        ? 'border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900 scale-95'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img.storage_path} alt={img.original_name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Variações Disponíveis */}
            {theme.variants && theme.variants.length > 0 && (
              <div className="mt-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Variações Deste Tema</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {theme.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                    >
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{variant.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{variant.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Information, Kits & WhatsApp CTA (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Decoração Temática Oficial</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {theme.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Kits a partir de</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  R$ {theme.base_price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {theme.description ||
                  'Cenografia completa com painel temático de altíssima qualidade, cilindros, suportes e acabamento impecável.'}
              </p>

              {/* Characters */}
              {theme.characters && theme.characters.length > 0 && (
                <div className="mt-5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Personagens e Elementos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.characters.map((char, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kits Disponíveis */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Escolha a Composição do Kit:</span>
                  </span>
                </div>

                {theme.kits && theme.kits.length > 0 ? (
                  theme.kits.map((kit) => (
                    <div
                      key={kit.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{kit.name}</span>
                        <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                          R$ {kit.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kit.description}</p>
                      
                      {kit.items && kit.items.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          {kit.items.map((ki) => (
                            <div key={ki.item_id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{ki.quantity}x {ki.item?.name || 'Item'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Consulte opções personalizadas com nossa equipe.</p>
                )}
              </div>
            </div>

            {/* WhatsApp Big CTA Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <h4 className="text-base font-bold">Gostou deste tema?</h4>
              <p className="text-xs text-emerald-100 mt-1">
                Fale diretamente conosco para checar a data do seu evento e receber um orçamento detalhado sem compromisso.
              </p>
              
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full py-3.5 px-6 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Tenho Interesse Neste Tema</span>
              </a>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 pb-24 sm:pb-10 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <Image
            src="/logo/logo-dark.png"
            alt="Magia Festeira"
            width={160}
            height={44}
            className="h-9 w-auto object-contain block dark:hidden opacity-85"
          />
          <Image
            src="/logo/logo-light.png"
            alt="Magia Festeira"
            width={160}
            height={44}
            className="h-9 w-auto object-contain hidden dark:block opacity-85"
          />
          <p>© 2026 Magia Festeira. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Sticky Mobile WhatsApp CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 px-4 flex items-center justify-between gap-3 shadow-xl">
        <div className="min-w-0">
          <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">A partir de</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white truncate">
            R$ {theme.base_price.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 max-w-[220px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
