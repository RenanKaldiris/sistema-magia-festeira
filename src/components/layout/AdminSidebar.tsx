'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: any;
  matchPaths?: string[];
  subItems?: { href: string; label: string }[];
}

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
  {
    href: '/admin/temas',
    label: 'Temas, Itens e Estoque',
    icon: Palette,
    matchPaths: ['/admin/temas', '/admin/itens', '/admin/importacoes'],
    subItems: [
      { href: '/admin/temas?tab=temas', label: 'Temas de Decoração' },
      { href: '/admin/temas?tab=itens', label: 'Itens & Estoque' },
      { href: '/admin/temas?tab=importacoes', label: 'Histórico e Importações' },
    ],
  },
  { href: '/admin/agenda', label: 'Agenda & Calendário', icon: Calendar },
  { href: '/admin/locacoes', label: 'Locações & Reservas', icon: ClipboardList },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/ia', label: 'Agente de IA (WhatsApp)', icon: Bot },
  { href: '/admin/relatorios', label: 'Relatórios & Exportação', icon: BarChart3 },
  { href: '/admin/usuarios', label: 'Usuários & Perfis', icon: ShieldCheck },
  { href: '/admin/logs', label: 'Auditoria & Logs', icon: History },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Carregar preferência salva do menu lateral
    const saved = localStorage.getItem('magia_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('magia_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden border-r border-slate-800 shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/admin" onClick={onMobileClose} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center p-1 shrink-0 shadow-xs">
              <Image
                src="/logo/logo-icon-light.png"
                alt="Magia Festeira"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-sm text-white block tracking-tight">Magia Festeira</span>
              <span className="text-[10px] text-rose-400 font-medium block -mt-0.5">Painel do Operador</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPaths ? item.matchPaths.includes(pathname) : pathname === item.href;
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
                {item.subItems && isActive && (
                  <div className="pl-9 pr-2 py-0.5 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onMobileClose}
                        className="block py-1.5 px-2.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        • {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            href="/catalogo"
            target="_blank"
            onClick={onMobileClose}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Ver Catálogo Público</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Desktop Persistent Sidebar (hidden on mobile, visible on md+) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-slate-900 dark:bg-slate-950 text-slate-300 flex-col shrink-0 border-r border-slate-800 dark:border-slate-800/80 transition-all duration-300 ease-in-out relative z-30 select-none`}
      >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'
        } border-b border-slate-800 dark:border-slate-800/80`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-center p-1.5 transition-colors shadow-xs"
              title="Magia Festeira - Painel do Operador"
            >
              <Image
                src="/logo/logo-icon-light.png"
                alt="Magia Festeira"
                width={26}
                height={26}
                className="object-contain"
              />
            </Link>
          </div>
        ) : (
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center p-1 shrink-0 shadow-xs">
              <Image
                src="/logo/logo-icon-light.png"
                alt="Magia Festeira"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-white block truncate">
                Magia Festeira
              </span>
              <span className="text-[10px] text-rose-400 font-medium block -mt-0.5 truncate">
                Painel do Operador
              </span>
            </div>
          </Link>
        )}

        {/* Toggle Button in Header (visible when expanded) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            title="Recolher menu lateral (apenas desenhos)"
            aria-label="Recolher menu lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed: Floating Expand Button bar */}
      {isCollapsed && (
        <div className="py-2 px-2 flex justify-center border-b border-slate-800/60">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            title="Expandir menu lateral (mostrar nomes completos)"
            aria-label="Expandir menu lateral"
          >
            <PanelLeftOpen className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths ? item.matchPaths.includes(pathname) : pathname === item.href;

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Tooltip on hover when collapsed */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                    {item.label}
                  </span>
                )}
              </Link>

              {/* Sub-items when expanded */}
              {!isCollapsed && item.subItems && isActive && (
                <div className="pl-8 pr-1 py-0.5 space-y-1">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block py-1.5 px-2.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      • {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quick link to public catalog & Bottom Expand/Collapse */}
      <div className="p-3 border-t border-slate-800 dark:border-slate-800/80 bg-slate-950/40">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/catalogo"
              target="_blank"
              title="Ver Catálogo Público"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center transition-colors relative group"
            >
              <Sparkles className="w-4 h-4" />
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                Ver Catálogo Público
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/catalogo"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Ver Catálogo Público</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  </>
  );
}
