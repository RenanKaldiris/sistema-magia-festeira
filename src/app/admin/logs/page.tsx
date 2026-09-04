'use client';

import React, { useState } from 'react';
import { History, Shield, Bot, Calendar, Search, RefreshCw } from 'lucide-react';
import { store } from '@/lib/store';
import { formatDateTimeBR } from '@/lib/dateUtils';

export default function AdminLogsPage() {
  const [auditLogs, setAuditLogs] = useState(store.getAuditLogs());
  const [aiRuns, setAiRuns] = useState(store.getAIRuns());
  const [tab, setTab] = useState<'audit' | 'ai'>('audit');
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter((l) => {
    const q = search.toLowerCase();
    return l.action.toLowerCase().includes(q) || l.entity.toLowerCase().includes(q);
  });

  const filteredAIRuns = aiRuns.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.input_text && r.input_text.toLowerCase().includes(q)) ||
      (r.output_text && r.output_text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Auditoria & Observabilidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Registro de mutações críticas, chamadas de ferramentas da IA e sincronizações externas (padrão DD/MM/AAAA HH:mm:ss).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAuditLogs(store.getAuditLogs());
              setAiRuns(store.getAIRuns());
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
            title="Atualizar Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'audit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Logs de Auditoria ({auditLogs.length})
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'ai'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Execuções da IA & WhatsApp ({aiRuns.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por ação ou conteúdo..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {tab === 'audit' ? (
        <>
          {/* Mobile Logs View */}
          <div className="md:hidden space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 dark:text-rose-400">{log.action}</span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                    {formatDateTimeBR(log.created_at, true)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {log.entity} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                  {JSON.stringify(log.payload)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Logs Table */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Timestamp (DD/MM/AAAA)</th>
                    <th className="py-3 px-6">Ação Realizada</th>
                    <th className="py-3 px-6">Entidade</th>
                    <th className="py-3 px-6">Payload / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-6 font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatDateTimeBR(log.created_at, true)}
                      </td>
                      <td className="py-3 px-6 font-bold text-rose-700 dark:text-rose-400">{log.action}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {log.entity} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-md truncate">
                        {JSON.stringify(log.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {filteredAIRuns.map((run) => (
            <div
              key={run.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {run.channel}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Remetente: {run.sender_id} • Modelo: {run.model}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {formatDateTimeBR(run.created_at, true)}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  📥 Input: <span className="font-normal text-slate-600 dark:text-slate-300">{run.input_text}</span>
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  📤 Output IA:{' '}
                  <span className="font-normal text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {run.output_text}
                  </span>
                </p>
              </div>

              {run.tool_calls && run.tool_calls.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">
                    Ferramentas Invocadas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {run.tool_calls.map((tc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-900 dark:bg-slate-800 text-rose-300 font-mono text-[10px] border border-slate-800 dark:border-slate-700"
                      >
                        {tc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
