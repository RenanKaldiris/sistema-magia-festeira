'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Palette,
  Plus,
  Search,
  Layers,
  Package,
  CheckCircle2,
  ExternalLink,
  Edit3,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Package2,
  UploadCloud,
  CheckSquare,
  Square,
  Sparkles,
  FolderPlus,
  Link2,
  Smartphone,
  Trash2,
  Star,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { store } from '@/lib/store';
import { Theme, EntityStatus } from '@/types/database';
import { ThemeEditDrawer } from '@/components/temas/ThemeEditDrawer';
import { BatchActionBar } from '@/components/temas/BatchActionBar';
import { DeleteConfirmationModal } from '@/components/temas/DeleteConfirmationModal';
import { OrcamentoModal } from '@/components/temas/OrcamentoModal';
import { ItensTabContent } from '@/components/temas/ItensTabContent';
import { ImportacoesTabContent } from '@/components/temas/ImportacoesTabContent';

type TabType = 'temas' | 'itens' | 'importacoes';
type SortField = 'name' | 'price' | 'status';
type SortOrder = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

interface UploadedFilePreview {
  file?: File;
  previewUrl: string;
  name: string;
}

function TemasManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State
  const initialTab = (searchParams.get('tab') as TabType) || 'temas';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['temas', 'itens', 'importacoes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL query param without page reload
    const url = tab === 'temas' ? '/admin/temas' : `/admin/temas?tab=${tab}`;
    window.history.pushState(null, '', url);
  };

  // Themes Data State
  const [themes, setThemes] = useState<Theme[]>([]);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Sorting State (Tri-state: asc -> desc -> null)
  const [sortState, setSortState] = useState<SortState>({ field: null, order: null });

  // Bulk Selection State
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);

  // Modals & Drawers State
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isNewThemeModalOpen, setIsNewThemeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrcamentoOpen, setIsOrcamentoOpen] = useState(false);
  const [selectedThemeForKit, setSelectedThemeForKit] = useState<Theme | null>(null);
  const [selectedThemeForVariant, setSelectedThemeForVariant] = useState<Theme | null>(null);

  // New Theme Form State
  const [name, setName] = useState('');
  const [characters, setCharacters] = useState('');
  const [basePrice, setBasePrice] = useState(179.9);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EntityStatus>('active');

  // Multi-source Upload State for New Theme
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const newThemeFileInputRef = useRef<HTMLInputElement>(null);
  const newThemeGalleryInputRef = useRef<HTMLInputElement>(null);

  // New Kit Form State
  const [kitName, setKitName] = useState('');
  const [kitPrice, setKitPrice] = useState(150);
  const [kitDesc, setKitDesc] = useState('');
  const [kitPhoto, setKitPhoto] = useState<UploadedFilePreview | null>(null);
  const kitFileInputRef = useRef<HTMLInputElement>(null);

  // New Variant Form State
  const [variantName, setVariantName] = useState('');
  const [variantDesc, setVariantDesc] = useState('');
  const [variantPhoto, setVariantPhoto] = useState<UploadedFilePreview | null>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

  // Master checkbox ref for indeterminate state
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThemes(store.getThemes());

    // Inscrição reativa para atualizações instantâneas entre abas e mutações locais
    const unsubscribe = store.subscribe(() => {
      setThemes(store.getThemes());
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered and Sorted themes
  const filteredThemes = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = themes.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.characters.some((c) => c.toLowerCase().includes(q))
      );
    });

    // Tri-State Sorting: Nome, Preço ou Status
    if (sortState.field === 'name' && sortState.order) {
      list = [...list].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        return sortState.order === 'asc' ? cmp : -cmp;
      });
    } else if (sortState.field === 'price' && sortState.order) {
      list = [...list].sort((a, b) => {
        const diff = a.base_price - b.base_price;
        return sortState.order === 'asc' ? diff : -diff;
      });
    } else if (sortState.field === 'status' && sortState.order) {
      list = [...list].sort((a, b) => {
        // 'active' comes before 'inactive' on asc
        const aVal = a.status === 'active' ? 1 : 0;
        const bVal = b.status === 'active' ? 1 : 0;
        return sortState.order === 'asc' ? bVal - aVal : aVal - bVal;
      });
    }

    return list;
  }, [themes, search, sortState]);

  // Handle column header sort toggle
  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field !== field) {
        return { field, order: 'asc' };
      }
      if (prev.order === 'asc') {
        return { field, order: 'desc' };
      }
      return { field: null, order: null }; // 3rd click: original order
    });
  };

  // Selection helpers
  const allVisibleSelected =
    filteredThemes.length > 0 &&
    filteredThemes.every((t) => selectedThemeIds.includes(t.id));
  const someVisibleSelected =
    filteredThemes.some((t) => selectedThemeIds.includes(t.id)) && !allVisibleSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      // Unselect all visible
      const visibleIds = new Set(filteredThemes.map((t) => t.id));
      setSelectedThemeIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      // Select all visible
      const visibleIds = filteredThemes.map((t) => t.id);
      setSelectedThemeIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelect = (themeId: string) => {
    setSelectedThemeIds((prev) =>
      prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
  };

  // Upload handler for New Theme (Device & Gallery)
  const handleNewThemeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setUploadedFiles((prev) => [
            ...prev,
            { file, previewUrl: dataUrl, name: file.name },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  // Google Drive Add for New Theme
  const handleAddDriveForNewTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    setUploadedFiles((prev) => [
      ...prev,
      {
        previewUrl: driveUrlInput.trim(),
        name: `Drive (${driveUrlInput.trim().substring(0, 24)}...)`,
      },
    ]);

    setDriveUrlInput('');
    setIsDriveModalOpen(false);
  };

  // Remove uploaded thumbnail
  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Batch Share helper / Quote integration
  const handleBatchShare = () => {
    setIsOrcamentoOpen(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const selected = themes.filter((t) => selectedThemeIds.includes(t.id));
      const summary = selected.map((t) => `${t.name} (${t.code}) - R$ ${t.base_price.toFixed(2)}`).join('\n');
      navigator.clipboard.writeText(summary).catch(() => {});
    }
  };

  // Bulk Delete Execution
  const handleConfirmDelete = () => {
    const count = selectedThemeIds.length;
    if (count === 0) return;

    store.deleteThemes(selectedThemeIds);
    setThemes(store.getThemes());
    setSelectedThemeIds([]);
    setIsDeleteModalOpen(false);
    showNotification(`${count} ${count > 1 ? 'temas excluídos' : 'tema excluído'} com sucesso do acervo.`);
  };

  // Create Theme
  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const charsArray = characters
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const primaryImageUrl = uploadedFiles[0]?.previewUrl;

    const created = store.createTheme({
      name,
      characters: charsArray,
      base_price: Number(basePrice),
      stock_quantity: Number(stockQuantity),
      description,
      imageUrl: primaryImageUrl,
    });

    // Se houver mais de uma foto carregada, salvar as demais no acervo
    uploadedFiles.forEach((item, idx) => {
      if (idx > 0) {
        store.addMediaToEntity({
          entity_type: 'theme',
          entity_id: created.id,
          storage_path: item.previewUrl,
          original_name: item.name,
          mime_type: 'image/jpeg',
          file_size: 500000,
          fingerprint: `sha256-${created.id.substring(0, 6)}-${idx}-${Date.now()}`,
          is_primary: false,
          ai_tags: charsArray,
        });
      }
    });

    setThemes(store.getThemes());
    setIsNewThemeModalOpen(false);
    setName('');
    setCharacters('');
    setBasePrice(179.9);
    setDescription('');
    setUploadedFiles([]);
    showNotification(`Tema "${created.name}" (${created.code}) cadastrado com sucesso!`);
  };

  // Create Kit
  const handleCreateKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThemeForKit || !kitName.trim()) return;

    const created = store.createKit(selectedThemeForKit.id, kitName, Number(kitPrice), kitDesc);
    if (kitPhoto) {
      store.addMediaToEntity({
        entity_type: 'kit',
        entity_id: created.id,
        storage_path: kitPhoto.previewUrl,
        original_name: kitPhoto.name,
        mime_type: 'image/jpeg',
        file_size: kitPhoto.file?.size || 400000,
        fingerprint: `sha256-kit-${created.id.substring(0, 6)}-${Date.now()}`,
        is_primary: true,
        ai_tags: [],
      });
    }

    setSelectedThemeForKit(null);
    setKitName('');
    setKitDesc('');
    setKitPhoto(null);
    showNotification(`Kit "${kitName}" adicionado ao tema com sucesso.`);
  };

  // Create Variant
  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThemeForVariant || !variantName.trim()) return;

    const created = store.createThemeVariant(selectedThemeForVariant.id, variantName, variantDesc);
    if (variantPhoto) {
      store.addMediaToEntity({
        entity_type: 'variant',
        entity_id: created.id,
        storage_path: variantPhoto.previewUrl,
        original_name: variantPhoto.name,
        mime_type: 'image/jpeg',
        file_size: variantPhoto.file?.size || 400000,
        fingerprint: `sha256-var-${created.id.substring(0, 6)}-${Date.now()}`,
        is_primary: true,
        ai_tags: [],
      });
    }

    setSelectedThemeForVariant(null);
    setVariantName('');
    setVariantDesc('');
    setVariantPhoto(null);
    showNotification(`Variação "${variantName}" vinculada ao tema com sucesso.`);
  };

  // When theme is edited in drawer
  const handleSaveEditedTheme = (updated: Theme) => {
    setThemes(store.getThemes());
    setEditingTheme(null);
    showNotification(`Tema "${updated.name}" atualizado com sucesso!`);
  };

  // Theme names for delete confirmation
  const selectedThemeNames = useMemo(() => {
    return themes
      .filter((t) => selectedThemeIds.includes(t.id))
      .map((t) => `${t.name} (${t.code})`);
  }, [themes, selectedThemeIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Temas, Itens e Estoque
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gestão integrada de cenários, peças avulsas de acervo e fila de importação de fotos.
        </p>
      </div>

      {/* Internal Subpage Tabs + Main Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto select-none py-0.5">
          <button
            type="button"
            onClick={() => handleTabChange('temas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'temas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Temas de Decoração</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'temas'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {themes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('itens')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'itens'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Package2 className="w-4 h-4" />
            <span>Itens & Estoque</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'itens'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {store.getItems().length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('importacoes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'importacoes'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Histórico e Importações</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'importacoes'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {store.getImportAssets().length}
            </span>
          </button>
        </div>

        {activeTab === 'temas' && (
          <button
            type="button"
            onClick={() => setIsNewThemeModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Tema</span>
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* TAB 1: TEMAS DE DECORAÇÃO */}
      {activeTab === 'temas' && (
        <div className="space-y-6">
          {/* Search Bar & Mobile Sort Selector */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código (ex: MF-0127), nome ou personagens..."
                className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Mobile quick-sort chips */}
            <div className="flex md:hidden items-center gap-2 w-full justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Ordenar:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    sortState.field === 'name'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Nome</span>
                  {sortState.field === 'name' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSort('price')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    sortState.field === 'price'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Preço</span>
                  {sortState.field === 'price' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    sortState.field === 'status'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Status</span>
                  {sortState.field === 'status' ? (
                    sortState.order === 'asc' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Helper hint for quick edit */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
            <Edit3 className="w-3.5 h-3.5 text-rose-500" />
            <span>
              <strong>Dica:</strong> Clique em qualquer linha da tabela para abrir o formulário de edição rápida de dados e fotos.
            </span>
          </div>

          {/* Mobile Themes Cards (touch-friendly) */}
          <div className="md:hidden space-y-4">
            {filteredThemes.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                Nenhum tema encontrado com o termo informado.
              </div>
            ) : (
              filteredThemes.map((theme) => {
                const details = store.getThemeById(theme.id);
                const isSelected = selectedThemeIds.includes(theme.id);

                return (
                  <div
                    key={theme.id}
                    onClick={() => setEditingTheme(theme)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img
                            src={
                              details?.primary_media?.storage_path ||
                              'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200'
                            }
                            alt={theme.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {theme.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-rose-600 text-white text-[10px] font-bold">
                              {theme.code}
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                theme.status === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {theme.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block mt-1">
                            R$ {theme.base_price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Estoque: <strong className="text-slate-700 dark:text-slate-200">{theme.stock_quantity} un.</strong> • {details?.variants.length || 0} var. • {details?.kits.length || 0} kit(s)
                          </span>
                        </div>
                      </div>

                      {/* Checkbox Touch Selection */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 cursor-pointer"
                        title={isSelected ? 'Desmarcar' : 'Selecionar'}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(theme.id)}
                          className="w-5 h-5 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                          aria-label={`Selecionar ${theme.name}`}
                        />
                      </div>
                    </div>

                    {theme.characters && theme.characters.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {theme.characters.slice(0, 4).map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Botões de Ação Touch */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThemeForVariant(theme);
                        }}
                        className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>+ Variação</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThemeForKit(theme);
                        }}
                        className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>+ Kit</span>
                      </button>
                      <Link
                        href={`/catalogo/${theme.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Catálogo</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Themes Table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    {/* Sortable: Nome / Código */}
                    <th className="py-3.5 px-6">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer select-none"
                        title="Ordenar por Nome (1º clique: A-Z, 2º clique: Z-A, 3º clique: ordem de cadastro)"
                      >
                        <span>Código / Tema</span>
                        {sortState.field === 'name' ? (
                          sortState.order === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </th>

                    <th className="py-3.5 px-6">Personagens / Tags</th>
                    <th className="py-3.5 px-6">Estoque</th>

                    {/* Sortable: Preço Base */}
                    <th className="py-3.5 px-6">
                      <button
                        type="button"
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer select-none"
                        title="Ordenar por Preço (1º clique: Menor Preço, 2º clique: Maior Preço, 3º clique: ordem de cadastro)"
                      >
                        <span>Preço Base</span>
                        {sortState.field === 'price' ? (
                          sortState.order === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </th>

                    {/* Sortable: Status Operacional */}
                    <th className="py-3.5 px-6">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer select-none"
                        title="Ordenar por Status (1º clique: Ativos, 2º clique: Inativos, 3º clique: ordem de cadastro)"
                      >
                        <span>Status</span>
                        {sortState.field === 'status' ? (
                          sortState.order === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </th>

                    <th className="py-3.5 px-6">Variações / Kits</th>

                    {/* Checkbox Mestre & Ações */}
                    <th className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span>Ações</span>
                        <label
                          className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none"
                          title="Selecionar todos os temas visíveis"
                        >
                          <input
                            type="checkbox"
                            ref={masterCheckboxRef}
                            checked={allVisibleSelected}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="sr-only">Selecionar todos</span>
                        </label>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredThemes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                        Nenhum tema encontrado com o termo pesquisado.
                      </td>
                    </tr>
                  ) : (
                    filteredThemes.map((theme) => {
                      const details = store.getThemeById(theme.id);
                      const isSelected = selectedThemeIds.includes(theme.id);

                      return (
                        <tr
                          key={theme.id}
                          onClick={() => setEditingTheme(theme)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-50/80 dark:hover:bg-rose-950/35'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                          }`}
                          title="Clique para abrir a edição rápida deste tema"
                        >
                          {/* Código / Tema */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                <img
                                  src={
                                    details?.primary_media?.storage_path ||
                                    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200'
                                  }
                                  alt={theme.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {theme.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-rose-600 text-white text-[10px] font-bold">
                                    {theme.code}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                                  {theme.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Personagens / Tags */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {theme.characters.map((c, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Estoque */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                              {theme.stock_quantity} un.
                            </span>
                          </td>

                          {/* Preço Base */}
                          <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                            R$ {theme.base_price.toFixed(2).replace('.', ',')}
                          </td>

                          {/* Status Operacional */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                theme.status === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  theme.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{theme.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                            </span>
                          </td>

                          {/* Variações / Kits */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {details?.variants.length || 0} variação(ões) • {details?.kits.length || 0} kit(s)
                              </span>
                            </div>
                          </td>

                          {/* Ações & Checkbox adjacente ao botão Ver no Catálogo */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedThemeForVariant(theme);
                                }}
                                title="Adicionar Variação"
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedThemeForKit(theme);
                                }}
                                title="Adicionar Kit"
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                <Package className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                href={`/catalogo/${theme.slug}`}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                title="Ver no Catálogo"
                                className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* Checkbox adjacente ao botão Ver no Catálogo */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="pl-1.5 flex items-center"
                                title={isSelected ? 'Desmarcar tema' : 'Selecionar tema'}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(theme.id)}
                                  className="w-4 h-4 text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-rose-500 cursor-pointer transition-all"
                                  aria-label={`Selecionar ${theme.name}`}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITENS & ESTOQUE */}
      {activeTab === 'itens' && <ItensTabContent />}

      {/* TAB 3: HISTÓRICO E IMPORTAÇÕES */}
      {activeTab === 'importacoes' && <ImportacoesTabContent />}

      {/* Floating Batch Action Bar com Gerar Orçamento */}
      <BatchActionBar
        selectedCount={selectedThemeIds.length}
        onClearSelection={() => setSelectedThemeIds([])}
        onGenerateQuote={() => setIsOrcamentoOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Orcamento Modal Expansivo */}
      <OrcamentoModal
        isOpen={isOrcamentoOpen}
        onClose={() => setIsOrcamentoOpen(false)}
        initialThemeIds={selectedThemeIds}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        themeNames={selectedThemeNames}
      />

      {/* Quick Edit Drawer com Status Ativo/Inativo e Gestão de Fotos */}
      <ThemeEditDrawer
        theme={editingTheme}
        isOpen={!!editingTheme}
        onClose={() => setEditingTheme(null)}
        onSave={handleSaveEditedTheme}
      />

      {/* Modal: Novo Tema com Upload Múltiplo (Dispositivo, Drive, Galeria) */}
      {isNewThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cadastrar Novo Tema</h3>
              <button
                type="button"
                onClick={() => setIsNewThemeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTheme} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Tema *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Safari Baby, Barbie Princesa..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Estoque Total (un.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tag ou Ref (separados por vírgula)</label>
                <input
                  type="text"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  placeholder="Ex: Homem-Aranha, Vingadores, Tardezinha, 1 Ano..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Upload Múltiplo de Fotos (Substituição de Input de URL) */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Fotos do Tema (Upload de Arquivos)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="file"
                    ref={newThemeFileInputRef}
                    onChange={handleNewThemeUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newThemeFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-rose-500" />
                    <span>Do Dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-blue-500" />
                    <span>Google Drive</span>
                  </button>

                  <input
                    type="file"
                    ref={newThemeGalleryInputRef}
                    onChange={handleNewThemeUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newThemeGalleryInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Da Galeria</span>
                  </button>
                </div>

                {/* Google Drive Sub-modal */}
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
                        className="flex-1 px-3 py-1.5 border border-blue-300 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddDriveForNewTheme}
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

                {/* Prévia Visual (Thumbnails Grid) */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Pré-visualização ({uploadedFiles.length} fotos carregadas):
                    </span>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {uploadedFiles.map((fileItem, idx) => (
                        <div
                          key={idx}
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
                            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-rose-600 text-white text-[8px] font-bold">
                              Capa
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedFile(idx)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/80 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição acolhedora dos itens do cenário..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewThemeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Adicionar Variação para {selectedThemeForVariant.name}
            </h3>
            <form onSubmit={handleCreateVariant} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Variação *</label>
                <input
                  type="text"
                  required
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Ex: Safari Aquarela, Safari Rústico"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Upload de Foto da Variação */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Foto da Variação (Arquivo)</label>
                <input
                  type="file"
                  ref={variantFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVariantPhoto({
                        file,
                        previewUrl: URL.createObjectURL(file),
                        name: file.name,
                      });
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => variantFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-500" />
                    <span>{variantPhoto ? 'Trocar Foto' : 'Carregar Foto'}</span>
                  </button>
                  {variantPhoto && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                      <img src={variantPhoto.previewUrl} alt={variantPhoto.name} className="w-full h-full object-cover" />
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

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Diferenciais Visuais</label>
                <textarea
                  rows={2}
                  value={variantDesc}
                  onChange={(e) => setVariantDesc(e.target.value)}
                  placeholder="Descrição da paleta e detalhes exclusivos..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedThemeForVariant(null);
                    setVariantPhoto(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Criar Kit Comercial ({selectedThemeForKit.name})
            </h3>
            <form onSubmit={handleCreateKit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Kit *</label>
                <input
                  type="text"
                  required
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="Ex: Kit Prata, Kit Diamante"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={kitPrice}
                  onChange={(e) => setKitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Upload de Foto do Kit */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Foto do Kit (Arquivo)</label>
                <input
                  type="file"
                  ref={kitFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setKitPhoto({
                        file,
                        previewUrl: URL.createObjectURL(file),
                        name: file.name,
                      });
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => kitFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-500" />
                    <span>{kitPhoto ? 'Trocar Foto' : 'Carregar Foto'}</span>
                  </button>
                  {kitPhoto && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                      <img src={kitPhoto.previewUrl} alt={kitPhoto.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setKitPhoto(null)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Composição do Kit</label>
                <textarea
                  rows={2}
                  value={kitDesc}
                  onChange={(e) => setKitDesc(e.target.value)}
                  placeholder="Painel + cômoda fake + trio de cilindros..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedThemeForKit(null);
                    setKitPhoto(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
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

export default function AdminTemasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          Carregando gestão de temas e estoque...
        </div>
      }
    >
      <TemasManagementContent />
    </Suspense>
  );
}
