'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, MessageSquare } from 'lucide-react';
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
              width={160}
              height={44}
              className="h-10 sm:h-11 w-auto object-contain block dark:hidden group-hover:opacity-90 transition-opacity"
              priority
            />
            <Image
              src="/logo/logo-light.png"
              alt="Magia Festeira Decorações"
              width={160}
              height={44}
              className="h-10 sm:h-11 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
              priority
            />
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/catalogo"
            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Catálogo
          </Link>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          {/* Theme Toggle Button */}
          <ThemeToggle className="ml-1" />

          <Link
            href="/admin"
            className="flex items-center gap-1.5 ml-1 sm:ml-2 px-3 py-2 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-500 rounded-xl shadow-xs transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden xs:inline">Painel</span>
            <span className="hidden sm:inline">do Operador</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
