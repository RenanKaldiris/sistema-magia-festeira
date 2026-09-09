'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  CheckCircle2,
  Sparkles,
  Package,
  Layers,
  ShieldAlert,
  Maximize2,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { getWhatsAppUrl, formatWhatsAppDisplay } from '@/lib/whatsapp';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [theme, setTheme] = useState(store.getThemeBySlug(resolvedParams.slug));
  const [showPrices, setShowPrices] = useState<boolean>(store.getShowPrices());
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const sync = () => {
      setTheme(store.getThemeBySlug(resolvedParams.slug));
      setShowPrices(store.getShowPrices());
    };
    sync();
    const unsubscribe = store.subscribe(sync);
    return () => unsubscribe();
  }, [resolvedParams.slug]);

  const defaultImage =
    theme?.primary_media?.storage_path ||
    (theme?.media && theme.media.length > 0 ? theme.media[0].storage_path : '');

  const [activeImage, setActiveImage] = useState<string>(defaultImage);
  const [copied, setCopied] = useState(false);

  // Sync activeImage if theme loads or media updates
  useEffect(() => {
    if (defaultImage) {
      const belongsToTheme = theme?.media?.some((m) => m.storage_path === activeImage);
      if (!activeImage || !belongsToTheme) {
        setActiveImage(defaultImage);
      }
    }
  }, [defaultImage, theme?.media]);

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

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const hasPromo = showPrices && theme.promotional_price && theme.promotional_price < theme.base_price;

  const activeDescription = useMemo(() => {
    if (!theme) return '';
    if (!selectedVariantId) {
      return theme.description?.trim() || '';
    }
    if (selectedVariantId.startsWith('kit-')) {
      const kitId = selectedVariantId.replace('kit-', '');
      const foundKit = theme.kits?.find((k) => k.id === kitId);
      return foundKit?.description?.trim() || '';
    }
    if (selectedVariantId.startsWith('var-')) {
      const varId = selectedVariantId.replace('var-', '');
      const foundVar = theme.variants?.find((v) => v.id === varId);
      return foundVar?.description?.trim() || '';
    }
    return '';
  }, [selectedVariantId, theme]);

  // Fotos mapeadas dinamicamente para o tema e versão/kit selecionado
  const currentPhotos = useMemo(() => {
    if (!theme) return [];

    const baseMedia = (theme.media || []).map((m) => ({
      id: m.id,
      url: m.storage_path,
      name: m.original_name,
      variantKey: 'default',
    }));

    if (selectedVariantId?.startsWith('var-')) {
      const varId = selectedVariantId.replace('var-', '');
      const foundVar = theme.variants?.find((v) => v.id === varId);
      const varMedia = store.getMediaByEntity('variant', varId);
      const list: { id: string; url: string; name: string; variantKey: string }[] = [];

      if (foundVar?.image_url) {
        list.push({
          id: `var-img-${foundVar.id}`,
          url: foundVar.image_url,
          name: foundVar.name,
          variantKey: selectedVariantId,
        });
      }
      varMedia.forEach((m) => {
        if (!list.some((existing) => existing.url === m.storage_path)) {
          list.push({
            id: m.id,
            url: m.storage_path,
            name: m.original_name || foundVar?.name || 'Variante',
            variantKey: selectedVariantId,
          });
        }
      });

      if (list.length > 0) return list;
      return baseMedia;
    }

    if (selectedVariantId?.startsWith('kit-')) {
      const kitId = selectedVariantId.replace('kit-', '');
      const foundKit = theme.kits?.find((k) => k.id === kitId);
      const kitMedia = store.getMediaByEntity('kit', kitId);
      const list: { id: string; url: string; name: string; variantKey: string }[] = [];

      if (foundKit?.image_url) {
        list.push({
          id: `kit-img-${foundKit.id}`,
          url: foundKit.image_url,
          name: foundKit.name,
          variantKey: selectedVariantId,
        });
      }
      kitMedia.forEach((m) => {
        if (!list.some((existing) => existing.url === m.storage_path)) {
          list.push({
            id: m.id,
            url: m.storage_path,
            name: m.original_name || foundKit?.name || 'Kit',
            variantKey: selectedVariantId,
          });
        }
      });

      if (list.length > 0) return list;
      return baseMedia;
    }

    const all = [...baseMedia];
    theme.variants?.forEach((v) => {
      if (v.image_url && !all.some((m) => m.url === v.image_url)) {
        all.push({
          id: `var-${v.id}`,
          url: v.image_url,
          name: v.name,
          variantKey: `var-${v.id}`,
        });
      }
    });
    theme.kits?.forEach((k) => {
      if (k.image_url && !all.some((m) => m.url === k.image_url)) {
        all.push({
          id: `kit-${k.id}`,
          url: k.image_url,
          name: k.name,
          variantKey: `kit-${k.id}`,
        });
      }
    });
    return all;
  }, [theme, selectedVariantId]);

  const selectedKit = selectedVariantId?.startsWith('kit-')
    ? theme.kits?.find((k) => `kit-${k.id}` === selectedVariantId)
    : null;
  const selectedVariant = selectedVariantId?.startsWith('var-')
    ? theme.variants?.find((v) => `var-${v.id}` === selectedVariantId)
    : null;
  const selectionInfo = selectedKit
    ? ` (Kit: ${selectedKit.name})`
    : selectedVariant
    ? ` (Variação: ${selectedVariant.name})`
    : '';

  const whatsappMsg = showPrices
    ? `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${selectionInfo}${currentUrl ? `: ${currentUrl}` : ''}. Gostaria de consultar datas e disponibilidade!`
    : `Olá! Tenho interesse no tema ${theme.name} (${theme.code})${selectionInfo}${currentUrl ? `: ${currentUrl}` : ''}. Gostaria de solicitar um orçamento e consultar disponibilidade de datas!`;

  // Gera link wa.me oficial com mensagem contextualizada
  const whatsappUrl = getWhatsAppUrl(whatsappMsg);

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
        // Usuário cancelou share nativo, fallback para clipboard
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copiado!' : 'Compartilhar Tema'}</span>
          </button>
        </div>
      </div>

      {/* Main Theme Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Showcase & Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Photo Showcase - Formato Retrato / Proporção Natural da Foto Original */}
            <div className="w-full flex justify-center">
              <div
                className="relative w-fit max-w-full rounded-3xl overflow-hidden bg-slate-900/5 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-md group transition-all duration-300 flex items-center justify-center cursor-pointer"
                onClick={() => activeImage && setIsLightboxOpen(true)}
                title="Clique para ver foto ampliada"
              >
                {activeImage ? (
                  <div className="relative flex items-center justify-center">
                    {/* Fundo ambiente sutil para preencher suavemente caso a imagem tenha proporções especiais */}
                    <img
                      src={activeImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 dark:opacity-35 scale-110 pointer-events-none select-none"
                    />
                    {/* Foto principal inteira sem corte, ajustada na proporção original retrato */}
                    <img
                      src={activeImage}
                      alt={theme.name}
                      className="relative z-10 w-auto h-auto max-h-[560px] sm:max-h-[660px] max-w-full object-contain rounded-3xl block mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  </div>
                ) : (
                  <div className="w-[300px] sm:w-[420px] aspect-[3/4] flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <Sparkles className="w-12 h-12 mb-2 stroke-1 text-slate-500" />
                    <span className="text-sm font-medium">Sem imagem cadastrada</span>
                  </div>
                )}

                {/* Badges de Código e Categoria */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-bold shadow-xs">
                    {theme.code}
                  </span>
                  {theme.category && (
                    <span className="px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur text-white text-xs font-semibold shadow-xs">
                      {theme.category.name}
                    </span>
                  )}
                  {hasPromo && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold uppercase shadow-sm">
                      Promoção
                    </span>
                  )}
                </div>

                {/* Botão de Zoom / Ampliar */}
                {activeImage && (
                  <div className="absolute bottom-4 right-4 z-20 opacity-90 group-hover:opacity-100 transition-opacity bg-slate-900/70 hover:bg-slate-900 backdrop-blur text-white px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Ampliar Foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Strip positioned below main photo - Sincronizado com Versão/Kit Selecionado */}
            {currentPhotos && currentPhotos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-1 justify-center sm:justify-start max-w-full">
                {currentPhotos.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setActiveImage(img.url);
                    }}
                    className={`relative w-20 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 ${
                      activeImage === img.url
                        ? 'border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900 scale-100 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
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
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(`var-${variant.id}`);
                        if (variant.image_url) {
                          setActiveImage(variant.image_url);
                        } else {
                          const varMedia = store.getMediaByEntity('variant', variant.id);
                          if (varMedia.length > 0 && varMedia[0].storage_path) {
                            setActiveImage(varMedia[0].storage_path);
                          } else {
                            setActiveImage(defaultImage);
                          }
                        }
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedVariantId === `var-${variant.id}`
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/40 ring-2 ring-rose-300 dark:ring-rose-800'
                          : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 hover:border-rose-300'
                      }`}
                    >
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{variant.name}</span>
                      {variant.description && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{variant.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Information, Kits & WhatsApp CTA (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {theme.name}
              </h1>

              {/* Price Display with Promotion and Visibility Toggle */}
              {showPrices ? (
                hasPromo ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                        De R$ {theme.base_price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                        Promoção Ativa
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Por apenas</span>
                      <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                        R$ {theme.promotional_price!.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Kits a partir de</span>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      R$ {theme.base_price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )
              ) : (
                <div className="mt-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Valores do Tema</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                    Sob Consulta
                  </span>
                </div>
              )}

              {/* Dynamic Legenda / Itens Inclusos */}
              {activeDescription ? (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 transition-all duration-200">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                    Legenda / Itens Inclusos:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                    {activeDescription}
                  </p>
                </div>
              ) : null}

              {/* Interactive Kit / Variable Switcher Buttons */}
              <div className="mt-5 space-y-2">
                <span className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Visualizar Kit ou Versão:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(null);
                      setActiveImage(defaultImage);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedVariantId === null
                        ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-900'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Foto Principal (Padrão)
                  </button>

                  {theme.kits &&
                    theme.kits.map((kit) => {
                      const isSelected = selectedVariantId === `kit-${kit.id}`;
                      return (
                        <button
                          key={kit.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(`kit-${kit.id}`);
                            if (kit.image_url) {
                              setActiveImage(kit.image_url);
                            } else {
                              const kitMedia = store.getMediaByEntity('kit', kit.id);
                              if (kitMedia.length > 0 && kitMedia[0].storage_path) {
                                setActiveImage(kitMedia[0].storage_path);
                              } else {
                                setActiveImage(defaultImage);
                              }
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-900'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{kit.name}</span>
                          {showPrices && (
                            <span
                              className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              R$ {kit.price.toFixed(0)}
                            </span>
                          )}
                        </button>
                      );
                    })}

                  {theme.variants &&
                    theme.variants.map((variant) => {
                      const isSelected = selectedVariantId === `var-${variant.id}`;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(`var-${variant.id}`);
                            if (variant.image_url) {
                              setActiveImage(variant.image_url);
                            } else {
                              const varMedia = store.getMediaByEntity('variant', variant.id);
                              if (varMedia.length > 0 && varMedia[0].storage_path) {
                                setActiveImage(varMedia[0].storage_path);
                              } else {
                                setActiveImage(defaultImage);
                              }
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-900'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{variant.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Characters */}
              {theme.characters && theme.characters.length > 0 && (
                <div className="mt-5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Personagens e Elementos:
                  </span>
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

              {/* Kits Disponíveis List */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Kits e Composições Disponíveis:</span>
                  </span>
                </div>

                {theme.kits && theme.kits.length > 0 ? (
                  theme.kits.map((kit) => (
                    <div
                      key={kit.id}
                      onClick={() => {
                        setSelectedVariantId(`kit-${kit.id}`);
                        if (kit.image_url) {
                          setActiveImage(kit.image_url);
                        } else {
                          setActiveImage(defaultImage);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedVariantId === `kit-${kit.id}`
                          ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/30 ring-2 ring-rose-300 dark:ring-rose-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{kit.name}</span>
                        {showPrices && (
                          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                            R$ {kit.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
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
                className="mt-4 w-full py-3.5 px-6 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>{showPrices ? 'Tenho Interesse Neste Tema' : 'Consultar Disponibilidade'}</span>
              </a>

              <p className="mt-2.5 text-center text-[11px] text-emerald-100 font-medium">
                WhatsApp Oficial: {formatWhatsAppDisplay()}
              </p>
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
          <div className="flex items-center gap-4 text-xs font-medium mt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Atendimento Oficial WhatsApp {formatWhatsAppDisplay()}</span>
            </a>
          </div>
          <p>© 2026 Magia Festeira. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Sticky Mobile WhatsApp CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 px-4 flex items-center justify-between gap-3 shadow-xl">
        <div className="min-w-0">
          {showPrices ? (
            hasPromo ? (
              <div>
                <span className="block text-[9px] uppercase font-semibold text-rose-500">Promoção</span>
                <span className="text-base font-extrabold text-rose-600 truncate">
                  R$ {theme.promotional_price!.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <div>
                <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">A partir de</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  R$ {theme.base_price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )
          ) : (
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-400">Valores</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                Sob Consulta
              </span>
            </div>
          )}
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 max-w-[220px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{showPrices ? 'Falar no WhatsApp' : 'Consultar'}</span>
        </a>
      </div>

      {/* Lightbox Modal para visualização da foto na proporção 100% original */}
      {isLightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer z-50"
            title="Fechar (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-[95vw] max-h-[88vh] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage}
              alt={theme.name}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="mt-3 text-center text-white/80 text-xs sm:text-sm font-medium">
            <span>{theme.name}</span> • <span className="text-white/50">{theme.code}</span>
          </div>
        </div>
      )}
    </div>
  );
}
