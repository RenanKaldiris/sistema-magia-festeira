'use client';

import React, { useState } from 'react';
import { Package2, Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { store } from '@/lib/store';
import { Item } from '@/types/database';

export default function AdminItensPage() {
  const [items, setItems] = useState<Item[]>(store.getItems());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState(`IT-00${items.length + 1}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mobília');
  const [quantityTotal, setQuantityTotal] = useState(1);
  const [unitPrice, setUnitPrice] = useState(40.0);
  const [description, setDescription] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = store.createItem({
      code,
      name,
      category,
      quantity_total: Number(quantityTotal),
      unit_price: Number(unitPrice),
      description,
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
    });

    setItems(store.getItems());
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setCode(`IT-00${store.getItems().length + 1}`);
    showNotification(`Item "${created.name}" cadastrado com sucesso!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Itens Avulsos & Inventário</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de peças, móveis e displays reutilizáveis com saldo de estoque independente.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Item</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código (ex: IT-001), nome da peça ou categoria..."
          className="w-full text-xs sm:text-sm focus:outline-none"
        />
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3.5 px-6">Código / Item</th>
              <th className="py-3.5 px-6">Categoria</th>
              <th className="py-3.5 px-6">Estoque Total</th>
              <th className="py-3.5 px-6">Disponível</th>
              <th className="py-3.5 px-6">Preço Unitário</th>
              <th className="py-3.5 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold mt-0.5 inline-block">
                      {item.code}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-6 text-slate-600 font-medium">
                  {item.category || 'Geral'}
                </td>

                <td className="py-4 px-6 font-bold text-slate-900">
                  {item.quantity_total} un.
                </td>

                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.quantity_available} un. livres
                  </span>
                </td>

                <td className="py-4 px-6 font-extrabold text-slate-900">
                  R$ {item.unit_price.toFixed(2).replace('.', ',')}
                </td>

                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Em linha</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Item Avulso de Estoque</h3>
            <form onSubmit={handleCreateItem} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Mobília">Mobília</option>
                    <option value="Painéis">Painéis</option>
                    <option value="Displays">Displays</option>
                    <option value="Cenografia">Cenografia</option>
                    <option value="Pisos">Pisos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Peça *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cômoda fake, Suporte bolo ouro..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade Total *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material, dimensões e cuidados..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
