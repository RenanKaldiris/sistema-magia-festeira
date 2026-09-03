'use client';

import React, { useState } from 'react';
import { History, Shield, Bot, Calendar, Search, RefreshCw } from 'lucide-react';
import { store } from '@/lib/store';

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Auditoria & Observabilidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro de mutações críticas, chamadas de ferramentas da IA e sincronizações externas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAuditLogs(store.getAuditLogs());
              setAiRuns(store.getAIRuns());
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            title="Atualizar Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'audit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Logs de Auditoria ({auditLogs.length})
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'ai'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Execuções da IA & WhatsApp ({aiRuns.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por ação ou conteúdo..."
            className="w-full text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {tab === 'audit' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Ação Realizada</th>
                <th className="py-3 px-6">Entidade</th>
                <th className="py-3 px-6">Payload / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-6 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 font-bold text-rose-700">{log.action}</td>
                  <td className="py-3 px-6">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                      {log.entity} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-6 font-mono text-[11px] text-slate-600 max-w-md truncate">
                    {JSON.stringify(log.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAIRuns.map((run) => (
            <div
              key={run.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {run.channel}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    Remetente: {run.sender_id} • Modelo: {run.model}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(run.created_at).toLocaleString()}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-900">
                  📥 Input: <span className="font-normal text-slate-600">{run.input_text}</span>
                </p>
                <p className="font-semibold text-slate-900">
                  📤 Output IA:{' '}
                  <span className="font-normal text-slate-600 whitespace-pre-line">
                    {run.output_text}
                  </span>
                </p>
              </div>

              {run.tool_calls && run.tool_calls.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Ferramentas Invocadas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {run.tool_calls.map((tc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-900 text-rose-300 font-mono text-[10px]"
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
