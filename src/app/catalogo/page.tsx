'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, MessageCircle, ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { store } from '@/lib/store';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function CatalogoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = store.getCategories();
  const allThemes = store.getThemes({ status: 'active' });

  const filteredThemes = useMemo(() => {
    return allThemes.filter((t) => {
      const matchesCat = selectedCategory === 'all' || t.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.characters.some((c) => c.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allThemes, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Catalog Header */}
      <section className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-950 border-b border-rose-100/60 dark:border-slate-800 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo/logo-dark.png"
              alt="Magia Festeira"
              width={190}
              height={52}
              className="h-10 sm:h-12 w-auto object-contain block dark:hidden"
              priority
            />
            <Image
              src="/logo/logo-light.png"
              alt="Magia Festeira"
              width={190}
              height={52}
              className="h-10 sm:h-12 w-auto object-contain hidden dark:block"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Catálogo de Temas & Decorações
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-xs sm:text-sm">
            Explore cenários encantadores, variações exclusivas e kits prontos para comemorar momentos inesquecíveis.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema, personagem (ex: Hulk, Solzinho) ou código..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </section>

      {/* Categories Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos os Temas ({allThemes.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Themes Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1 w-full">
        {filteredThemes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhum tema encontrado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tente ajustar seus termos de busca ou mudar a categoria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredThemes.map((theme) => {
              const details = store.getThemeById(theme.id);
              const primaryImg = details?.primary_media?.storage_path || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800';
              const categoryName = details?.category?.name || 'Decoração';
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
              const themeUrl = currentOrigin ? `${currentOrigin}/catalogo/${theme.slug}` : '';
              const whatsappMessage = encodeURIComponent(
                `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${themeUrl ? ` no catálogo: ${themeUrl}` : ''}. Gostaria de consultar datas!`
              );

              return (
                <div
                  key={theme.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all group flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={primaryImg}
                      alt={theme.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur text-white text-[11px] font-bold tracking-wide">
                        {theme.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                        {categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {theme.name}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {theme.description || 'Decoração completa com painel, cilindros e detalhes temáticos de alta qualidade.'}
                      </p>

                      {/* Characters tags */}
                      {theme.characters && theme.characters.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {theme.characters.slice(0, 3).map((char, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {char}
                            </span>
                          ))}
                          {theme.characters.length > 3 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
                              +{theme.characters.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer with Price & Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">A partir de</span>
                        <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                          R$ {theme.base_price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={getWhatsAppUrl(
                            `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${themeUrl ? ` no catálogo: ${themeUrl}` : ''}. Gostaria de consultar datas!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Falar no WhatsApp"
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-xs border border-emerald-200 dark:border-emerald-850"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/catalogo/${theme.slug}`}
                          className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>Ver Kits</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
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
          <p>© 2026 Magia Festeira. Fotos reais de decorações do nosso acervo.</p>
        </div>
      </footer>
    </div>
  );
}
