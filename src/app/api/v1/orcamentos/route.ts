import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/orcamentos
 * Lista orçamentos e propostas comerciais emitidas
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const orcamentos = apiService.getOrcamentos();
    return apiResponse({
      success: true,
      total: orcamentos.length,
      data: orcamentos,
    });
  } catch (err: unknown) {
    return apiError('Erro ao consultar orçamentos.', 500, (err as Error).message);
  }
}

/**
 * POST /api/v1/orcamentos
 * Gera uma nova proposta ou orçamento rápido para um cliente
 */
export async function POST(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await request.json();

    if (!body.customer_name || !body.customer_phone) {
      return apiError('Campos "customer_name" e "customer_phone" são obrigatórios.', 422);
    }

    const orcamento = apiService.createOrcamento({
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      code: body.code || `ORC-${Date.now().toString().slice(-4)}`,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email || undefined,
      event_date: body.event_date || undefined,
      event_location: body.event_location || undefined,
      items: body.items || [],
      subtotal: body.subtotal || body.total || 0,
      discount: body.discount || 0,
      shipping_fee: body.shipping_fee || 0,
      total: body.total || 0,
      status: body.status || 'pendente',
      valid_until: body.valid_until || undefined,
      notes: body.notes || undefined,
    });

    return apiResponse(
      {
        success: true,
        message: 'Orçamento gerado com sucesso!',
        data: orcamento,
      },
      201
    );
  } catch (err: unknown) {
    return apiError('Erro ao gerar orçamento.', 500, (err as Error).message);
  }
}
