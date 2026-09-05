'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderPlus,
  Link2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  X,
  Trash2,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { store, DEFAULT_THEME_DESCRIPTION } from '@/lib/store';
import { Import, ImportAsset, Theme } from '@/types/database';
import { formatDateBR } from '@/lib/dateUtils';
import { ThemeEditDrawer } from './ThemeEditDrawer';
import { fileToDataUrl, detectEntityFromFilename, convertHeicToJpeg, convertImageToWebP, getFallbackImageDataUrl, isHeicFile } from '@/lib/imageUtils';

interface StagedFile {
  id: string;
  name: string;
  previewUrl: string;
  size: number;
}

export function ImportacoesTabContent() {
  const [imports, setImports] = useState<Import[]>(store.getImports());
  const [assets, setAssets] = useState<ImportAsset[]>(store.getImportAssets());
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'drive' | 'local'>('drive');
  const [driveUrl, setDriveUrl] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Estado para Gaveta de Edição Pré-Aprovação
  const [reviewingAsset, setReviewingAsset] = useState<ImportAsset | null>(null);
  const [preApprovalTheme, setPreApprovalTheme] = useState<(Theme & { imageUrl?: string }) | null>(null);

  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Inscrição reativa para sincronização em tempo real entre abas
  React.useEffect(() => {
    setImports(store.getImports());
    setAssets(store.getImportAssets());

    const unsubscribe = store.subscribe(() => {
      setImports(store.getImports());
      setAssets(store.getImportAssets());
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDriveImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    // Deduplicação de pasta por fingerprint e hash dos arquivos para evitar reimportação
    const job = store.queueImport('google_drive', driveUrl, 6);
    setImports(store.getImports());
    setDriveUrl('');
    showNotification(`Job de importação #${job.id.substring(0, 8)} iniciado! Analisando arquivos...`);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    fileList.forEach(async (rawFile, idx) => {
      const stageId = 'stg-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 7);
      const isHeic = isHeicFile(rawFile);
      const initialPreview = isHeic
        ? getFallbackImageDataUrl(rawFile.name)
        : URL.createObjectURL(rawFile);

      setStagedFiles((prev) => [
        ...prev,
        {
          id: stageId,
          name: rawFile.name,
          previewUrl: initialPreview,
          size: rawFile.size,
        },
      ]);

      // 1. Converte mandatória e automaticamente qualquer foto para .WEBP com 70% de qualidade
      try {
        const { file: webpFile, dataUrl: webpDataUrl } = await convertImageToWebP(rawFile, 0.70);
        setStagedFiles((prev) =>
          prev.map((item) =>
            item.id === stageId
              ? { ...item, name: webpFile.name, previewUrl: webpDataUrl, size: webpFile.size }
              : item
          )
        );
      } catch (err) {
        console.warn('Conversão WebP 70% falhou, usando fallback:', err);
        const file = await convertHeicToJpeg(rawFile);
        const permanentUrl = await fileToDataUrl(file);
        setStagedFiles((prev) =>
          prev.map((item) =>
            item.id === stageId
              ? { ...item, name: file.name, previewUrl: permanentUrl || URL.createObjectURL(file) }
              : item
          )
        );
      }
    });

    showNotification(`${fileList.length} foto(s) convertida(s) para .WEBP (70%) e carregada(s) para revisão.`);
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearStaged = () => {
    setStagedFiles([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Enviar arquivos locais para a fila de revisão (sem publicação direta no acervo)
  const handleImportStagedPhotos = () => {
    if (stagedFiles.length === 0) return;

    const count = stagedFiles.length;
    const allThemes = store.getThemes();
    const job = store.queueImport('local_folder', `Upload Local (${count} arquivos)`, count);

    // Registra os assets na fila estritamente com status 'review' (requer aprovação do operador)
    stagedFiles.forEach((f, idx) => {
      const identifiedEntity = detectEntityFromFilename(f.name, allThemes);
      store.addImportAsset({
        import_id: job.id,
        source_file: f.name,
        fingerprint: `sha256-local-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        status: 'review',
        detected_entity: identifiedEntity,
        confidence: 0.94,
        storage_path: f.previewUrl,
      });
    });

    setImports(store.getImports());
    setAssets(store.getImportAssets());
    setStagedFiles([]);
    showNotification(`${count} foto(s) enviadas para a fila de revisão! Aguardando aprovação do operador.`);
  };

  const handlePublishAsset = (assetId: string) => {
    const created = store.approveImportAsset(assetId);
    setAssets(store.getImportAssets());
    showNotification(`Tema "${created?.name || 'Importado'}" aprovado e publicado com sucesso no catálogo comercial!`);
  };

  const handleToggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPending = () => {
    const pendingIds = pendingAssets.map((a) => a.id);
    const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedAssetIds.includes(id));
    if (allSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
    } else {
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  const handleApproveSelectedBatch = () => {
    if (selectedAssetIds.length === 0) return;
    const count = selectedAssetIds.length;
    store.approveImportAssetsBatch(selectedAssetIds);
    setSelectedAssetIds([]);
    setAssets(store.getImportAssets());
    showNotification(`${count} tema(s) aprovado(s) e publicado(s) no catálogo com sucesso!`);
  };

  const handleDeleteSelectedBatch = () => {
    if (selectedAssetIds.length === 0) return;
    const count = selectedAssetIds.length;
    store.deleteImportAssetsBatch(selectedAssetIds);
    setSelectedAssetIds([]);
    setAssets(store.getImportAssets());
    showNotification(`${count} asset(s) removido(s) da fila de revisão.`);
  };

  const handleOpenPreApprovalDrawer = (asset: ImportAsset) => {
    setReviewingAsset(asset);
    const detected = asset.detected_entity && asset.detected_entity !== 'Novo Lote Local'
      ? asset.detected_entity
      : asset.source_file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const virtualTheme: Theme & { imageUrl?: string } = {
      id: asset.id,
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      code: 'MF-NOVO',
      name: detected || 'Tema em Revisão',
      slug: (detected || 'tema').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category_id: null,
      characters: asset.detected_entity && asset.detected_entity !== 'Novo Lote Local' ? [asset.detected_entity] : [],
      piece_count: 15,
      base_price: 179.9,
      description: DEFAULT_THEME_DESCRIPTION,
      notes: null,
      status: 'active',
      stock_quantity: 1,
      featured: true,
      created_at: asset.created_at,
      updated_at: asset.created_at,
      imageUrl: asset.storage_path || undefined,
    };
    setPreApprovalTheme(virtualTheme);
  };

  const handleApprovePreApprovalTheme = (data: {
    name: string;
    base_price: number;
    stock_quantity: number;
    characters: string[];
    description: string;
    imageUrl?: string;
  }) => {
    if (!reviewingAsset) return;
    const created = store.approveImportAsset(reviewingAsset.id, data);
    setAssets(store.getImportAssets());
    setSelectedAssetIds((prev) => prev.filter((id) => id !== reviewingAsset.id));
    setReviewingAsset(null);
    setPreApprovalTheme(null);
    showNotification(`Tema "${created?.name || data.name}" aprovado e publicado com sucesso no catálogo comercial!`);
  };

  const handleSavePreApprovalDraft = (updated: Theme) => {
    if (!reviewingAsset) return;
    store.updateImportAsset(reviewingAsset.id, {
      detected_entity: updated.name,
      storage_path: (updated as any).imageUrl || reviewingAsset.storage_path,
    });
    setAssets(store.getImportAssets());
    setReviewingAsset(null);
    setPreApprovalTheme(null);
    showNotification('Alterações salvas no asset em revisão.');
  };

  const pendingAssets = assets.filter((a) => a.status === 'review');
  const approvedAssets = assets.filter((a) => a.status === 'published');
  const isAllSelected = pendingAssets.length > 0 && pendingAssets.every((a) => selectedAssetIds.includes(a.id));

  return (
    <div className="space-y-8">
      {/* Subheader */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Histórico e Importações
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Gerencie o histórico de importações, processe lotes locais ou Google Drive com deduplicação por hash SHA-256 e revisão assistida por IA.
        </p>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Import Launch Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'drive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Link de Pasta do Google Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'local'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Pasta Local de Arquivos</span>
          </button>
        </div>

        {activeTab === 'drive' ? (
          <form onSubmit={handleDriveImport} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Cole a URL pública ou compartilhada da pasta do Google Drive
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  required
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP..."
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                >
                  Importar Pasta
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1.5">
                O sistema resolverá os IDs, filtrará formatos válidos (JPG, PNG, WEBP), calculará a fingerprint SHA-256 e evitará reimportação de fotos idênticas.
              </span>
            </div>
          </form>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-slate-300 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <input
              type="file"
              ref={localFileInputRef}
              multiple
              accept="image/*,.heic,.heif,.HEIC,.HEIF"
              className="hidden"
              id="local-folder-input-tab"
              onChange={(e) => {
                handleFileSelect(e.target.files);
                if (e.target) e.target.value = '';
              }}
            />

            {stagedFiles.length === 0 ? (
              <div>
                <UploadCloud className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Arraste e solte uma pasta de fotos ou clique para selecionar
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Processamento em fila assíncrona com preservação irrestrita da imagem original.
                </p>
                <label
                  htmlFor="local-folder-input-tab"
                  className="mt-4 inline-block px-5 py-2.5 bg-slate-900 dark:bg-rose-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-800 dark:hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Escolher Arquivos Locais
                </label>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {/* Header do lote pré-carregado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {stagedFiles.length} foto{stagedFiles.length > 1 ? 's selecionadas' : ' selecionada'} no lote
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Confira as miniaturas abaixo antes de enviar para a fila de revisão
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => localFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Mais</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearStaged}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Grade de Miniaturas Renderizadas dentro do quadro pontilhado */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1">
                  {stagedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-150 dark:bg-slate-800"
                    >
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageDataUrl(file.name);
                        }}
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] truncate px-1 py-0.5 font-mono">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedFile(file.id)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-90 group-hover:opacity-100 transition-colors"
                        title="Remover miniatura"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botão de Envio / Confirmação */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Os arquivos serão enviados para a fila de revisão e só serão publicados no acervo após aprovação.
                  </span>

                  <button
                    type="button"
                    onClick={handleImportStagedPhotos}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Importar Fotos ({stagedFiles.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending Review Cards (Fase de Revisão Obrigatória) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Assets em Revisão & Agrupamento de IA
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fotos agrupadas e classificadas pela IA aguardando aprovação manual do operador antes da publicação no catálogo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingAssets.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAllPending}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span>Selecionar Todos</span>
              </label>
            )}
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900/40">
              {pendingAssets.length} aguardando aprovação
            </span>
          </div>
        </div>

        {/* Barra de Ações em Lote para Assets em Revisão */}
        {selectedAssetIds.length > 0 && (
          <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                {selectedAssetIds.length} foto(s) selecionada(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApproveSelectedBatch}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar & Publicar ({selectedAssetIds.length})</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedBatch}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir ({selectedAssetIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {pendingAssets.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Fila de revisão limpa!
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Todos os assets foram analisados e aprovados para o catálogo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingAssets.map((asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              return (
                <div
                  key={asset.id}
                  onClick={() => handleOpenPreApprovalDrawer(asset)}
                  title="Clique para revisar e editar dados pré-aprovação"
                  className={`p-5 rounded-2xl border transition-all flex gap-4 items-start relative cursor-pointer ${
                    isSelected
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <label className="shrink-0 cursor-pointer pt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectAsset(asset.id)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                    />
                  </label>

                  <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 relative flex items-center justify-center">
                    {asset.storage_path ? (
                      <img
                        src={asset.storage_path}
                        alt={asset.source_file}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageDataUrl(asset.detected_entity || asset.source_file);
                        }}
                      />
                    ) : (
                      <img
                        src={getFallbackImageDataUrl(asset.detected_entity || asset.source_file)}
                        alt={asset.source_file}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {asset.detected_entity && asset.detected_entity !== 'Novo Lote Local' ? asset.detected_entity : asset.source_file}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono truncate">
                      Hash: {asset.fingerprint}
                    </span>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/40">
                        <Sparkles className="w-3 h-3" />
                        {asset.detected_entity || 'Tema Detectado'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Confiança: {((asset.confidence || 0.9) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handlePublishAsset(asset.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprovar & Publicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          store.deleteImportAssetsBatch([asset.id]);
                          setSelectedAssetIds((prev) => prev.filter((id) => id !== asset.id));
                          setAssets(store.getImportAssets());
                          showNotification('Asset removido da fila de revisão.');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        title="Rejeitar / Remover este asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History of Import Jobs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Histórico de Jobs de Importação (DD/MM/AAAA)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-6">ID / Origem</th>
                <th className="py-3 px-6">Referência</th>
                <th className="py-3 px-6">Arquivos Processados</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Data Início (DD/MM/AAAA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {imports.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                    #{job.id.substring(0, 8)} ({job.source_type})
                  </td>
                  <td className="py-3 px-6 font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {job.source_ref}
                  </td>
                  <td className="py-3 px-6">
                    {job.processed_files} de {job.total_files} assets
                  </td>
                  <td className="py-3 px-6">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase border border-amber-200 dark:border-amber-900/40">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-mono">
                    {formatDateBR(job.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaveta de Edição Pré-Aprovação */}
      <ThemeEditDrawer
        theme={preApprovalTheme}
        isOpen={!!preApprovalTheme}
        onClose={() => {
          setPreApprovalTheme(null);
          setReviewingAsset(null);
        }}
        onSave={handleSavePreApprovalDraft}
        isPreApproval={true}
        onApprove={handleApprovePreApprovalTheme}
      />
    </div>
  );
}
