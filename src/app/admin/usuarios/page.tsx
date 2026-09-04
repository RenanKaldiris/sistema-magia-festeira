'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Check, X, Plus, UserPlus, Mail, Shield, CheckCircle2 } from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
  lastActive: string;
}

const initialOperators: Operator[] = [
  {
    id: 'op-1',
    name: 'Renan Kaldiris',
    email: 'renan@magiafesteira.com.br',
    role: 'Administrador',
    status: 'active',
    lastActive: 'Agora (Sessão Ativa)',
  },
  {
    id: 'op-2',
    name: 'Luciana Mendes',
    email: 'luciana@magiafesteira.com.br',
    role: 'Gerente',
    status: 'active',
    lastActive: 'Hoje às 11:42',
  },
  {
    id: 'op-3',
    name: 'Camila Rocha',
    email: 'camila@magiafesteira.com.br',
    role: 'Operação',
    status: 'active',
    lastActive: 'Ontem às 18:20',
  },
];

const roles = [
  {
    name: 'Administrador',
    desc: 'Acesso total irrestrito ao sistema, integrações, finanças e usuários.',
    permissions: {
      catalogo: true,
      estoque: true,
      agenda: true,
      financeiro: true,
      integracoes: true,
      usuarios: true,
    },
  },
  {
    name: 'Gerente',
    desc: 'Gestão de catálogo, estoque, agenda, clientes e relatórios.',
    permissions: {
      catalogo: true,
      estoque: true,
      agenda: true,
      financeiro: true,
      integracoes: false,
      usuarios: false,
    },
  },
  {
    name: 'Operação',
    desc: 'Operação diária de retiradas, devoluções, consulta de agenda e atendimento.',
    permissions: {
      catalogo: true,
      estoque: true,
      agenda: true,
      financeiro: false,
      integracoes: false,
      usuarios: false,
    },
  },
  {
    name: 'Catálogo',
    desc: 'Edição de fotos, variações visuais, kits e descrições do catálogo público.',
    permissions: {
      catalogo: true,
      estoque: false,
      agenda: false,
      financeiro: false,
      integracoes: false,
      usuarios: false,
    },
  },
  {
    name: 'Somente Leitura',
    desc: 'Acesso para conferência sem permissão de alteração ou exclusão.',
    permissions: {
      catalogo: true,
      estoque: false,
      agenda: false,
      financeiro: false,
      integracoes: false,
      usuarios: false,
    },
  },
];

export default function AdminUsuariosPage() {
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Operação');
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    const newOp: Operator = {
      id: 'op-' + Math.random().toString(36).substring(2, 9),
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'invited',
      lastActive: 'Convite enviado',
    };

    setOperators((prev) => [...prev, newOp]);
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewRole('Operação');

    setNotification(`Operador(a) "${newOp.name}" adicionado à equipe com sucesso!`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Equipe, Operadores & Perfis (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Gerencie os operadores com acesso ao painel da Magia Festeira e suas permissões.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Operador</span>
        </button>
      </div>

      {/* Notificação */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Lista de Operadores Ativos */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-rose-500" />
          <span>Membros da Equipe Ativa</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operators.map((op) => (
            <div
              key={op.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{op.name}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{op.email}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                  {op.role}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">{op.status === 'active' ? 'Ativo' : 'Pendente'}</strong></span>
                <span>{op.lastActive}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roles Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Matriz de Perfis de Acesso</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Direitos de leitura e escrita por módulo</p>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
          {roles.map((r, i) => (
            <div key={i} className="pt-3 first:pt-0 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Nível de Acesso
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">{r.desc}</p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {r.permissions.catalogo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Catálogo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.permissions.estoque ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Estoque</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.permissions.agenda ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Agenda</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.permissions.financeiro ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Financeiro</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-6">Perfil</th>
                <th className="py-3.5 px-4 text-center">Catálogo</th>
                <th className="py-3.5 px-4 text-center">Estoque</th>
                <th className="py-3.5 px-4 text-center">Agenda / Reservas</th>
                <th className="py-3.5 px-4 text-center">Financeiro</th>
                <th className="py-3.5 px-4 text-center">Integrações</th>
                <th className="py-3.5 px-4 text-center">Gestão Usuários</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {roles.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 dark:text-white block">{r.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">{r.desc}</span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.catalogo ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.estoque ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.agenda ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.financeiro ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.integracoes ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.usuarios ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Convidar Operador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Convidar Operador para o Painel</h3>
            <form onSubmit={handleAddOperator} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="beatriz@magiafesteira.com.br"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Perfil de Acesso *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Administrador">Administrador (Total)</option>
                  <option value="Gerente">Gerente (Operação + Estoque + Relatórios)</option>
                  <option value="Operação">Operação (Agenda + Retiradas)</option>
                  <option value="Catálogo">Catálogo (Fotos e Kits)</option>
                  <option value="Somente Leitura">Somente Leitura</option>
                </select>
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
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
