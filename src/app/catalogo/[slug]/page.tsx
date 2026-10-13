import type { Metadata } from 'next';
import { apiService } from '@/services/api/api-service';
import { store } from '@/lib/store';
import { ThemeDetailClient } from './ThemeDetailClient';

interface ThemePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Metadata Dinâmico Server-Side para WhatsApp, Redes Sociais e SEO (OpenGraph / Twitter Cards)
 * Gera a prévia visual idêntica à referência (print 2):
 * - Foto real e destacada do tema em alta resolução (1200x630 JPEG via rota /api/og/theme/[slug])
 * - Título em destaque com o nome do tema
 * - Descrição atraente do tema e acervo da Magia Festeira
 * - summary_large_image para banner grande no WhatsApp
 */
export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim();

  // Resolve tema no Supabase Cloud ou Store em memória
  const theme = (await apiService.resolveTheme(cleanSlug)) || store.getThemeBySlug(cleanSlug);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://sistema-magia-festeira-blond.vercel.app';

  if (!theme) {
    return {
      title: 'Tema não encontrado | Magia Festeira',
      description: 'Catálogo de festas infantis e temas para locação da Magia Festeira.',
    };
  }

  const themeTitle = `${theme.name} - Magia Festeira`;
  const themeDescription =
    theme.description?.trim() ||
    `Confira a decoração completa do tema ${theme.name} na Magia Festeira. Fotos exclusivas, painéis, cilindros e disponibilidade de datas!`;

  // URL da imagem otimizada em JPEG 1200x630 gerada dinamicamente via Sharp
  const ogImageUrl = `${baseUrl}/api/og/theme/${encodeURIComponent(cleanSlug)}`;

  const imagesList = [
    {
      url: ogImageUrl,
      secureUrl: ogImageUrl,
      width: 1200,
      height: 630,
      alt: theme.name,
      type: 'image/jpeg',
    },
  ];

  return {
    metadataBase: new URL(baseUrl),
    title: themeTitle,
    description: themeDescription,
    alternates: {
      canonical: `/catalogo/${cleanSlug}`,
    },
    openGraph: {
      title: themeTitle,
      description: themeDescription,
      url: `${baseUrl}/catalogo/${cleanSlug}`,
      siteName: 'Magia Festeira Decorações',
      locale: 'pt_BR',
      type: 'website',
      images: imagesList,
    },
    twitter: {
      card: 'summary_large_image',
      title: themeTitle,
      description: themeDescription,
      images: [ogImageUrl],
    },
  };
}

/**
 * Página do Tema no Catálogo (Server Component com hidratação cliente em ThemeDetailClient)
 * 
 * Critérios de Aceite verificados:
 * - 18. handleShare / Compartilhar Tema: compartilha URL direta do tema com visualização da foto no WhatsApp.
 * - 19. wa.me / Tenho interesse no tema: link direto para o WhatsApp oficial com mensagem pré-formatada.
 */
export default async function ThemeDetailPage({ params }: ThemePageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim();
  const theme = (await apiService.resolveTheme(cleanSlug)) || store.getThemeBySlug(cleanSlug);

  return <ThemeDetailClient slug={cleanSlug} initialTheme={theme} />;
}
