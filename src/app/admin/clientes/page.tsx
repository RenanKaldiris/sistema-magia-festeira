'use client';

import React, { useState } from 'react';
import { Users, Phone, Mail, FileText, Calendar } from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminClientesPage() {
  const customers = store.getCustomers();
  const rentals = store.getRentals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cadastro de Clientes</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Base de contatos, histórico de locações anteriores e anotações de preferências.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((c) => {
          const customerRentals = rentals.filter((r) => r.customer_id === c.id);
          return (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                <span className="text-xs text-slate-400">Cliente Cadastrado</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.notes && (
                  <div className="flex items-start gap-2 pt-1">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="italic text-slate-500">{c.notes}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total de Locações:</span>
                <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {customerRentals.length} evento(s)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
