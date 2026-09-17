'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export function Navbar() {
  const whatsappUrl = getWhatsAppUrl('Olá! Gostaria de tirar uma dúvida sobre as decorações.');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/catalogo" className="flex items-center gap-3 group py-1">
          {/* Monograma / Logo Oficial Magia Festeira */}
          <div className="relative flex items-center">
            <Image
              src="/logo/logo-dark.png"
              alt="Magia Festeira Decorações"
              width={220}
              height={88}
              className="h-10 sm:h-12 w-auto object-contain block dark:hidden group-hover:opacity-90 transition-opacity"
              priority
            />
            <Image
              src="/logo/logo-light.png"
              alt="Magia Festeira Decorações"
              width={220}
              height={88}
              className="h-10 sm:h-12 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
              priority
            />
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/catalogo"
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Catálogo
          </Link>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/40"
            title="Acessar Painel do Administrador"
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
            <span>Painel</span>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle className="ml-0.5 sm:ml-1" />
        </nav>
      </div>
    </header>
  );
}
