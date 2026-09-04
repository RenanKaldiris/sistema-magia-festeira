import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, LayoutDashboard, Calendar, ShieldCheck, Camera, ArrowRight, MessageSquare } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { getWhatsAppUrl, formatWhatsAppDisplay } from '@/lib/whatsapp';

export default function HomePage() {
  const whatsappUrl = getWhatsAppUrl('Olá! Gostaria de mais informações sobre as decorações da Magia Festeira.');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-rose-50/70 via-white to-slate-50 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Logo de Destaque Oficial Magia Festeira */}
            <div className="flex justify-center mb-6">
              <div className="p-3 sm:p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-rose-100/80 dark:border-slate-800/80 inline-flex items-center">
                <Image
                  src="/logo/logo-dark.png"
                  alt="Magia Festeira Decorações"
                  width={240}
                  height={70}
                  className="h-14 sm:h-18 w-auto object-contain block dark:hidden"
                  priority
                />
                <Image
                  src="/logo/logo-light.png"
                  alt="Magia Festeira Decorações"
                  width={240}
                  height={70}
                  className="h-14 sm:h-18 w-auto object-contain hidden dark:block"
                  priority
                />
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
              Tornando momentos especiais em{' '}
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                cenários inesquecíveis
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
              Locação de temas completos, kits personalizados e acervo fotográfico de alta resolução para transformar sua festa infantil ou comemoração.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/catalogo"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/20 hover:from-rose-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Explorar Catálogo de Temas</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/admin"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span>Acessar Painel de Gestão</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Catálogo Visual Mobile-First</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Fotos em alta resolução com preservação dos arquivos originais, variações de temas, composição de kits e botão direto para o WhatsApp.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Gestão de Estoque & Conflitos</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cálculo rigoroso de disponibilidade no intervalo integral entre retirada e devolução, bloqueando reservas concorrentes e espelhando a agenda.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Agente de IA com 23 Ferramentas</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Atendimento ágil pelo WhatsApp para cadastro por foto, verificação de datas, orquestração de importações e esclarecimento de ambiguidades.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
          <Image
            src="/logo/logo-light.png"
            alt="Magia Festeira"
            width={200}
            height={56}
            className="h-10 sm:h-12 w-auto object-contain opacity-90"
          />
          <p className="text-xs text-slate-400 max-w-md">
            Decorações para festas infantis e celebrações especiais. Locação de cenários, painéis e kits completos.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/60 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Atendimento WhatsApp {formatWhatsAppDisplay()}</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            © 2026 Magia Festeira. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
