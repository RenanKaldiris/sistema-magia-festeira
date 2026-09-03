'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  Plus,
  Search,
  Layers,
  Package,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { store } from '@/lib/store';
import { Theme } from '@/types/database';

export default function AdminTemasPage() {
  const [themes, setThemes] = useState(store.getThemes());
  const [search, setSearch] = useState('');
  const [isNewThemeModalOpen, setIsNewThemeModalOpen] = useState(false);
  const [selectedThemeForKit, setSelectedThemeForKit] = useState<Theme | null>(null);
  const [selectedThemeForVariant, setSelectedThemeForVariant] = useState<Theme | null>(null);

  // New Theme Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [characters, setCharacters] = useState('');
  const [basePrice, setBasePrice] = useState(180);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // New Kit Form State
  const [kitName, setKitName] = useState('');
  const [kitPrice, setKitPrice] = useState(150);
  const [kitDesc, setKitDesc] = useState('');

  // New Variant Form State
  const [variantName, setVariantName] = useState('');
  const [variantDesc, setVariantDesc] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredThemes = themes.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.characters.some((c) => c.toLowerCase().includes(q))
    );
  });

  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const charsArray = characters
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const created = store.createTheme({
      name,
      characters: charsArray,
      base_price: Number(basePrice),
      stock_quantity: Number(stockQuantity),
      description,
      imageUrl: imageUrl.trim() || undefined,
    });

    setThemes(store.getThemes());
    setIsNewThemeModalOpen(false);
    setName('');
    setCharacters('');
    setDescription('');
    setImageUrl('');
    showNotification(`Tema "${created.name}" (${created.code}) cadastrado com sucesso!`);
  };

  const handleCreateKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThemeForKit || !kitName.trim()) return;

    store.createKit(selectedThemeForKit.id, kitName, Number(kitPrice), kitDesc);
    setSelectedThemeForKit(null);
    setKitName('');
    setKitDesc('');
    showNotification(`Kit "${kitName}" adicionado ao tema.`);
  };

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThemeForVariant || !variantName.trim()) return;

    store.createThemeVariant(selectedThemeForVariant.id, variantName, variantDesc);
    setSelectedThemeForVariant(null);
    setVariantName('');
    setVariantDesc('');
    showNotification(`Variação "${variantName}" vinculada ao tema com sucesso.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestão de Temas & Acervo</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadastre decorações, variações de estilo, kits comerciais e fotos em alta resolução.
          </p>
        </div>

        <button
          onClick={() => setIsNewThemeModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Tema</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código (ex: MF-0127), nome ou personagens..."
          className="w-full text-xs sm:text-sm focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Themes Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-6">Código / Tema</th>
                <th className="py-3.5 px-6">Personagens / Tags</th>
                <th className="py-3.5 px-6">Estoque</th>
                <th className="py-3.5 px-6">Preço Base</th>
                <th className="py-3.5 px-6">Variações / Kits</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredThemes.map((theme) => {
                const details = store.getThemeById(theme.id);
                return (
                  <tr key={theme.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={details?.primary_media?.storage_path || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200'}
                            alt={theme.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{theme.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                              {theme.code}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{theme.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {theme.characters.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {theme.stock_quantity} un.
                      </span>
                    </td>

                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      R$ {theme.base_price.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">
                          {details?.variants.length || 0} variação(ões) • {details?.kits.length || 0} kit(s)
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedThemeForVariant(theme)}
                          title="Adicionar Variação"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedThemeForKit(theme)}
                          title="Adicionar Kit"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/catalogo/${theme.slug}`}
                          target="_blank"
                          title="Ver no Catálogo"
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Tema */}
      {isNewThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Novo Tema</h3>
            <form onSubmit={handleCreateTheme} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Tema *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Safari Baby, Barbie Princesa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Total (unidades) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Personagens (separados por vírgula)</label>
                <input
                  type="text"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  placeholder="Ex: Leãozinho, Girafa, Elefantinho"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL da Foto Principal (Capa)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição acolhedora dos itens do cenário..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewThemeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Salvar Tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Variação */}
      {selectedThemeForVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Adicionar Variação para {selectedThemeForVariant.name}
            </h3>
            <form onSubmit={handleCreateVariant} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Variação *</label>
                <input
                  type="text"
                  required
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Ex: Safari Aquarela, Safari Rústico"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diferenciais Visuais</label>
                <textarea
                  rows={2}
                  value={variantDesc}
                  onChange={(e) => setVariantDesc(e.target.value)}
                  placeholder="Descrição da paleta e detalhes exclusivos..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedThemeForVariant(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Salvar Variação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Kit */}
      {selectedThemeForKit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Criar Kit Comercial ({selectedThemeForKit.name})
            </h3>
            <form onSubmit={handleCreateKit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Kit *</label>
                <input
                  type="text"
                  required
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="Ex: Kit Prata, Kit Diamante"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={kitPrice}
                  onChange={(e) => setKitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Composição do Kit</label>
                <textarea
                  rows={2}
                  value={kitDesc}
                  onChange={(e) => setKitDesc(e.target.value)}
                  placeholder="Painel + cômoda fake + trio de cilindros..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedThemeForKit(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Salvar Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
