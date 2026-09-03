'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, LayoutDashboard, MessageSquare } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/catalogo" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Magia Festeira
            </span>
            <span className="block text-[10px] font-medium tracking-widest text-slate-400 uppercase -mt-1">
              Decorações & Locação
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/catalogo"
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Catálogo
          </Link>
          <a
            href="https://wa.me/5511999998888?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20as%20decora%C3%A7%C3%B5es."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Falar no WhatsApp</span>
          </a>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 ml-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel do Operador</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
