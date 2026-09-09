'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Layers,
  Edit3,
  Tag,
  Package,
  ExternalLink,
  UploadCloud,
  Settings,
  Sparkles,
} from 'lucide-react';
import { store } from '@/lib/store';
import { Item } from '@/types/database';
import { BatchActionBar } from '@/components/temas/BatchActionBar';
import { DeleteConfirmationModal } from '@/components/temas/DeleteConfirmationModal';
import { ItemEditDrawer } from '@/components/temas/ItemEditDrawer';
import { OrcamentoModal } from '@/components/temas/OrcamentoModal';
import { ApplyDiscountModal } from '@/components/temas/ApplyDiscountModal';
import { ManageCategoriesModal } from '@/components/temas/ManageCategoriesModal';
import { fileToDataUrl, convertImageToWebP, uploadImageToServer, getFallbackImageDataUrl } from '@/lib/imageUtils';

interface UploadedFileItem {
  id: string;
  name: string;
  previewUrl: string;
}

type SortField = 'name' | 'price' | 'status';
type SortOrder = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

export function ItensTabContent() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortState, setSortState] = useState<SortState>({ field: null, order: null });

  // Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Modals & Drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrcamentoOpen, setIsOrcamentoOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountTargetItems, setDiscountTargetItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isCustomCatalogOpen, setIsCustomCatalogOpen] = useState(false);

  // Modais de Ação: Variação e Kit
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<Item | null>(null);
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState<number>(0);
  const [variantQty, setVariantQty] = useState<number>(1);
  const [variantPhoto, setVariantPhoto] = useState<{ file?: File; previewUrl: string; name: string } | null>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedItemForKit, setSelectedItemForKit] = useState<Item | null>(null);
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [kitItemQty, setKitItemQty] = useState<number>(1);
  const [kitMode, setKitMode] = useState<'existing' | 'new'>('existing');
  const [newKitName, setNewKitName] = useState('');
  const [newKitPrice, setNewKitPrice] = useState<number>(0);

  // Form State for New Item
  const [code, setCode] = useState(`IT-00${items.length + 1}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mobília');
  const [quantityTotal, setQuantityTotal] = useState(1);
  const [unitPrice, setUnitPrice] = useState(40.0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Multi-source Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);

  // Inscrição reativa para atualizações instantâneas entre abas e mutações locais
  useEffect(() => {
    setItems(store.getItems());

    const unsubscribe = store.subscribe(() => {
      setItems(store.getItems());
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Distinct categories from existing items + defaults
  const categoriesList = useMemo(() => {
    const defaultCats = ['Mobília', 'Painéis', 'Displays', 'Cenografia', 'Pisos', 'Louças'];
    const fromItems = items.map((i) => i.category).filter(Boolean) as string[];
    return Array.from(new Set([...defaultCats, ...fromItems]));
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = items.filter((item) => {
      // Text search
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      // Status filter
      const itemStatus = item.status === 'inactive' ? 'inactive' : 'active';
      const matchesStatus =
        selectedStatus === 'all' || itemStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Tri-State Sorting: Nome, Preço ou Status
    if (sortState.field === 'name' && sortState.order) {
      list = [...list].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        return sortState.order === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.field === 'price' && sortState.order) {
      list = [...list].sort((a, b) => {
        const diff = a.unit_price - b.unit_price;
        return sortState.order === 'asc' ? diff : -diff;
      });
    } else if (sortState.field === 'status' && sortState.order) {
      list = [...list].sort((a, b) => {
        const aVal = a.status === 'inactive' ? 0 : 1;
        const bVal = b.status === 'inactive' ? 0 : 1;
        return sortState.order === 'asc' ? bVal - aVal : aVal - bVal;
      });
    }

    return list;
  }, [items, search, selectedCategory, selectedStatus, sortState]);

  // Update Master Checkbox Indeterminate state
  useEffect(() => {
    if (!masterCheckboxRef.current) return;
    const currentFilteredIds = filteredItems.map((i) => i.id);
    const selectedFilteredCount = currentFilteredIds.filter((id) =>
      selectedItemIds.includes(id)
    ).length;

    if (selectedFilteredCount === 0) {
      masterCheckboxRef.current.checked = false;
      masterCheckboxRef.current.indeterminate = false;
    } else if (selectedFilteredCount === currentFilteredIds.length) {
      masterCheckboxRef.current.checked = true;
      masterCheckboxRef.current.indeterminate = false;
    } else {
      masterCheckboxRef.current.checked = false;
      masterCheckboxRef.current.indeterminate = true;
    }
  }, [filteredItems, selectedItemIds]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredItems.map((i) => i.id);
    const allSelected = currentFilteredIds.every((id) =>
      selectedItemIds.includes(id)
    );

    if (allSelected) {
      setSelectedItemIds((prev) =>
        prev.filter((id) => !currentFilteredIds.includes(id))
      );
    } else {
      setSelectedItemIds((prev) =>
        Array.from(new Set([...prev, ...currentFilteredIds]))
      );
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Tri-State Sort Toggle
  const handleToggleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field !== field) {
        return { field, order: 'asc' };
      }
      if (prev.order === 'asc') {
        return { field, order: 'desc' };
      }
      return { field: null, order: null };
    });
  };

  // Delete Batch Confirmation
  const selectedItemNames = useMemo(() => {
    return items
      .filter((i) => selectedItemIds.includes(i.id))
      .map((i) => `${i.name} (${i.code})`);
  }, [items, selectedItemIds]);

  const handleConfirmDeleteItems = () => {
    const count = store.deleteItems(selectedItemIds);
    setItems(store.getItems());
    setSelectedItemIds([]);
    setIsDeleteModalOpen(false);
    showNotification(`${count} item(s) excluído(s) do acervo com sucesso.`);
  };

  // Promotion / Discount Handlers
  const handleOpenBatchDiscount = () => {
    const targets = items.filter((i) => selectedItemIds.includes(i.id));
    if (targets.length === 0) return;
    setDiscountTargetItems(targets);
    setIsDiscountModalOpen(true);
  };

  const handleOpenItemDiscount = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    setDiscountTargetItems([item]);
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = (type: 'percentage' | 'fixed', value: number) => {
    const targetIds = discountTargetItems.map((i) => i.id);
    store.applyDiscountToItems(targetIds, type, value);
    setItems(store.getItems());
    setIsDiscountModalOpen(false);
    showNotification(`Promoção aplicada a ${targetIds.length} item(ns) com sucesso!`);
  };

  const handleRemoveDiscount = () => {
    const targetIds = discountTargetItems.map((i) => i.id);
    store.removeDiscountFromItems(targetIds);
    setItems(store.getItems());
    setIsDiscountModalOpen(false);
    showNotification(`Promoção removida de ${targetIds.length} item(ns).`);
  };

  const handleBatchRemoveDiscount = () => {
    if (selectedItemIds.length === 0) return;
    const count = store.removeDiscountFromItems(selectedItemIds);
    setItems(store.getItems());
    setSelectedItemIds([]);
    showNotification(`Promoção removida de ${count} item(ns).`);
  };

  const handleOpenItemVariant = (item: Item) => {
    setSelectedItemForVariant(item);
    setVariantName(`${item.name} - Variação`);
    setVariantPrice(item.unit_price);
    setVariantQty(1);
    setVariantPhoto(null);
  };

  const handleCreateItemVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForVariant || !variantName.trim()) return;

    const codeSuffix = Math.floor(Math.random() * 90 + 10);
    const newItem = store.createItem({
      tenant_id: selectedItemForVariant.tenant_id,
      code: `${selectedItemForVariant.code}-V${codeSuffix}`,
      name: variantName.trim(),
      category: selectedItemForVariant.category,
      description: `Variação de ${selectedItemForVariant.name}: ${variantName.trim()}`,
      quantity_total: Number(variantQty) || 1,
      unit_price: Number(variantPrice) || selectedItemForVariant.unit_price,
      status: 'active',
    });

    if (variantPhoto) {
      if (variantPhoto.file) {
        try {
          const uploaded = await uploadImageToServer(variantPhoto.file);
          store.addMediaToEntity({
            entity_type: 'item',
            entity_id: newItem.id,
            storage_path: uploaded.url,
            original_name: uploaded.fileName,
            mime_type: 'image/webp',
            file_size: uploaded.size,
            fingerprint: `sha256-itemvar-${newItem.id.substring(0, 6)}-${Date.now()}`,
            is_primary: true,
            ai_tags: [newItem.name, selectedItemForVariant.name],
          });
        } catch {
          store.addMediaToEntity({
            entity_type: 'item',
            entity_id: newItem.id,
            storage_path: variantPhoto.previewUrl,
            original_name: variantPhoto.name,
            mime_type: 'image/webp',
            file_size: 400000,
            fingerprint: `sha256-itemvar-${newItem.id.substring(0, 6)}-${Date.now()}`,
            is_primary: true,
            ai_tags: [newItem.name, selectedItemForVariant.name],
          });
        }
      }
    }

    setSelectedItemForVariant(null);
    setVariantName('');
    setVariantPhoto(null);
    setItems(store.getItems());
    showNotification(`Variação "${variantName}" criada com sucesso!`);
  };

  const handleOpenItemKit = (item: Item) => {
    setSelectedItemForKit(item);
    const existingKits = store.getKits();
    setSelectedKitId(existingKits.length > 0 ? existingKits[0].id : '');
    setKitItemQty(1);
    setKitMode(existingKits.length > 0 ? 'existing' : 'new');
    setNewKitName(`Kit ${item.name}`);
    setNewKitPrice(item.unit_price * 2);
  };

  const handleSaveKitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForKit) return;

    if (kitMode === 'existing') {
      if (!selectedKitId) {
        showNotification('Selecione um kit existente.');
        return;
      }
      store.addItemToKit(selectedKitId, selectedItemForKit.id, Number(kitItemQty) || 1);
      showNotification(`Item "${selectedItemForKit.name}" adicionado ao kit com sucesso!`);
    } else {
      if (!newKitName.trim()) {
        showNotification('Informe o nome do novo kit.');
        return;
      }
      const allThemes = store.getThemes();
      const defaultThemeId = allThemes[0]?.id || 'e0000000-0000-0000-0000-000000000001';
      const newKit = store.createKit(
        defaultThemeId,
        newKitName.trim(),
        Number(newKitPrice) || selectedItemForKit.unit_price * 2,
        `Kit contendo ${selectedItemForKit.name}`
      );
      store.addItemToKit(newKit.id, selectedItemForKit.id, Number(kitItemQty) || 1);
      showNotification(`Novo kit "${newKit.name}" criado com sucesso!`);
    }

    setSelectedItemForKit(null);
    setSelectedKitId('');
    setNewKitName('');
  };

  // File Upload Handlers for New Item
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (e.target) {
      e.target.value = '';
    }

    files.forEach(async (file) => {
      const instantPreview = URL.createObjectURL(file);
      const itemId = 'up-' + Math.random().toString(36).substring(2, 9);
      const newItem: UploadedFileItem = {
        id: itemId,
        name: file.name,
        previewUrl: instantPreview,
      };
      setUploadedFiles((prev) => [...prev, newItem]);

      try {
        const uploaded = await uploadImageToServer(file);
        setUploadedFiles((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, name: uploaded.fileName, previewUrl: uploaded.url } : item))
        );
      } catch {
        try {
          const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(file, 0.70);
          setUploadedFiles((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, name: webpFile.name, previewUrl: webpDataUrl } : item))
          );
        } catch {
          const permanentUrl = await fileToDataUrl(file);
          if (permanentUrl) {
            setUploadedFiles((prev) =>
              prev.map((item) => (item.id === itemId ? { ...item, previewUrl: permanentUrl } : item))
            );
          }
        }
      }
    });

    showNotification(`${files.length} foto(s) convertida(s) para .WEBP (70%) e carregada(s).`);
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

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = store.createItem({
      code,
      name: name.trim(),
      category,
      quantity_total: Number(quantityTotal),
      unit_price: Number(unitPrice),
      description: description.trim() || null,
      status,
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
    });

    uploadedFiles.forEach((fileItem, idx) => {
      store.addMediaToEntity({
        entity_type: 'item',
        entity_id: created.id,
        storage_path: fileItem.previewUrl,
        original_name: fileItem.name,
        mime_type: 'image/webp',
        file_size: 350000,
        fingerprint: `sha256-item-${created.id.substring(0, 6)}-${idx}-${Date.now()}`,
        is_primary: idx === 0,
        ai_tags: [created.name, created.category || ''],
      });
    });

    setItems(store.getItems());
    setIsNewModalOpen(false);
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
            Controle de peças, móveis e displays reutilizáveis com saldo de estoque independente e ações em lote.
          </p>
        </div>

        <button
          onClick={() => {
            setCode(`IT-00${store.getItems().length + 1}`);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Item</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Unified Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código (ex: IT-001), nome, categoria ou detalhes..."
              className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos / Em linha</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 select-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas as Categorias
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsManageCatOpen(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 border border-pink-200 dark:border-pink-900/50"
            title="Gerenciar, criar, renomear e excluir categorias"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gerenciar Categorias</span>
          </button>
        </div>
      </div>

      {/* Dica de Edição Rápida */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1 md:hidden">
        <Edit3 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>
          <strong>Dica:</strong> Toque no card para abrir a <strong>Edição Rápida</strong> instantânea ou utilize os botões para kits, variações e promoções.
        </span>
      </div>

      {/* Mobile Items Cards (touch-friendly, otimizado e respirável) */}
      <div className="md:hidden space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            Nenhum item encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemMedia = store.getMediaByEntity('item', item.id);
            const primaryImg = itemMedia.find((m) => m.is_primary) || itemMedia[0];
            const isSelected = selectedItemIds.includes(item.id);
            const isInactive = item.status === 'inactive';
            const hasPromo = !!(item.promotional_price && item.promotional_price < item.unit_price);

            return (
              <div
                key={item.id}
                onClick={() => setEditingItem(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30 shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header do Card: Foto, Código, Nome, Categoria e Checkbox */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {primaryImg ? (
                        <img
                          src={primaryImg.storage_path}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = getFallbackImageDataUrl(item.name);
                          }}
                        />
                      ) : (
                        <Package2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.category || 'Geral'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate mt-1">
                        {item.name}
                      </h3>

                      {/* Preço Unitário */}
                      <div className="flex items-center gap-2 mt-1">
                        {hasPromo ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] line-through text-slate-400">
                              R$ {item.unit_price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                              R$ {item.promotional_price!.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            R$ {item.unit_price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectItem(item.id);
                    }}
                    className="p-1.5 -mr-1 -mt-1 cursor-pointer shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isSelected ? 'Desmarcar' : 'Selecionar'}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectItem(item.id)}
                      className="w-5 h-5 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-rose-500 cursor-pointer"
                      aria-label={`Selecionar ${item.name}`}
                    />
                  </div>
                </div>

                {/* Faixa intermediária: Disponibilidade e Status */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-xs">
                    <span className="text-slate-400 text-[10px] block">Estoque Disponível</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.quantity_available} de {item.quantity_total} livres
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isInactive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                    }`}
                  >
                    {isInactive ? 'Inativo' : 'Em linha'}
                  </span>
                </div>

                {/* Barra de Ações Rápidas Mobile - Paridade com Web */}
                <div
                  className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Linha 1: Edição Rápida (Gaveta) + Promoção */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Edição Rápida de dados e fotos sem sair da página"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Edição Rápida</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenItemDiscount(item, e)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        hasPromo
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                      }`}
                      title="Aplicar/Gerenciar Promoção"
                    >
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>{hasPromo ? 'Promoção (Ativa)' : 'Aplicar Promo'}</span>
                    </button>
                  </div>

                  {/* Linha 2: + Variação, + Kit, Catálogo, Completo */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenItemVariant(item)}
                      className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                      title="Adicionar Variação de peça"
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span>+ Var</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenItemKit(item)}
                      className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                      title="Adicionar ao Kit"
                    >
                      <Package className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                      <span>+ Kit</span>
                    </button>

                    <Link
                      href={`/catalogo?tab=items&search=${encodeURIComponent(item.code || item.name)}`}
                      target="_blank"
                      className="py-2 px-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                      title="Ver item no Catálogo"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Catálogo</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => router.push('/admin/itens/' + item.id)}
                      className="py-2 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                      title="Página detalhada com fotos e histórico"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>Completo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Items Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              {/* Master Checkbox */}
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  ref={masterCheckboxRef}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                  title="Selecionar todos os itens exibidos"
                />
              </th>

              {/* Nome / Código com ordenação */}
              <th
                onClick={() => handleToggleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Código / Item</span>
                  {sortState.field === 'name' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              <th className="py-3.5 px-4">Categoria</th>
              <th className="py-3.5 px-4">Estoque Total</th>
              <th className="py-3.5 px-4">Disponível</th>

              {/* Preço com ordenação */}
              <th
                onClick={() => handleToggleSort('price')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Preço Unitário</span>
                  {sortState.field === 'price' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Status com ordenação tri-state */}
              <th
                onClick={() => handleToggleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status Operacional</span>
                  {sortState.field === 'status' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  Nenhum item encontrado com os critérios de busca.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const itemMedia = store.getMediaByEntity('item', item.id);
                const primaryImg = itemMedia.find((m) => m.is_primary) || itemMedia[0];
                const isSelected = selectedItemIds.includes(item.id);
                const isInactive = item.status === 'inactive';

                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push('/admin/itens/' + item.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/30'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectItem(item.id)}
                        className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                        title={isSelected ? 'Desmarcar item' : 'Selecionar item'}
                      />
                    </td>

                    {/* Código / Nome / Foto */}
                    <td className="py-4 px-4">
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
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold mt-0.5 inline-block border border-slate-200 dark:border-slate-700">
                            {item.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.category || 'Geral'}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {item.quantity_total} un.
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        {item.quantity_available} un. livres
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {item.promotional_price ? (
                        <div>
                          <span className="text-[11px] line-through text-slate-400 block">
                            De R$ {item.unit_price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="font-extrabold text-rose-600 dark:text-rose-400">
                            Por R$ {item.promotional_price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="inline-block ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Promoção
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          R$ {item.unit_price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </td>

                    {/* Status Operacional */}
                    <td className="py-4 px-4">
                      {isInactive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Inativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Ativo / Em linha</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenItemDiscount(item, e);
                          }}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            item.promotional_price && item.promotional_price < item.unit_price
                              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Aplicar/Gerenciar Promoção"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenItemVariant(item);
                          }}
                          title="Adicionar Variação"
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenItemKit(item);
                          }}
                          title="Adicionar Kit"
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/catalogo?tab=items&search=${encodeURIComponent(item.code || item.name)}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          title="Ver no Catálogo"
                          className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/admin/itens/' + item.id);
                          }}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Editar item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedItemIds.length}
        itemTypeLabel="item(ns)"
        onClearSelection={() => setSelectedItemIds([])}
        onDelete={() => setIsDeleteModalOpen(true)}
        onApplyPromotion={handleOpenBatchDiscount}
        onRemovePromotion={handleBatchRemoveDiscount}
        onGenerateCustomCatalog={() => {
          showNotification('Selecione temas na aba Temas de Decoração para gerar o catálogo personalizado.');
        }}
      />

      {/* Modal de Promoção / Desconto em Lote ou Individual */}
      <ApplyDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        entityType="item"
        items={discountTargetItems.map((i) => ({
          id: i.id,
          name: i.name,
          code: i.code,
          basePrice: i.unit_price,
          currentPromo: i.promotional_price,
        }))}
        onApply={handleApplyDiscount}
        onRemove={handleRemoveDiscount}
      />

      {/* Orcamento Modal Expansivo para Itens */}
      <OrcamentoModal
        isOpen={isOrcamentoOpen}
        onClose={() => setIsOrcamentoOpen(false)}
        initialItemIds={selectedItemIds}
      />

      {/* Delete Confirmation Modal com Verificação EXCLUIR */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteItems}
        itemNames={selectedItemNames}
        entityLabel="Item"
      />

      {/* Drawer Lateral de Edição Rápida */}
      <ItemEditDrawer
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(updated) => {
          setItems(store.getItems());
          setEditingItem(null);
          showNotification(`Item "${updated.name}" atualizado com sucesso!`);
        }}
      />

      {/* Modal: Novo Item */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cadastrar Item Avulso de Estoque
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria *
                  </label>
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
                    <option value="Louças">Louças</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Peça *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cômoda fake, Suporte bolo ouro..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade Total *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Operacional */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Operacional *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="active">Ativo / Em linha</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material, dimensões e cuidados..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Upload Múltiplo de Fotos */}
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
                    accept="image/*,.heic,.heif,.HEIC,.HEIF"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-rose-500" />
                    <span>Do Dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen((prev) => !prev)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Link2 className="w-4 h-4 text-blue-500" />
                    <span>Google Drive</span>
                  </button>

                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.heic,.heif,.HEIC,.HEIF"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
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
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Adicionar
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
                        className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
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
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
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
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Variação para o Item */}
      {selectedItemForVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Adicionar Variação
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedItemForVariant.name} ({selectedItemForVariant.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForVariant(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItemVariant} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Variação *
                </label>
                <input
                  type="text"
                  required
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Ex: Cômoda Fake Rosa Claro, Display Hulk"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={variantQty}
                    onChange={(e) => setVariantQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload de Foto da Variação */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Foto da Variação (Arquivo)
                </label>
                <input
                  type="file"
                  ref={variantFileInputRef}
                  accept="image/*,.heic,.heif,.HEIC,.HEIF"
                  className="hidden"
                  onChange={async (e) => {
                    const rawFile = e.target.files?.[0];
                    if (rawFile) {
                      const initialPreview = URL.createObjectURL(rawFile);
                      setVariantPhoto({
                        file: rawFile,
                        previewUrl: initialPreview,
                        name: rawFile.name,
                      });
                      try {
                        const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(rawFile, 0.70);
                        setVariantPhoto({
                          file: webpFile,
                          previewUrl: webpDataUrl,
                          name: webpFile.name,
                        });
                      } catch {
                        // fallback
                      }
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => variantFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-500" />
                    <span>{variantPhoto ? 'Trocar Foto' : 'Carregar Foto'}</span>
                  </button>
                  {variantPhoto && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                      <img
                        src={variantPhoto.previewUrl}
                        alt={variantPhoto.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setVariantPhoto(null)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForVariant(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Variação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Item a um Kit */}
      {selectedItemForKit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Adicionar a Kit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedItemForKit.name} ({selectedItemForKit.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForKit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKitItem} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setKitMode('existing')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    kitMode === 'existing'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kit Existente
                </button>
                <button
                  type="button"
                  onClick={() => setKitMode('new')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    kitMode === 'new'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Criar Novo Kit
                </button>
              </div>

              {kitMode === 'existing' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selecionar Kit *
                  </label>
                  {store.getKits().length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                      Nenhum kit cadastrado ainda. Alterne para "Criar Novo Kit" acima.
                    </p>
                  ) : (
                    <select
                      required
                      value={selectedKitId}
                      onChange={(e) => setSelectedKitId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Selecione um kit...</option>
                      {store.getKits().map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} - R$ {k.price.toFixed(2).replace('.', ',')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Novo Kit *
                    </label>
                    <input
                      type="text"
                      required
                      value={newKitName}
                      onChange={(e) => setNewKitName(e.target.value)}
                      placeholder="Ex: Kit Cenografia Completo"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preço do Kit (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newKitPrice}
                      onChange={(e) => setNewKitPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade deste item no Kit *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={kitItemQty}
                  onChange={(e) => setKitItemQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForKit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Salvar no Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Categorias */}
      <ManageCategoriesModal
        isOpen={isManageCatOpen}
        onClose={() => setIsManageCatOpen(false)}
      />
    </div>
  );
}
