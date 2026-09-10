import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/themes
 * Consulta o catálogo de temas de decoração, preços base, variações, kits e fotos
 * Ideal para bots de WhatsApp e CRMs enviarem opções para o cliente final.
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const themes = apiService.getThemes({ search, categoryId });

    const formatted = themes.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      slug: t.slug,
      category: t.category?.name || null,
      characters: t.characters,
      base_price: t.base_price,
      promotional_price: t.promotional_price,
      piece_count: t.piece_count,
      stock_quantity: t.stock_quantity,
      description: t.description,
      featured: t.featured,
      primary_image: t.primary_media?.storage_path || null,
      kits: t.kits.map((k) => ({
        id: k.id,
        name: k.name,
        price: k.price,
        description: k.description,
      })),
      variants: t.variants.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
      })),
    }));

    return apiResponse({
      success: true,
      total: formatted.length,
      data: formatted,
    });
  } catch (err: unknown) {
    return apiError('Erro ao consultar catálogo de temas.', 500, (err as Error).message);
  }
}
