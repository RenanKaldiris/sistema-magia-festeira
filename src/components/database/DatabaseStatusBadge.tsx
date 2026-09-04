'use client';

import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Server, Cloud, ExternalLink } from 'lucide-react';

interface DBStatus {
  configured: boolean;
  connected: boolean;
  tablesReady?: boolean;
  provider?: string;
  message?: string;
  host?: string;
  database?: string;
  tableCount?: number;
  themesCount?: number;
  latencyMs?: number;
  error?: string;
}

export function DatabaseStatusBadge() {
  const [status, setStatus] = useState<DBStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        configured: false,
        connected: false,
        message: 'Não foi possível consultar a API do banco.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!status) {
    return (
      <div className="h-7 w-28 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  const isConnected = status.configured && status.connected;
  const isSupabase = status.provider?.includes('Supabase');

  const badgeText = () => {
    if (isConnected) {
      if (isSupabase && status.tablesReady === false) {
        return 'Supabase: Criar Tabelas';
      }
      return isSupabase ? 'Supabase: Conectado' : 'Hostgator: Conectado';
    }
    if (status.configured) {
      return isSupabase ? 'Supabase: Erro' : 'Hostgator: Erro';
    }
    return 'Banco: Conectar';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
          isConnected
            ? status.tablesReady === false
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            : status.configured
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
        }`}
        title="Clique para detalhes da conexão com o Banco de Dados na Nuvem"
      >
        <Database className="w-3.5 h-3.5" />
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? status.tablesReady === false
                ? 'bg-amber-500 animate-pulse'
                : 'bg-emerald-500'
              : status.configured
              ? 'bg-rose-500 animate-pulse'
              : 'bg-slate-400'
          }`}
        />
        <span className="hidden sm:inline">{badgeText()}</span>
      </button>

      {/* Modal com Informações e Instruções */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  {isSupabase ? <Cloud className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Banco de Dados na Nuvem ({status.provider || 'Nenhum'})
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">
                    Integração Oficial de Dados • Magia Festeira
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Card */}
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                isConnected
                  ? status.tablesReady === false
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                  : status.configured
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isConnected ? (
                  status.tablesReady === false ? (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {isConnected
                    ? status.tablesReady === false
                      ? 'Conectado! Falta rodar o script no SQL Editor'
                      : `Conectado ao ${status.provider} com Sucesso!`
                    : status.configured
                    ? 'Erro de Conexão'
                    : 'Aguardando Configuração'}
                </span>
              </div>
              <p className="text-xs opacity-90">{status.message}</p>
              {status.latencyMs !== undefined && (
                <div className="text-[11px] font-mono opacity-80 pt-1">
                  Latência de resposta: {status.latencyMs}ms
                  {status.tableCount !== undefined && ` • ${status.tableCount} tabelas`}
                  {status.themesCount !== undefined && ` • ${status.themesCount} temas`}
                </div>
              )}
            </div>

            {/* Instruções se as tabelas ainda precisarem ser criadas no Supabase */}
            {isSupabase && status.tablesReady === false && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  👉 Próximo Passo: Criar as Tabelas no SQL Editor do Supabase
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                  <li>No painel do Supabase, clique no menu lateral em <strong>SQL Editor</strong> (`&gt;_`).</li>
                  <li>Clique em <strong>New query</strong>.</li>
                  <li>Cole o script SQL com as 23 tabelas e clique no botão verde <strong>Run</strong>.</li>
                  <li>Depois de rodar, clique no botão <strong>Testar Conexão Agora</strong> abaixo!</li>
                </ol>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={fetchStatus}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Testar Conexão Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
