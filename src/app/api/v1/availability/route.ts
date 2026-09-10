import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/availability?themeId=...&pickupDate=YYYY-MM-DD&returnDate=YYYY-MM-DD
 * Consulta disponibilidade de estoque para locação de um tema em um intervalo de datas.
 * Aceita "themeId", "themeCode" (ex: MF-0127) ou "themeName" (ex: Vingadores).
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const themeIdentifier =
      searchParams.get('themeId') ||
      searchParams.get('themeCode') ||
      searchParams.get('themeName') ||
      searchParams.get('theme');

    const pickupDate = searchParams.get('pickupDate');
    const returnDate = searchParams.get('returnDate') || pickupDate; // Fallback se mesmo dia
    const quantity = searchParams.get('quantity') ? parseInt(searchParams.get('quantity')!, 10) : 1;

    if (!themeIdentifier) {
      return apiError(
        'Parâmetro do tema obrigatório: informe "themeId", "themeCode" (ex: MF-0127) ou "themeName" (ex: Vingadores).',
        400
      );
    }

    if (!pickupDate || !returnDate) {
      return apiError(
        'Parâmetros de datas obrigatórios: informe "pickupDate" e "returnDate" no formato YYYY-MM-DD.',
        400
      );
    }

    const check = apiService.checkAvailability(themeIdentifier, pickupDate, returnDate, quantity);

    if (!check.found) {
      return apiError(check.error || 'Tema não encontrado.', 404);
    }

    return apiResponse({
      success: true,
      data: check,
    });
  } catch (err: unknown) {
    return apiError('Erro ao consultar disponibilidade de estoque.', 500, (err as Error).message);
  }
}
