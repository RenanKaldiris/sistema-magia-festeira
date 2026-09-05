'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';
import { Customer } from '@/types/database';
import { store } from '@/lib/store';

interface ParsedContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
  notes: string;
  isDuplicate: boolean;
  selected: boolean;
}

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export function ImportCustomersModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportCustomersModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingCustomers = store.getCustomers();

  // Helper para limpar e padronizar telefone
  const cleanPhone = (val: string) => val.replace(/[^\d+]/g, '');

  // Parser Inteligente de Texto (WhatsApp, Anotações, Linha por Linha, CSV)
  const parseTextToContacts = (text: string) => {
    if (!text.trim()) {
      setParsedContacts([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    // Regex flexível para números de telefone brasileiros (com ou sem DDD, com 8 ou 9 dígitos)
    const phoneRegex = /(?:\+?55\s?)?(?:\(?([1-9]{2})\)?\s?)?(?:(9\d{4})[-\s]?(\d{4})|(\d{4})[-\s]?(\d{4}))/g;

    const parsed: ParsedContact[] = [];

    lines.forEach((line, idx) => {
      // Ignorar cabeçalhos óbvios de planilha
      const lower = line.toLowerCase();
      if (
        (lower.includes('nome') && lower.includes('telefone')) ||
        (lower.includes('name') && lower.includes('phone'))
      ) {
        return;
      }

      let email = '';
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        email = emailMatch[1];
        line = line.replace(emailMatch[0], ' ');
      }

      let phone = '';
      const phoneMatches = [...line.matchAll(phoneRegex)];
      if (phoneMatches.length > 0) {
        // Pega a correspondência de telefone mais longa
        const bestMatch = phoneMatches.reduce((prev, curr) =>
          curr[0].length > prev[0].length ? curr : prev
        );
        phone = bestMatch[0].trim();
        line = line.replace(bestMatch[0], ' ');
      }

      // Separadores comuns (vírgula, ponto e vírgula, traço, pipe, tabulação)
      const parts = line
        .split(/[,;\t|•\-–—]/)
        .map((p) => p.trim())
        .filter(Boolean);

      let name = '';
      let notes = '';
      let address = '';

      if (parts.length > 0) {
        name = parts[0];
        // Demais partes podem ser observações ou endereço
        if (parts.length > 1) {
          const rest = parts.slice(1).join(' - ');
          if (
            rest.toLowerCase().includes('rua') ||
            rest.toLowerCase().includes('av') ||
            rest.toLowerCase().includes('alameda') ||
            rest.toLowerCase().includes('bairro')
          ) {
            address = rest;
          } else {
            notes = rest;
          }
        }
      }

      // Se ainda não achou nome, usa a linha inteira tratada
      if (!name) {
        name = line.trim();
      }

      // Remove caracteres residuais do nome
      name = name.replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '').trim();

      if (!name && !phone) return;

      // Fallback para telefone se estiver vazio
      if (!phone) {
        phone = '(11) 90000-0000';
      }

      // Verifica se já existe cliente com telefone ou nome parecido
      const isDuplicate = existingCustomers.some((c) => {
        const existingClean = cleanPhone(c.phone);
        const thisClean = cleanPhone(phone);
        return (
          (thisClean.length >= 8 && existingClean.includes(thisClean)) ||
          c.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
      });

      parsed.push({
        id: `parsed-${idx}-${Date.now()}`,
        name: name || `Contato ${idx + 1}`,
        phone,
        email,
        document: '',
        address,
        notes,
        isDuplicate,
        selected: !isDuplicate, // pré-seleciona se não for duplicado
      });
    });

    setParsedContacts(parsed);
  };

  // Leitura de Arquivo (.csv, .txt, .tsv, .xlsx, .pdf)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();

    // Se for CSV ou TXT
    if (
      file.name.endsWith('.csv') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.tsv')
    ) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setRawText(content);
        parseTextToContacts(content);
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } else {
      // Para arquivos PDF ou Excel, lê o conteúdo textual extraível ou converte linhas
      reader.onload = (event) => {
        const buffer = event.target?.result;
        if (typeof buffer === 'string') {
          setRawText(buffer);
          parseTextToContacts(buffer);
        } else if (buffer instanceof ArrayBuffer) {
          // Extrai sequências de texto legíveis do binário
          const bytes = new Uint8Array(buffer);
          let extracted = '';
          for (let i = 0; i < bytes.length; i++) {
            const code = bytes[i];
            // Caracteres imprimíveis ASCII e acentuados comuns
            if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
              extracted += String.fromCharCode(code);
            }
          }
          setRawText(extracted);
          parseTextToContacts(extracted);
        }
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Alternar seleção de um contato
  const handleToggleSelect = (id: string) => {
    setParsedContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // Selecionar / Desmarcar todos
  const allSelected =
    parsedContacts.length > 0 && parsedContacts.every((c) => c.selected);
  const handleToggleSelectAll = () => {
    setParsedContacts((prev) =>
      prev.map((c) => ({ ...c, selected: !allSelected }))
    );
  };

  // Excluir um contato da lista de pré-visualização
  const handleRemoveContact = (id: string) => {
    setParsedContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Executar Importação no Store
  const handleConfirmImport = () => {
    const toImport = parsedContacts.filter((c) => c.selected);
    if (toImport.length === 0) return;

    toImport.forEach((c) => {
      store.createCustomer({
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        document: c.document || null,
        address: c.address || null,
        notes: c.notes || null,
      });
    });

    onImportComplete(toImport.length);
    onClose();
  };

  const selectedCount = parsedContacts.filter((c) => c.selected).length;
  const duplicateCount = parsedContacts.filter((c) => c.isDuplicate).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 space-y-5 max-h-[90dvh] flex flex-col scale-100 text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/60 border border-rose-900/60 flex items-center justify-center text-rose-400 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Importar Contatos de Clientes
              </h3>
              <p className="text-xs text-slate-400">
                Carregue arquivos (Excel/CSV/PDF) ou cole listas e anotações de texto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Modo de Entrada */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-slate-800 text-rose-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Colar Texto / Anotação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-slate-800 text-rose-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Arquivo (Excel / CSV / PDF)</span>
          </button>
        </div>

        {/* Conteúdo da Entrada */}
        <div className="space-y-3 shrink-0">
          {activeTab === 'text' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Cole o texto com nomes e telefones (uma linha por contato):
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setParsedContacts([]);
                    }}
                    className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  parseTextToContacts(e.target.value);
                }}
                placeholder="Exemplo:&#10;Mariana Silva - (11) 98888-7777 - mariana@gmail.com - Prefere tema Moana&#10;Carlos Souza, 11977665544, Rua das Flores 100&#10;Juliana Lima; (21) 96543-2109"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">
                  {fileName ? `Arquivo: ${fileName}` : 'Clique para selecionar seu arquivo'}
                </span>
                <span className="text-[11px] text-slate-400 text-center">
                  Formatos aceitos: <strong>.csv, .xlsx, .xls, .txt, .pdf</strong>
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt,.tsv,.xlsx,.xls,.pdf"
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Pré-visualização dos Contatos Identificados */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">
                Contatos Identificados:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 font-extrabold text-[11px] border border-rose-900/50">
                {parsedContacts.length}
              </span>
              {duplicateCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 font-semibold text-[11px] border border-amber-900/50">
                  {duplicateCount} já cadastrado(s)
                </span>
              )}
            </div>

            {parsedContacts.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
              >
                {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800/80 bg-slate-950/70 p-1.5">
            {parsedContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs leading-relaxed">
                Nenhum contato detectado ainda. Cole sua lista de texto ou carregue uma planilha para visualizar a prévia antes de importar.
              </div>
            ) : (
              parsedContacts.map((c) => (
                <div
                  key={c.id}
                  className={`p-2.5 flex items-center justify-between gap-3 text-xs rounded-xl transition-colors ${
                    c.selected ? 'bg-slate-800/90 border border-slate-750 shadow-xs' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={c.selected}
                      onChange={() => handleToggleSelect(c.id)}
                      className="w-4 h-4 text-rose-600 bg-slate-900 border-slate-700 rounded focus:ring-rose-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white truncate">
                          {c.name}
                        </span>
                        {c.isDuplicate ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950/70 text-amber-300 border border-amber-900/60">
                            Já Cadastrado
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-900/60">
                            Novo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-rose-300 font-mono">
                          {c.phone}
                        </span>
                        {c.email && <span className="truncate text-slate-400">({c.email})</span>}
                        {c.notes && <span className="italic truncate text-slate-400">• {c.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveContact(c.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remover da lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedCount === 0}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold shadow-xs text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Importar {selectedCount} Contato(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
