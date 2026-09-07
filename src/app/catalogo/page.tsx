'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  MessageCircle,
  ArrowRight,
  Tag,
  Sparkles,
  Package2,
  Layers,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Theme, Item, Category } from '@/types/database';

type CatalogTab = 'all' | 'themes' | 'items';

export default function CatalogoPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [categories, setCategories] = useState<Category[]>(store.getCategories());
  const [allThemes, setAllThemes] = useState<Theme[]>(store.getThemes({ status: 'active' }));
  const [allItems, setAllItems] = useState<Item[]>(store.getItems().filter((i) => i.status !== 'inactive'));
  const [showPrices, setShowPrices] = useState<boolean>(store.getShowPrices());

  useEffect(() => {
    const syncData = () => {
      setCategories(store.getCategories());
      setAllThemes(store.getThemes({ status: 'active' }));
      setAllItems(store.getItems().filter((i) => i.status !== 'inactive'));
      setShowPrices(store.getShowPrices());
    };

    syncData();
    const unsubscribe = store.subscribe(syncData);
    return () => unsubscribe();
  }, []);

  // Distinct item categories
  const itemCategories = useMemo(() => {
    const defaultCats = ['Mobília', 'Painéis', 'Displays', 'Cenografia', 'Pisos', 'Louças'];
    const fromItems = allItems.map((i) => i.category).filter(Boolean) as string[];
    return Array.from(new Set([...defaultCats, ...fromItems]));
  }, [allItems]);

  // Reset category filter when changing top tab
  const handleTabChange = (tab: CatalogTab) => {
    setActiveTab(tab);
    setSelectedCategory('all');
  };

  // Filtered Themes
  const filteredThemes = useMemo(() => {
    if (activeTab === 'items') return [];
    return allThemes.filter((t) => {
      const matchesCat =
        selectedCategory === 'all' ||
        t.category_id === selectedCategory ||
        (t.category_id && categories.find((c) => c.id === t.category_id)?.name === selectedCategory);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.characters && t.characters.some((c) => c.toLowerCase().includes(q))) ||
        (t.description && t.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allThemes, activeTab, selectedCategory, searchQuery, categories]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (activeTab === 'themes') return [];
    return allItems.filter((i) => {
      const matchesCat = selectedCategory === 'all' || i.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        (i.category && i.category.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allItems, activeTab, selectedCategory, searchQuery]);

  const totalResultsCount = filteredThemes.length + filteredItems.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Catalog Hero Banner */}
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
            Catálogo Oficial de Locação & Festas
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-xs sm:text-sm">
            Explore decorações temáticas completas, kits prontos e peças exclusivas para transformar sua comemoração em uma memória inesquecível.
          </p>

          {/* Search Bar */}
          <div className="mt-7 max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema, personagem, móvel, peça ou código..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* 3 Main Navigation Buttons (Todos os Produtos / Temas / Itens) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto w-full">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`w-full h-12 flex items-center justify-center text-center px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Todos os Produtos
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('themes')}
              className={`w-full h-12 flex items-center justify-center text-center px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Temas de Decoração
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('items')}
              className={`w-full h-12 flex items-center justify-center text-center px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Itens Diversos
            </button>
          </div>
        </div>
      </section>

      {/* Subcategory Pills Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {activeTab === 'all'
              ? `Tudo (${totalResultsCount})`
              : activeTab === 'themes'
              ? `Todos os Temas (${allThemes.length})`
              : `Todos os Itens (${allItems.length})`}
          </button>

          {activeTab === 'themes' &&
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}

          {activeTab === 'items' &&
            itemCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}

          {activeTab === 'all' && (
            <>
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {itemCategories.slice(0, 3).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1 w-full">
        {totalResultsCount === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Nenhum produto encontrado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tente ajustar seus termos de busca ou mudar a categoria selecionada.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Render Themes */}
            {filteredThemes.map((theme) => {
              const details = store.getThemeById(theme.id);
              const primaryImg = details?.primary_media?.storage_path || '';
              const categoryName = details?.category?.name || 'Decoração';
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
              const themeUrl = currentOrigin ? `${currentOrigin}/catalogo/${theme.slug}` : '';

              const whatsappMsg = showPrices
                ? `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${themeUrl ? ` no catálogo: ${themeUrl}` : ''}. Gostaria de consultar disponibilidade de datas!`
                : `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${themeUrl ? ` no catálogo: ${themeUrl}` : ''}. Gostaria de solicitar um orçamento e consultar disponibilidade de datas!`;

              const hasPromo = showPrices && theme.promotional_price && theme.promotional_price < theme.base_price;

              return (
                <Link
                  key={`theme-${theme.id}`}
                  href={`/catalogo/${theme.slug}`}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all group flex flex-col cursor-pointer block"
                >
                  {/* Image Container with Zero CLS OptimizedImage */}
                  <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <OptimizedImage
                      src={primaryImg}
                      alt={theme.name}
                      aspectRatio="3/4"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur text-white text-[11px] font-bold tracking-wide">
                        {theme.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                        {categoryName}
                      </span>
                      {hasPromo && (
                        <span className="px-2 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                          Promoção
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Tema de Decoração</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {theme.name}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {theme.description || DEFAULT_THEME_DESCRIPTION}
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

                    {/* Card Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        {showPrices ? (
                          hasPromo ? (
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 line-through">
                                De R$ {theme.base_price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                                Por R$ {theme.promotional_price!.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                                A partir de
                              </span>
                              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                                R$ {theme.base_price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          )
                        ) : (
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                              Valores
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Sob Consulta
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(getWhatsAppUrl(whatsappMsg), '_blank', 'noopener,noreferrer');
                          }}
                          title="Falar no WhatsApp"
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-xs border border-emerald-200 dark:border-emerald-850 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <div className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-rose-600 group-hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors">
                          <span>{showPrices ? 'Ver Kits' : 'Consultar'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Render Items */}
            {filteredItems.map((item) => {
              const itemMedia = store.getMediaByEntity('item', item.id);
              const primaryImg = itemMedia.find((m) => m.is_primary)?.storage_path || itemMedia[0]?.storage_path || '';
              const hasPromo = showPrices && item.promotional_price && item.promotional_price < item.unit_price;

              const whatsappMsg = showPrices
                ? `Olá! Tenho interesse na locação da peça/item ${item.name} (${item.code}). Gostaria de checar a disponibilidade de estoque!`
                : `Olá! Tenho interesse na locação da peça/item ${item.name} (${item.code}). Gostaria de consultar valores e disponibilidade!`;

              return (
                <div
                  key={`item-${item.id}`}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all group flex flex-col"
                >
                  {/* Image Container with Zero CLS OptimizedImage */}
                  <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <OptimizedImage
                      src={primaryImg}
                      alt={item.name}
                      aspectRatio="3/4"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur text-white text-[11px] font-bold tracking-wide">
                        {item.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur text-white text-[11px] font-bold">
                        {item.category || 'Peça Avulsa'}
                      </span>
                      {hasPromo && (
                        <span className="px-2 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                          Promoção
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                        <Package2 className="w-3.5 h-3.5" />
                        <span>Peça Avulsa / Acervo</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description || 'Item disponível para locação avulsa ou complemento de cenografia.'}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          {item.quantity_available} livres
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        {showPrices ? (
                          hasPromo ? (
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 line-through">
                                De R$ {item.unit_price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                                Por R$ {item.promotional_price!.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                                Valor unitário
                              </span>
                              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                                R$ {item.unit_price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          )
                        ) : (
                          <div>
                            <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                              Valores
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Sob Consulta
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            window.open(getWhatsAppUrl(whatsappMsg), '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{showPrices ? 'Solicitar Peça' : 'Consultar'}</span>
                        </button>
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
