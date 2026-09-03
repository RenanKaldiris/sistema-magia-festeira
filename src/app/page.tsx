import Link from 'next/link';
import { Sparkles, ShoppingBag, LayoutDashboard, Calendar, ShieldCheck, Camera, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-rose-50/70 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 text-rose-700 text-xs font-semibold mb-6 border border-rose-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma Oficial da Magia Festeira</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
              Tornando momentos especiais em{' '}
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                cenários inesquecíveis
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
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
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-600" />
                <span>Acessar Painel de Gestão</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Catálogo Visual Mobile-First</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fotos em alta resolução com preservação dos arquivos originais, variações de temas, composição de kits e botão direto para o WhatsApp.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Gestão de Estoque & Conflitos</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cálculo rigoroso de disponibilidade no intervalo integral entre retirada e devolução, bloqueando reservas concorrentes e espelhando a agenda.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Agente de IA com 23 Ferramentas</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Atendimento ágil pelo WhatsApp para cadastro por foto, verificação de datas, orquestração de importações e esclarecimento de ambiguidades.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        <p>© 2026 Magia Festeira. Todos os direitos reservados. Sistema de Gestão e Catálogo.</p>
      </footer>
    </div>
  );
}
