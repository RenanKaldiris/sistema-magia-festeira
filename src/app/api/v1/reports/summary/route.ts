import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/reports/summary
 * Relatório executivo consolidado para o Assessor WhatsApp / n8n
 * 
 * Suporta parâmetros:
 * - ?period=next_weekend -> Locações do próximo final de semana
 * - ?period=last_month -> Total de locações, faturamento e temas do mês anterior
 * - ?period=current_month -> Mês atual em andamento
 * - ?period=themes -> Quantidade de temas e disponibilidade atual
 * - ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD -> Período customizado
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'next_weekend' | 'last_month' | 'current_month' | 'themes' | 'custom') || 'current_month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const referenceDate = searchParams.get('referenceDate') || undefined;

    const summary = await apiService.getReportsSummary({
      period,
      startDate,
      endDate,
      referenceDate,
    });

    return apiResponse({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    return apiError('Erro ao gerar relatório consolidado.', 500, (err as Error).message);
  }
}
