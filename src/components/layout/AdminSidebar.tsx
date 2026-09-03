'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Palette,
  Package2,
  Calendar,
  ClipboardList,
  Users,
  UploadCloud,
  Bot,
  BarChart3,
  ShieldCheck,
  History,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/temas', label: 'Temas & Acervo', icon: Palette },
  { href: '/admin/itens', label: 'Itens & Estoque', icon: Package2 },
  { href: '/admin/agenda', label: 'Agenda & Calendário', icon: Calendar },
  { href: '/admin/locacoes', label: 'Locações & Reservas', icon: ClipboardList },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/importacoes', label: 'Fila de Importação', icon: UploadCloud },
  { href: '/admin/ia', label: 'Agente de IA (WhatsApp)', icon: Bot },
  { href: '/admin/relatorios', label: 'Relatórios & Exportação', icon: BarChart3 },
  { href: '/admin/usuarios', label: 'Usuários & Perfis', icon: ShieldCheck },
  { href: '/admin/logs', label: 'Auditoria & Logs', icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Magia Festeira</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Painel do Operador</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick link to public catalog */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <Link
          href="/catalogo"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-rose-300 hover:bg-slate-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Ver Catálogo Público</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
