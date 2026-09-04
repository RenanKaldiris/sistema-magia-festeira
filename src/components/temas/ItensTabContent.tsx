'use client';

import React, { useState, useRef } from 'react';
import {
  Package2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Link2,
  Smartphone,
  X,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react';
import { store } from '@/lib/store';
import { Item } from '@/types/database';

interface UploadedFileItem {
  id: string;
  name: string;
  previewUrl: string;
}

export function ItensTabContent() {
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

  // Multi-source Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadedFileItem[] = Array.from(files).map((file) => ({
      id: 'up-' + Math.random().toString(36).substring(2, 9),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadedFiles((prev) => [...prev, ...newItems]);
    e.target.value = '';
    showNotification(`${newItems.length} foto(s) carregada(s) com sucesso.`);
  };

  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    setUploadedFiles((prev) => [
      ...prev,
      {
        id: 'drive-' + Date.now(),
        name: 'Google Drive Asset',
        previewUrl: driveUrlInput.trim(),
      },
    ]);
    setDriveUrlInput('');
    setIsDriveModalOpen(false);
    showNotification('Link do Google Drive adicionado com sucesso!');
  };

  const handleRemoveUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
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

    // Anexar fotos carregadas ao item se houver
    uploadedFiles.forEach((fileItem, idx) => {
      store.addMediaToEntity({
        entity_type: 'item',
        entity_id: created.id,
        storage_path: fileItem.previewUrl,
        original_name: fileItem.name,
        mime_type: 'image/jpeg',
        file_size: 350000,
        fingerprint: `sha256-item-${created.id.substring(0, 6)}-${idx}-${Date.now()}`,
        is_primary: idx === 0,
        ai_tags: [created.name, created.category || ''],
      });
    });

    setItems(store.getItems());
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setCode(`IT-00${store.getItems().length + 1}`);
    setUploadedFiles([]);
    showNotification(`Item "${created.name}" cadastrado com sucesso!`);
  };

  return (
    <div className="space-y-6">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Itens Avulsos & Inventário
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código (ex: IT-001), nome da peça ou categoria..."
          className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Mobile Items Cards */}
      <div className="md:hidden space-y-4">
        {filteredItems.map((item) => {
          const itemMedia = store.getMediaByEntity('item', item.id);
          const primaryImg = itemMedia.find((m) => m.is_primary) || itemMedia[0];

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {primaryImg ? (
                    <img
                      src={primaryImg.storage_path}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package2 className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {item.category || 'Geral'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold mt-1 inline-block border border-slate-200 dark:border-slate-700">
                    {item.code}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Disponibilidade</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {item.quantity_available} de {item.quantity_total} livres
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Unitário</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    R$ {item.unit_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Items Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3.5 px-6">Código / Item</th>
              <th className="py-3.5 px-6">Categoria</th>
              <th className="py-3.5 px-6">Estoque Total</th>
              <th className="py-3.5 px-6">Disponível</th>
              <th className="py-3.5 px-6">Preço Unitário</th>
              <th className="py-3.5 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredItems.map((item) => {
              const itemMedia = store.getMediaByEntity('item', item.id);
              const primaryImg = itemMedia.find((m) => m.is_primary) || itemMedia[0];

              return (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {primaryImg ? (
                          <img
                            src={primaryImg.storage_path}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold mt-0.5 inline-block border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </div>
                    </div>
                  </td>

                <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                  {item.category || 'Geral'}
                </td>

                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                  {item.quantity_total} un.
                </td>

                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {item.quantity_available} un. livres
                  </span>
                </td>

                <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                  R$ {item.unit_price.toFixed(2).replace('.', ',')}
                </td>

                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Em linha</span>
                  </span>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cadastrar Item Avulso de Estoque</h3>
            <form onSubmit={handleCreateItem} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Peça *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cômoda fake, Suporte bolo ouro..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade Total *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material, dimensões e cuidados..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              {/* Upload Múltiplo de Fotos (Substituição de Entrada de URL) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Fotos do Item (Upload de Arquivos)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-rose-500" />
                    <span>Do Dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen((prev) => !prev)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-blue-500" />
                    <span>Google Drive</span>
                  </button>

                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Da Galeria</span>
                  </button>
                </div>

                {/* Sub-painel Google Drive */}
                {isDriveModalOpen && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                      Inserir Link do Google Drive:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={driveUrlInput}
                        onChange={(e) => setDriveUrlInput(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="flex-1 px-3 py-1.5 border border-blue-300 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddDrive}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDriveModalOpen(false)}
                        className="px-2 py-1.5 text-xs text-slate-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Pré-visualização com Miniaturas */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Pré-visualização ({uploadedFiles.length} foto{uploadedFiles.length > 1 ? 's' : ''}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-[10px] text-rose-500 hover:underline font-semibold"
                      >
                        Limpar todas
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {uploadedFiles.map((fileItem, idx) => (
                        <div
                          key={fileItem.id}
                          className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-100 dark:bg-slate-800 ${
                            idx === 0
                              ? 'border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/60'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <img
                            src={fileItem.previewUrl}
                            alt={fileItem.name}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Capa
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedFile(fileItem.id)}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
