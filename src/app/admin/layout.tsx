'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { DatabaseStatusBadge } from '@/components/database/DatabaseStatusBadge';
import { UserCircle, Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Retrátil & Drawer Mobile */}
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none transition-colors"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <Image
                src="/logo/logo-icon-dark.png"
                alt="Magia Festeira"
                width={14}
                height={14}
                className="object-contain block dark:hidden"
              />
              <Image
                src="/logo/logo-icon-light.png"
                alt="Magia Festeira"
                width={14}
                height={14}
                className="object-contain hidden dark:block"
              />
              <span>Tenant: Magia Festeira</span>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">
              Ambiente de Operação Oficial
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Database Status Badge (PostgreSQL Hostgator) */}
            <DatabaseStatusBadge />

            {/* Theme Toggle (Modo Claro / Escuro) */}
            <ThemeToggle />

            {/* Operador Profile */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 pl-2 border-l border-slate-200 dark:border-slate-800">
              <UserCircle className="w-6 h-6 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="hidden md:inline">Operador (Administrador)</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-100 dark:bg-slate-950 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
