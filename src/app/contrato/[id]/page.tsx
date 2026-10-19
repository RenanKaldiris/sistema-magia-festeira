'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckSquare,
  Square,
  ArrowLeft,
} from 'lucide-react';
import { formatDateBR } from '@/lib/dateUtils';
import Link from 'next/link';

interface ContractData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerDocument: string | null;
  customerRg: string | null;
  customerAddress: string | null;
  customerNeighborhood: string | null;
  customerCity: string | null;
  customerCep: string | null;

  eventName: string | null;
  eventDate: string;
  eventTime: string | null;
  deliveryLocation: string | null;

  themeName: string;
  pickupDate: string;
  pickupTime: string | null;
  returnDate: string;
  returnTime: string | null;

  total: number;
  paid: number;
  balance: number;
  paymentMethod: string | null;
  paymentTerms: string | null;
  notes: string | null;

  items: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
  }>;
}

export default function ContratoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const rentalId = resolvedParams.id;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        // Tenta buscar diretamente pela rota pública do contrato
        const res = await fetch(`/api/v1/contrato/${rentalId}`, {
          cache: 'no-store',
        });
        const json = await res.json();

        if (json.success && json.data) {
          setContract(json.data);
          return;
        }

        // Fallback secundário
        const fallbackRes = await fetch(`/api/v1/rentals?limit=100`, {
          headers: {
            'x-api-key': 'mf_live_sec_magiafesteira2026',
          },
        });
        const fallbackJson = await fallbackRes.json();
        const found = fallbackJson.data?.find((r: any) => r.id === rentalId || r.id?.endsWith(rentalId));

        if (!found) {
          throw new Error('Contrato de locação não encontrado.');
        }

        const orderNum = found.id.slice(-4);
        const theme = found.theme_name || found.theme?.name || 'Tema Magia Festeira';

        let itemsList: Array<{ description: string; quantity?: number }> = [];
        if (found.lines && found.lines.length > 0) {
          itemsList = found.lines.map((l: any) => ({
            description: l.description,
            quantity: l.quantity,
          }));
        } else {
          itemsList = [
            { description: '1 arco de ferro desmontável', quantity: 1 },
            { description: '3 cilindros P,M,G', quantity: 1 },
            { description: `Capas para o painel e cilindros no tema ${theme}`, quantity: 1 },
            { description: '1 boleira', quantity: 1 },
            { description: '2 doceiras redondas', quantity: 1 },
            { description: '1 doceira retangular', quantity: 1 },
            { description: '1 vaso', quantity: 1 },
            { description: '1 buchinho', quantity: 1 },
            { description: '1 porta balões de chão ( sem os balões)', quantity: 1 },
          ];
        }

        let eventTime = '13h às 20h';
        let paymentTerms = 'PIX - 50% na reserva e 50% na retirada';
        if (found.notes) {
          const timeMatch = found.notes.match(/Horário:\s*([^\n]+)/i);
          if (timeMatch) eventTime = timeMatch[1].trim();

          const payTermsMatch = found.notes.match(/Condição de Pagamento:\s*([^\n]+)/i);
          if (payTermsMatch) paymentTerms = payTermsMatch[1].trim();
        }

        setContract({
          id: found.id,
          orderNumber: orderNum,
          customerName: found.customer_name || found.customer?.name || 'Cliente Magia Festeira',
          customerPhone: found.customer_phone || found.customer?.phone || '',
          customerDocument: found.customer?.document || null,
          customerRg: null,
          customerAddress: found.customer?.address || found.delivery_location || null,
          customerNeighborhood: null,
          customerCity: 'São Paulo',
          customerCep: null,

          eventName: `Aniversário de ${found.customer_name?.split(' ')[0] || 'Cliente'}`,
          eventDate: found.event_date || found.pickup_date,
          eventTime,
          deliveryLocation: found.delivery_location || found.customer?.address || 'Salão de Festas / Domicílio',

          themeName: theme,
          pickupDate: found.pickup_date,
          pickupTime: '10:00',
          returnDate: found.return_date,
          returnTime: 'Até às 17h00',

          total: Number(found.total) || 0,
          paid: Number(found.paid) || 0,
          balance: Number(found.balance) || 0,
          paymentMethod: found.payment_method || 'PIX',
          paymentTerms,
          notes: found.notes || null,
          items: itemsList,
        });
      } catch (err: unknown) {
        setError((err as Error).message || 'Erro ao carregar contrato.');
      } finally {
        setLoading(false);
      }
    }

    if (rentalId) {
      loadContract();
    }
  }, [rentalId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Carregando contrato oficial da Magia Festeira...
          </p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contrato Não Localizado</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error || 'Não foi possível encontrar os dados desta locação.'}
          </p>
          <Link
            href="/admin/locacoes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Sistema</span>
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = (contract.customerPhone || '').replace(/\D/g, '');
  const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(
    `Olá, ${contract.customerName}! 🎈 Segue seu Contrato Oficial de Locação da Magia Festeira para a festa do tema *${contract.themeName}*:\n\n📄 Acesse seu contrato em PDF aqui:\n${typeof window !== 'undefined' ? window.location.href : ''}\n\nQualquer dúvida estamos à disposição!`
  )}`;

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 py-4 sm:py-8 px-2 sm:px-4 font-sans text-slate-800 dark:text-slate-200 print:p-0 print:bg-white print:text-black">
      {/* Estilos específicos para impressão e geração de PDF */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .contract-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 8mm 10mm !important;
          }
          @page {
            size: A4;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="no-print max-w-4xl mx-auto mb-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-md border border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
            MF
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Contrato Oficial de Locação #{contract.orderNumber}
            </h1>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {contract.themeName} • {contract.customerName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>

          {contract.customerPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>
      </div>

      {/* FOLHA DO CONTRATO (FOLHA A4 COM FORMATO OFICIAL) */}
      <div className="contract-sheet max-w-4xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 space-y-5">
        
        {/* Cabeçalho Oficial */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 uppercase">
              MAGIA FESTEIRA
            </h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              LOCAÇÃO PARA DECORAÇÕES DE FESTAS E EVENTOS
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              CNPJ: 51.492.381/0001-90 | WhatsApp Oficial: (11) 97782-3876
            </p>
            <p className="text-[11px] text-slate-600">
              Endereço: Rua Adolina, 102 - Vila Mazzei, São Paulo - SP
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-900">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Contrato Nº</span>
              <span className="text-base font-mono font-black text-rose-600">
                LOC-2026-#{contract.orderNumber}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Emissão: {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* 1. DADOS DO CONTRATANTE */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
          <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
            1. DADOS DO(A) CONTRATANTE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1">
            <div>
              <span className="font-bold text-slate-600">Nome: </span>
              <span className="font-semibold text-slate-900">{contract.customerName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">WhatsApp / Celular: </span>
              <span className="font-semibold text-slate-900">{contract.customerPhone}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">CPF: </span>
              <span className="font-semibold text-slate-900">{contract.customerDocument || '—'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600">RG: </span>
              <span className="font-semibold text-slate-900">{contract.customerRg || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-600">Endereço Residencial: </span>
              <span className="font-semibold text-slate-900">
                {contract.customerAddress || 'Rua Adolina, Vila Mazzei'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. DADOS DO EVENTO & CRONOGRAMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Bloco Evento */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
              2. DADOS DO EVENTO
            </span>
            <div className="pt-1 space-y-1">
              <div>
                <span className="font-bold text-slate-600">Evento: </span>
                <span className="font-semibold">{contract.eventName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Data da Festa: </span>
                <span className="font-bold text-rose-600">{formatDateBR(contract.eventDate)}</span>
                <span className="text-slate-500 ml-1">({contract.eventTime})</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Local da Festa: </span>
                <span className="font-semibold">{contract.deliveryLocation}</span>
              </div>
            </div>
          </div>

          {/* Bloco Cronograma de Retirada e Devolução */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
              3. RETIRADA E DEVOLUÇÃO
            </span>
            <div className="pt-1 space-y-1">
              <div>
                <span className="font-bold text-slate-600">Data da Retirada: </span>
                <span className="font-bold text-slate-900">{formatDateBR(contract.pickupDate)}</span>
                <span className="text-slate-500 ml-1">({contract.pickupTime})</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Data da Devolução: </span>
                <span className="font-bold text-rose-600">{formatDateBR(contract.returnDate)}</span>
                <span className="text-slate-500 ml-1 font-semibold">({contract.returnTime})</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span className="font-bold">Endereço de Coleta: </span>
                <span>Rua Adolina, 102 - Vila Mazzei, São Paulo - SP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. DADOS DA LOCAÇÃO & VALORES */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
            4. DADOS DA LOCAÇÃO & VALORES
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tema Principal</span>
              <span className="text-xs font-black text-slate-900 truncate block">{contract.themeName}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Total</span>
              <span className="text-xs font-black text-slate-900 block">
                R$ {contract.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Sinal Pago</span>
              <span className="text-xs font-black text-emerald-600 block">
                R$ {contract.paid.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Saldo na Retirada</span>
              <span className="text-xs font-black text-rose-600 block">
                R$ {contract.balance.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row justify-between gap-1 text-[11px] text-slate-700">
            <div>
              <span className="font-bold">Forma / Condição de Pagamento: </span>
              <span className="font-semibold">{contract.paymentTerms}</span>
            </div>
            <div className="text-rose-700 font-bold">
              * A retirada dos itens fica condicionada à quitação integral do saldo restante.
            </div>
          </div>
        </div>

        {/* 5. ITENS LOCADOS (O PADRÃO OFICIAL COM AS 9 LINHAS INDIVIDUAIS) */}
        <div className="p-4 rounded-xl border border-slate-300 space-y-2">
          <span className="font-black text-slate-900 uppercase tracking-wider text-xs block border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <span>5. ITENS LOCADOS (ACERVO CONTRATADO)</span>
            <span className="text-[10px] font-normal text-slate-500 uppercase">
              Conferir cada item no ato da entrega e devolução
            </span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-xs">
            {contract.items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 py-0.5 border-b border-slate-100 last:border-b-0">
                <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs shrink-0 flex items-center justify-center text-[9px] text-slate-400">
                  ☐
                </span>
                <span className="font-medium text-slate-900">
                  {it.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. OBSERVAÇÕES */}
        {contract.notes && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 uppercase text-[10px] block">
              6. OBSERVAÇÕES ESPECÍFICAS
            </span>
            <p className="text-slate-700 whitespace-pre-wrap">{contract.notes}</p>
          </div>
        )}

        {/* 7. CONDIÇÕES GERAIS, CONSERVAÇÃO E RESPONSABILIDADES */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-[10.5px] leading-relaxed text-slate-700 space-y-1.5">
          <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-1">
            7. CONDIÇÕES GERAIS, CONSERVAÇÃO E MULTAS
          </span>
          <ul className="list-disc pl-4 space-y-1 pt-0.5">
            <li>
              <strong>CUIDADOS COM O ACERVO:</strong> É estritamente proibido o uso de cola quente, fita crepe, durex ou adesivos diretamente nos tecidos, painéis e cilindros. Proibido exposição à chuva, umidade e velas acesas próximas às peças.
            </li>
            <li>
              <strong>CONDIÇÕES DE RETORNO:</strong> Todos os itens locados devem retornar à empresa inteiros, limpos e sem qualquer defeito em suas embalagens originais.
            </li>
            <li>
              <strong>TAXA DE HIGIENIZAÇÃO:</strong> Será cobrada a taxa de <strong>R$ 10,00</strong> por cada item entregue sujo.
            </li>
            <li>
              <strong>DEVOLUÇÃO & ATRASOS:</strong> A devolução deverá ser realizada impreterivelmente na data estipulada até o horário limite, no endereço: Rua Adolina, 102 - Vila Mazzei - SP. Não havendo devolução no período, será cobrada multa de <strong>R$ 60,00 por dia de atraso</strong>.
            </li>
            <li>
              <strong>POLÍTICA DE CANCELAMENTO:</strong> Em caso de desistência pelo cliente com menos de 15 dias da data da festa, o sinal pago na reserva não será restituído para cobrir custos de indisponibilização da agenda.
            </li>
            <li>
              <strong>ITENS ESQUECIDOS:</strong> O cliente está ciente dos itens retirados; qualquer item de sua propriedade esquecido na empresa será de sua inteira responsabilidade.
            </li>
            <li>
              <strong>ACEITE DIGITAL:</strong> O envio deste documento por meio eletrônico (WhatsApp) somado ao pagamento do sinal constitui aceite pleno de todas as cláusulas deste contrato.
            </li>
          </ul>
        </div>

        {/* Data e Assinaturas */}
        <div className="pt-6 text-xs space-y-6">
          <div className="text-right text-slate-600 font-medium">
            São Paulo, {new Date().toLocaleDateString('pt-BR')}
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center space-y-1">
              <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                {contract.customerName}
              </div>
              <span className="text-[10px] text-slate-500 uppercase block">
                CONTRATANTE • CPF: {contract.customerDocument || '—'}
              </span>
            </div>

            <div className="text-center space-y-1">
              <div className="border-t border-slate-800 pt-1.5 font-bold text-slate-900">
                Magia Festeira Decorações
              </div>
              <span className="text-[10px] text-slate-500 uppercase block">
                LOCADORA • CNPJ: 51.492.381/0001-90
              </span>
            </div>
          </div>

          {/* Checklist de Balcão */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-around text-center text-xs font-bold text-slate-800">
            <span className="inline-flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-slate-500" />
              <span>Conferido na Saída</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-slate-500" />
              <span>Retirado / Entregue</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-slate-500" />
              <span>Devolvido sem Avarias</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
