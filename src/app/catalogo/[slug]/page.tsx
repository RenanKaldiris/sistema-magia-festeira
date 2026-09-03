'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
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

export default function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const theme = store.getThemeBySlug(resolvedParams.slug);

  if (!theme) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto my-auto text-center p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Tema não encontrado</h2>
          <p className="text-sm text-slate-500 mt-2">O tema solicitado não existe ou foi arquivado.</p>
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

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `http://localhost:3000/catalogo/${theme.slug}`;
  const whatsappUrl = `https://wa.me/5511999998888?text=${encodeURIComponent(
    `Olá! Tenho interesse no tema ${theme.name} (${theme.code}): ${currentUrl}`
  )}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Todos os Temas</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
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
            <div className="aspect-4/3 sm:aspect-16/10 w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group">
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
                        ? 'border-rose-600 ring-2 ring-rose-200 scale-95'
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
              <div className="mt-8 p-6 rounded-3xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">Variações Deste Tema</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {theme.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors"
                    >
                      <span className="block text-sm font-bold text-slate-900">{variant.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5 block">{variant.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Information, Kits & WhatsApp CTA (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Decoração Temática Oficial</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {theme.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xs text-slate-400 font-medium">Kits a partir de</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  R$ {theme.base_price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                {theme.description ||
                  'Cenografia completa com painel temático de altíssima qualidade, cilindros, suportes e acabamento impecável.'}
              </p>

              {/* Characters */}
              {theme.characters && theme.characters.length > 0 && (
                <div className="mt-5">
                  <span className="block text-xs font-bold text-slate-700 mb-2">Personagens e Elementos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.characters.map((char, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
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
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span>Escolha a Composição do Kit:</span>
                  </span>
                </div>

                {theme.kits && theme.kits.length > 0 ? (
                  theme.kits.map((kit) => (
                    <div
                      key={kit.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{kit.name}</span>
                        <span className="text-base font-extrabold text-rose-600">
                          R$ {kit.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{kit.description}</p>
                      
                      {kit.items && kit.items.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                          {kit.items.map((ki) => (
                            <div key={ki.item_id} className="flex items-center gap-1.5 text-[11px] text-slate-600">
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

      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Magia Festeira. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
