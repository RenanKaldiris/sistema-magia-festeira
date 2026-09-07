'use client';

import React, { useState, useMemo } from 'react';
import { Tag, Percent, DollarSign, X, Check, ArrowRight, RotateCcw } from 'lucide-react';

interface DiscountTargetItem {
  id: string;
  name: string;
  code?: string;
  basePrice: number;
  currentPromo?: number | null;
}

interface ApplyDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'theme' | 'item';
  items: DiscountTargetItem[];
  onApply: (type: 'percentage' | 'fixed', value: number) => void;
  onRemove: () => void;
}

export function ApplyDiscountModal({
  isOpen,
  onClose,
  entityType,
  items,
  onApply,
  onRemove,
}: ApplyDiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValueStr, setDiscountValueStr] = useState<string>('20');

  const discountValue = useMemo(() => {
    if (!discountValueStr || !discountValueStr.trim()) return 0;
    const clean = discountValueStr.replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }, [discountValueStr]);

  const hasAnyActivePromo = useMemo(() => {
    return items.some((i) => i.currentPromo !== null && i.currentPromo !== undefined);
  }, [items]);

  // Simulação dos novos preços com o desconto selecionado
  const simulation = useMemo(() => {
    return items.map((item) => {
      let promoPrice: number;
      if (discountType === 'percentage') {
        const discount = item.basePrice * (Math.max(0, Math.min(100, discountValue)) / 100);
        promoPrice = Math.max(0, Math.round((item.basePrice - discount) * 100) / 100);
      } else {
        promoPrice = Math.max(0, Math.round((item.basePrice - Math.max(0, discountValue)) * 100) / 100);
      }
      const savings = Math.max(0, Math.round((item.basePrice - promoPrice) * 100) / 100);
      const effectivePercent = item.basePrice > 0 ? Math.round((savings / item.basePrice) * 100) : 0;

      return {
        ...item,
        newPrice: promoPrice,
        savings,
        effectivePercent,
      };
    });
  }, [items, discountType, discountValue]);

  if (!isOpen || items.length === 0) return null;

  const quickPercentages = [10, 15, 20, 30, 50];
  const quickFixed = [10, 20, 30, 50];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountValue <= 0) return;
    onApply(discountType, discountValue);
    onClose();
  };

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  const entityLabel = entityType === 'theme' ? 'tema(s)' : 'item(ns)';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Aplicar Promoção
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configurar desconto para {items.length} {entityLabel} selecionado(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Discount Type Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tipo de Desconto
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('percentage');
                  if (discountValue > 100) setDiscountValueStr('20');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  discountType === 'percentage'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Percentual (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  discountType === 'fixed'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Valor Fixo (R$)</span>
              </button>
            </div>
          </div>

          {/* Value Input and Quick Pills */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {discountType === 'percentage' ? 'Porcentagem de Desconto' : 'Valor de Desconto em R$'}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={discountValueStr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  let val = e.target.value;
                  if (discountValueStr === '0' && val.length > 1 && !val.includes('.') && !val.includes(',')) {
                    val = val.replace(/^0+/, '');
                  }
                  if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === '') {
                    setDiscountValueStr(val);
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder={discountType === 'percentage' ? 'ex: 20 ou 39.48' : 'ex: 25.00'}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                {discountType === 'percentage' ? '%' : 'R$'}
              </span>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {discountType === 'percentage'
                ? quickPercentages.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountValueStr(String(pct))}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        discountValue === pct
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))
                : quickFixed.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscountValueStr(String(val))}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        discountValue === val
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      -R$ {val}
                    </button>
                  ))}
            </div>
          </div>

          {/* Live Preview of Price Changes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Simulação de Preços (De ➔ Por)
            </span>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {simulation.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-750 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {item.name}
                    </span>
                    {item.code && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="line-through text-slate-400 text-xs">
                      R$ {item.basePrice.toFixed(2).replace('.', ',')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                      R$ {item.newPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                      -{item.effectivePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {hasAnyActivePromo ? (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Remover desconto e voltar ao preço original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Remover Promoção</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Desconto</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
