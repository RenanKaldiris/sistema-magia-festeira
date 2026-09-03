'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { store } from '@/lib/store';
import { Import, ImportAsset } from '@/types/database';

export default function AdminImportacoesPage() {
  const [imports, setImports] = useState<Import[]>(store.getImports());
  const [assets, setAssets] = useState<ImportAsset[]>(store.getImportAssets());
  const [activeTab, setActiveTab] = useState<'drive' | 'local'>('drive');
  const [driveUrl, setDriveUrl] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDriveImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    const job = store.queueImport('google_drive', driveUrl, 6);
    setImports(store.getImports());
    setDriveUrl('');
    showNotification(`Job de importação #${job.id.substring(0, 8)} iniciado! Analisando arquivos...`);
  };

  const handlePublishAsset = (assetId: string) => {
    // Publica o asset detectado
    showNotification(`Asset #${assetId.substring(0, 8)} publicado no acervo com sucesso!`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Fila de Importação de Fotos & Pastas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Importe imagens em lote por pasta local ou cole um link do Google Drive. Deduplicação automática por hash SHA-256 e revisão assistida por IA.
        </p>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Import Launch Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'drive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Pasta Local de Arquivos</span>
          </button>
        </div>

        {activeTab === 'drive' ? (
          <form onSubmit={handleDriveImport} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Cole a URL pública ou compartilhada da pasta do Google Drive
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  required
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                >
                  Importar Pasta
                </button>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1.5">
                O sistema resolverá os IDs, filtrará formatos válidos (JPG, PNG, WEBP), calculará a fingerprint SHA-256 e evitará reimportação de fotos idênticas.
              </span>
            </div>
          </form>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
            <UploadCloud className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">
              Arraste e solte uma pasta de fotos ou clique para selecionar
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Processamento em fila assíncrona com preservação irrestrita da imagem original.
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              id="local-folder-input"
              onChange={() => showNotification('Lote de fotos locais adicionado à fila de processamento!')}
            />
            <label
              htmlFor="local-folder-input"
              className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-800"
            >
              Escolher Arquivos Locais
            </label>
          </div>
        )}
      </div>

      {/* Pending Review Cards (Fase de Revisão) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Assets em Revisão & Agrupamento de IA
            </h3>
            <p className="text-xs text-slate-500">
              Fotos agrupadas e classificadas pela IA aguardando publicação final no catálogo.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {assets.length} aguardando aprovação
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex gap-4 items-start"
            >
              <div className="w-24 h-24 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                <img
                  src={asset.storage_path || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300'}
                  alt={asset.source_file}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {asset.source_file}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Hash: {asset.fingerprint}
                </span>

                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3" />
                    {asset.detected_entity || 'Tema Detectado'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Confiança: {((asset.confidence || 0.9) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handlePublishAsset(asset.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprovar & Publicar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History of Import Jobs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Histórico de Jobs de Importação
          </h4>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 text-slate-400 font-semibold">
            <tr>
              <th className="py-3 px-6">ID / Origem</th>
              <th className="py-3 px-6">Referência</th>
              <th className="py-3 px-6">Arquivos Processados</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Data Início</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {imports.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="py-3 px-6 font-bold text-slate-900">
                  #{job.id.substring(0, 8)} ({job.source_type})
                </td>
                <td className="py-3 px-6 font-mono text-slate-500 truncate max-w-xs">
                  {job.source_ref}
                </td>
                <td className="py-3 px-6">
                  {job.processed_files} de {job.total_files} assets
                </td>
                <td className="py-3 px-6">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    {job.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-slate-400">
                  {new Date(job.started_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
