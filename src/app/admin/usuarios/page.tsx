'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Lock, Check, X } from 'lucide-react';

const roles = [
  {
    name: 'Administrador',
    desc: 'Acesso total irrestrito ao sistema, integrações (Meta, Google, n8n), finanças e usuários.',
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
    desc: 'Gestão de catálogo, estoque, agenda, clientes e relatórios. Sem alteração de credenciais críticas.',
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
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Usuários & Controle de Permissões (RBAC)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Governança de acesso granular aplicada no banco de dados (Row-Level Security) e nas APIs.
        </p>
      </div>

      {/* Roles Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Matriz de Perfis de Acesso</h3>
          <p className="text-xs text-slate-400">Direitos de leitura e escrita por módulo</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {roles.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{r.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{r.desc}</span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.catalogo ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.estoque ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.agenda ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.financeiro ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.integracoes ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {r.permissions.usuarios ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
