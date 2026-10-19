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
  Sparkles,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        // Busca na rota pública oficial do contrato
        const res = await fetch(`/api/v1/contrato/${rentalId}`, {
          cache: 'no-store',
        });
        const json = await res.json();

        if (json.success && json.data) {
          setContract(json.data);
          return;
        }

        // Fallback resiliente
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

          eventName: `Aniversário de ${(found.customer_name || 'Cliente').split(' ')[0]}`,
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyFullText = () => {
    if (!contract) return;
    const itemsText = contract.items.map((it) => `• ${it.quantity || 1}x ${it.description}`).join('\n');
    const fullText = `MAGIA FESTEIRA - LOCAÇÃO PARA DECORAÇÕES DE FESTAS
CNPJ: 51.492.381/0001-90 | WhatsApp Oficial: (11) 97782-3876
Endereço: Rua Adolina, 102 - Vila Mazzei, São Paulo - SP

----------------------------------------------------------------------------------------------------
CONTRATO DE LOCAÇÃO DE KITS E MOBILIÁRIO PARA FESTAS
Contrato nº LOC-2026-#${contract.orderNumber} | Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}
----------------------------------------------------------------------------------------------------

CLÁUSULA 1ª – DA QUALIFICAÇÃO DAS PARTES
• LOCADORA: MAGIA FESTEIRA, inscrita no CNPJ sob o nº 51.492.381/0001-90, com sede na Rua Adolina, 102 - Vila Mazzei, São Paulo - SP, WhatsApp Oficial (11) 97782-3876.
• CONTRATANTE: ${contract.customerName}, CPF: ${contract.customerDocument || '—'}, RG: ${contract.customerRg || '—'}, Celular/WhatsApp: ${contract.customerPhone}, residente e domiciliado(a) em: ${contract.customerAddress || 'São Paulo - SP'}.

CLÁUSULA 2ª – DO EVENTO E LOCAL DA CELEBRAÇÃO
• Evento / Celebração: ${contract.eventName || 'Festa Comemorativa'}
• Data do Evento: ${formatDateBR(contract.eventDate)} | Horário da Festa: ${contract.eventTime || 'A combinar'}
• Local da Realização: ${contract.deliveryLocation || 'Domicílio do Contratante'}

CLÁUSULA 3ª – DO CRONOGRAMA DE RETIRADA E DEVOLUÇÃO
• Data da Retirada: ${formatDateBR(contract.pickupDate)} | Horário: ${contract.pickupTime || '10:00'}
• Data da Devolução: ${formatDateBR(contract.returnDate)} | Horário Limite: ${contract.returnTime || 'Até às 17h00'}
• Endereço de Coleta e Devolução: Rua Adolina, 102 - Vila Mazzei, São Paulo - SP.

CLÁUSULA 4ª – DO VALOR E CONDIÇÕES DE PAGAMENTO
• Tema Principal: ${contract.themeName}
• Valor Total Contratado: R$ ${contract.total.toFixed(2).replace('.', ',')}
• Sinal Pago na Reserva: R$ ${contract.paid.toFixed(2).replace('.', ',')}
• Saldo Devedor Restante: R$ ${contract.balance.toFixed(2).replace('.', ',')}
• Condição de Pagamento: ${contract.paymentTerms || contract.paymentMethod?.toUpperCase() || 'PIX'}
*A liberação dos itens para saída fica condicionada à quitação integral do saldo devedor até o momento da retirada.*

CLÁUSULA 5ª – DO ACERVO LOCADO (ITENS CONTRATADOS)
${itemsText}

CLÁUSULA 6ª – DAS OBSERVAÇÕES ESPECÍFICAS
${contract.notes || 'Nenhuma observação operacional adicional registrada.'}

CLÁUSULA 7ª – DAS CONDIÇÕES GERAIS, CONSERVAÇÃO E MULTAS
7.1. CUIDADOS COM O ACERVO: É estritamente proibido o uso de cola quente, fitas adesivas de alta aderência (como silver tape ou dupla face agressiva), tachas ou grampos sobre tecidos sublimados, cilindros e painéis. É proibida a queima de velas ou exposição a chamas e intempéries (chuva/umidade) junto às peças.
7.2. TAXA DE HIGIENIZAÇÃO: Todos os itens devem retornar devidamente limpos e em suas embalagens originais. Para cada item devolvido sujo ou com resíduos, será cobrada a taxa de R$ 10,00 para higienização especializada.
7.3. AVARIAS E REPOSIÇÃO: Em caso de quebra, rasgo, manchas irreversíveis ou extravio de qualquer peça, o CONTRATANTE indenizará a LOCADORA pelo valor de mercado para reposição imediata da peça idêntica nova, acrescido de frete, no prazo de até 48 horas.
7.4. MULTA POR ATRASO NA DEVOLUÇÃO: Havendo atraso na devolução além da data e horário limite estipulados na Cláusula 3ª, incidirá multa de R$ 60,00 por dia de atraso, sem prejuízo da cobrança de diárias adicionais e ressarcimento de eventuais prejuízos causados à próxima locação do acervo.
7.5. POLÍTICA DE CANCELAMENTO / DESISTÊNCIA: Em caso de cancelamento da locação por parte do CONTRATANTE com menos de 15 (quinze) dias de antecedência da data da festa, o valor pago a título de sinal (reserva de agenda) NÃO será restituído, servindo como compensação à LOCADORA pela indisponibilização da data a outros clientes.
7.6. CONFERÊNCIA E ITENS ESQUECIDOS: A conferência do acervo ocorre no ato da entrega/retirada e na devolução. Qualquer item de propriedade do cliente esquecido com a empresa deverá ser retirado em até 15 dias, sob pena de descarte.
7.7. VALIDADE DO ACEITE DIGITAL: As partes reconhecem expressamente que o recebimento deste contrato por WhatsApp/meio eletrônico, somado ao pagamento do sinal ou retirada do acervo, constitui anuência e aceite pleno e irretratável de todas as cláusulas deste contrato, nos termos da Lei Federal nº 14.063/2020 e do Art. 441 do Código Civil Brasileiro.

São Paulo, ${new Date().toLocaleDateString('pt-BR')}

_____________________________________________        _____________________________________________
CONTRATANTE: ${contract.customerName}                LOCADORA: Magia Festeira Decorações
CPF: ${contract.customerDocument || '—'}             CNPJ: 51.492.381/0001-90

[ ] Conferido na Retirada por: ___________________   Data: ___/___/2026
[ ] Conferido na Devolução por: __________________   Data: ___/___/2026 - Avarias: (  ) Sim  (  ) Não
`;
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
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
    `Olá, ${contract.customerName}! 🎈 Segue seu Contrato Oficial de Locação da Magia Festeira para a festa do tema *${contract.themeName}*:\n\n📄 *Acesse e salve seu contrato oficial em PDF aqui:*\n${typeof window !== 'undefined' ? window.location.href : ''}\n\nQualquer dúvida estamos à sua inteira disposição!`
  )}`;

  const formattedDateToday = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 py-4 sm:py-8 px-2 sm:px-4 font-sans text-slate-900 dark:text-slate-100 print:p-0 print:bg-white print:text-black">
      {/* Estilos específicos para impressão e geração perfeita de PDF A4 */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11pt !important;
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
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
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
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                LOC-2026-#{contract.orderNumber}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Modelo Oficial Blindado
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Contrato Oficial de Locação • {contract.customerName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Abrir diálogo de impressão / Salvar como PDF"
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
              title="Compartilhar no WhatsApp do cliente"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopyFullText}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar texto formal completo com todas as cláusulas"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4" />}
            <span>{copiedText ? 'Texto Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar link do contrato"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>
      </div>

      {/* FOLHA DO CONTRATO - FORMATO OFICIAL A4 JURÍDICO */}
      <div className="contract-sheet max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-xl border border-slate-300 font-serif leading-relaxed space-y-6">
        
        {/* CABEÇALHO OFICIAL COM TIMBRE DA MAGIA FESTEIRA */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-rose-600 uppercase font-sans">
            MAGIA FESTEIRA
          </h1>
          <p className="text-xs font-bold text-slate-800 tracking-wider uppercase font-sans">
            LOCAÇÃO PARA DECORAÇÕES DE FESTAS E EVENTOS
          </p>
          <p className="text-[11px] text-slate-600 font-sans">
            CNPJ: <strong>51.492.381/0001-90</strong> | WhatsApp Oficial: <strong>(11) 97782-3876</strong>
          </p>
          <p className="text-[11px] text-slate-600 font-sans">
            Endereço de Retirada e Devolução: Rua Adolina, 102 - Vila Mazzei, São Paulo - SP
          </p>

          <div className="pt-2">
            <div className="inline-block border-y-2 border-slate-900 py-1.5 px-6 my-1">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 font-sans">
                CONTRATO DE LOCAÇÃO DE KITS E MOBILIÁRIO PARA FESTAS
              </h2>
            </div>
            <div className="text-xs text-slate-600 font-sans flex items-center justify-center gap-4 mt-1">
              <span><strong>Contrato nº:</strong> LOC-2026-#{contract.orderNumber}</span>
              <span>•</span>
              <span><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* CORPO DO CONTRATO COM AS 7 CLÁUSULAS FORMAIS COMPLETAS */}
        <div className="space-y-5 text-[12px] sm:text-[13px] text-slate-800 font-sans text-justify leading-relaxed">
          
          {/* CLÁUSULA 1ª */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
              CLÁUSULA 1ª – DA QUALIFICAÇÃO DAS PARTES
            </h3>
            <p>
              <strong>LOCADORA:</strong> <strong>MAGIA FESTEIRA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>51.492.381/0001-90</strong>, com sede e espaço de atendimento na Rua Adolina, 102 - Vila Mazzei, São Paulo - SP, WhatsApp Oficial (11) 97782-3876.
            </p>
            <p>
              <strong>CONTRATANTE:</strong> <strong>{contract.customerName}</strong>, inscrito(a) no CPF sob o nº <strong>{contract.customerDocument || '—'}</strong>, RG: <strong>{contract.customerRg || '—'}</strong>, Telefone/WhatsApp: <strong>{contract.customerPhone}</strong>, com endereço residencial em: <strong>{contract.customerAddress || 'São Paulo - SP'}</strong>.
            </p>
          </div>

          {/* CLÁUSULA 2ª */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
              CLÁUSULA 2ª – DO EVENTO E LOCAL DA CELEBRAÇÃO
            </h3>
            <p>
              O presente contrato tem como finalidade a locação temporária do mobiliário e decoração destinados exclusivamente à realização da celebração denominada: <strong>{contract.eventName || 'Festa Comemorativa'}</strong>, a realizar-se na data de <strong>{formatDateBR(contract.eventDate)}</strong>, no horário estimado de <strong>{contract.eventTime || '13h às 20h'}</strong>, tendo como local do evento o endereço: <strong>{contract.deliveryLocation || 'Salão de Festas / Domicílio do Contratante'}</strong>.
            </p>
          </div>

          {/* CLÁUSULA 3ª */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
              CLÁUSULA 3ª – DO CRONOGRAMA DE RETIRADA E DEVOLUÇÃO
            </h3>
            <p>
              As partes acordam expressamente as seguintes datas e limites operacionais para manuseio do acervo:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>
                <strong>Data da Retirada:</strong> <strong>{formatDateBR(contract.pickupDate)}</strong> (a partir das {contract.pickupTime || '10:00'}, mediante prévio alinhamento com a LOCADORA).
              </li>
              <li>
                <strong>Data da Devolução:</strong> <strong>{formatDateBR(contract.returnDate)}</strong> (impreterivelmente até o horário limite de <strong>{contract.returnTime || '17h00'}</strong>).
              </li>
              <li>
                <strong>Endereço de Coleta e Devolução:</strong> Rua Adolina, 102 - Vila Mazzei, São Paulo - SP.
              </li>
            </ul>
          </div>

          {/* CLÁUSULA 4ª */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
              CLÁUSULA 4ª – DO VALOR E CONDIÇÕES DE PAGAMENTO
            </h3>
            <p>
              Pela locação dos bens descritos na Cláusula 5ª no tema <strong>{contract.themeName}</strong>, o CONTRATANTE pagará à LOCADORA o valor total de <strong>R$ {contract.total.toFixed(2).replace('.', ',')}</strong>, distribuído na seguinte forma:
            </p>
            <div className="grid grid-cols-3 gap-2 py-1 text-center font-sans">
              <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Total</span>
                <span className="text-xs font-black text-slate-900">R$ {contract.total.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="border border-emerald-300 p-1.5 rounded bg-emerald-50">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Sinal na Reserva (Pago)</span>
                <span className="text-xs font-black text-emerald-700">R$ {contract.paid.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="border border-rose-300 p-1.5 rounded bg-rose-50">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Saldo Restante</span>
                <span className="text-xs font-black text-rose-700">R$ {contract.balance.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <p>
              <strong>Condição e Meio de Pagamento:</strong> {contract.paymentTerms || contract.paymentMethod?.toUpperCase() || 'PIX'}.
            </p>
            <p className="font-bold text-rose-700 bg-rose-50/80 p-1.5 rounded border border-rose-200">
              * PARÁGRAFO ÚNICO: A liberação do acervo para saída do galpão fica expressa e obrigatoriamente condicionada à quitação integral do saldo remanescente até o momento exato da retirada.
            </p>
          </div>

          {/* CLÁUSULA 5ª */}
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5 flex items-center justify-between">
              <span>CLÁUSULA 5ª – DO ACERVO LOCADO (ITENS CONTRATADOS)</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">
                (conferir na entrega e na devolução)
              </span>
            </h3>
            <p>
              Compõem a presente locação os itens relacionados a seguir, devendo todos ser devolvidos no mesmo estado de conservação em que foram recebidos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1 font-sans text-xs">
              {contract.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 py-0.5 border-b border-slate-100">
                  <span className="w-3.5 h-3.5 border border-slate-500 rounded-xs shrink-0 flex items-center justify-center text-[9px] text-slate-600">
                    ☐
                  </span>
                  <span className="font-medium text-slate-900">
                    {it.quantity && it.quantity > 1 ? `${it.quantity}x ` : ''}{it.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CLÁUSULA 6ª */}
          {contract.notes && (
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
                CLÁUSULA 6ª – DAS OBSERVAÇÕES ESPECÍFICAS
              </h3>
              <p className="whitespace-pre-wrap text-slate-700">
                {contract.notes}
              </p>
            </div>
          )}

          {/* CLÁUSULA 7ª */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-0.5">
              CLÁUSULA 7ª – DAS CONDIÇÕES GERAIS, CONSERVAÇÃO E MULTAS
            </h3>
            
            <div className="space-y-1.5 text-[11.5px] sm:text-[12px] text-slate-800 leading-normal">
              <p>
                <strong>7.1. CUIDADOS COM O ACERVO:</strong> É estritamente proibido o uso de cola quente, fitas adesivas de alta fixação (tais como silver tape ou fita dupla face agressiva), tachas ou grampos sobre os tecidos sublimados, cilindros e painéis. É expressamente proibida a exposição das peças à chuva, umidade excessiva e chamas de velas acesas próximas às estruturas.
              </p>
              
              <p>
                <strong>7.2. TAXA DE HIGIENIZAÇÃO:</strong> Todos os itens locados devem retornar à LOCADORA devidamente limpos, secos e acondicionados em suas respectivas embalagens originais. Para cada item devolvido com resíduos, manchas ou sujidades que demandem lavagem química especializada, será cobrada a taxa de <strong>R$ 10,00 (dez reais)</strong> por peça.
              </p>
              
              <p>
                <strong>7.3. AVARIAS E REPOSIÇÃO:</strong> Em caso de avaria, quebra, perfuração, rasgo em tecido, queima ou extravio total/parcial de qualquer item do acervo, o CONTRATANTE indenizará a LOCADORA pelo valor de reposição de mercado de peça idêntica e nova, acrescido das despesas de frete para entrega imediata, devendo o pagamento ser liquidado no prazo improrrogável de até <strong>48 (quarenta e oito) horas</strong> após a conferência de retorno.
              </p>
              
              <p>
                <strong>7.4. MULTA POR ATRASO NA DEVOLUÇÃO:</strong> O atraso na devolução do acervo após a data e horário limite estipulados na Cláusula 3ª acarretará a incidência automática de multa penal compensatória de <strong>R$ 60,00 (sessenta reais) por dia de atraso</strong>, sem prejuízo da cobrança do valor das diárias adicionais e das perdas decorrentes de eventuais cancelamentos de reservas subsequentes do mesmo tema.
              </p>
              
              <p>
                <strong>7.5. POLÍTICA DE CANCELAMENTO / DESISTÊNCIA:</strong> Em razão do bloqueio e reserva exclusiva do acervo na data solicitada, caso ocorra o cancelamento ou desistência por iniciativa do CONTRATANTE com antecedência inferior a 15 (quinze) dias da data da celebração, o valor pago a título de sinal <strong>NÃO será restituído</strong>, sendo integralmente retido pela LOCADORA a título de taxa indenizatória de ocupação de agenda.
              </p>
              
              <p>
                <strong>7.6. CONFERÊNCIA E ITENS ESQUECIDOS:</strong> A conferência de entrada e saída é de responsabilidade mútua das partes. Qualquer objeto, adorno ou pertence pessoal de propriedade do CONTRATANTE esquecido nas instalações da LOCADORA ou junto às embalagens deverá ser retirado no prazo de até 15 (quinze) dias, findo o qual poderá ser descartado sem direito a qualquer indenização.
              </p>
              
              <p>
                <strong>7.7. VALIDADE DO ACEITE DIGITAL:</strong> Em estrita observância à Lei Federal nº 14.063/2020 e ao Art. 441 do Código Civil Brasileiro, as partes pactuam que o recebimento deste contrato por meio eletrônico (WhatsApp ou e-mail), acompanhado da confirmação de pagamento do sinal ou da retirada física do acervo, constitui anuência e aceite tácito, irrevogável e irretratável de todas as cláusulas e condições nele exaradas.
              </p>
            </div>
          </div>

        </div>

        {/* DATA E ASSINATURAS */}
        <div className="pt-6 space-y-6 text-xs font-sans">
          <div className="text-right text-slate-700 font-medium">
            São Paulo, {formattedDateToday}.
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center space-y-1">
              <div className="border-t-2 border-slate-900 pt-1.5 font-bold text-slate-900 uppercase">
                {contract.customerName}
              </div>
              <span className="text-[10px] text-slate-600 block">
                CONTRATANTE • CPF: {contract.customerDocument || '—'}
              </span>
            </div>

            <div className="text-center space-y-1">
              <div className="border-t-2 border-slate-900 pt-1.5 font-bold text-slate-900 uppercase">
                Magia Festeira Decorações
              </div>
              <span className="text-[10px] text-slate-600 block">
                LOCADORA • CNPJ: 51.492.381/0001-90
              </span>
            </div>
          </div>

          {/* CHECKLIST E PROTOCOLO DE CONFERÊNCIA DE BALCÃO */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-300 rounded-lg space-y-2 text-[11px] text-slate-800">
            <span className="font-black uppercase tracking-wider block text-[10px] border-b border-slate-300 pb-1 text-center">
              PROTOCOLO DE CONFERÊNCIA DE BALCÃO
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="border border-slate-300 p-2 rounded bg-white space-y-1">
                <span className="font-bold block text-slate-900">1. CONFERÊNCIA NA RETIRADA (SAÍDA):</span>
                <p className="text-[10px] text-slate-600">[ ] Itens completos conferidos sem avarias prévias</p>
                <p className="text-[10px] text-slate-600">Responsável: _________________________________</p>
                <p className="text-[10px] text-slate-600">Data da Saída: ___/___/2026</p>
              </div>

              <div className="border border-slate-300 p-2 rounded bg-white space-y-1">
                <span className="font-bold block text-slate-900">2. CONFERÊNCIA NA DEVOLUÇÃO (RETORNO):</span>
                <p className="text-[10px] text-slate-600">[ ] Itens recebidos e limpos • Avarias: (  ) Sim  (  ) Não</p>
                <p className="text-[10px] text-slate-600">Responsável: _________________________________</p>
                <p className="text-[10px] text-slate-600">Data de Retorno: ___/___/2026</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
