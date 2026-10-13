import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';
import { Payment } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * PATCH /api/v1/rentals/[id]/payments/[paymentId]
 * PUT /api/v1/rentals/[id]/payments/[paymentId]
 * Edita uma entrada ou pagamento existente (valor, forma, data, status efetivado/pendente, observação).
 * Recalcula dinamicamente o saldo devedor da locação.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  return handleUpdate(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: NextRequest,
  paramsPromise: Promise<{ id: string; paymentId: string }>
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { paymentId } = await paramsPromise;
    const body = await request.json();

    const updates: {
      amount?: number;
      method?: Payment['method'];
      note?: string | null;
      paid_at?: string;
      status?: 'efetivado' | 'pendente';
    } = {};

    if (body.amount !== undefined) {
      const parsedAmount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return apiError('O campo "amount" deve ser um valor numérico positivo.', 422);
      }
      updates.amount = parsedAmount;
    }

    if (body.method !== undefined) {
      const validMethods: Payment['method'][] = ['pix', 'dinheiro', 'cartao', 'transferencia'];
      if (!validMethods.includes(body.method)) {
        return apiError('O campo "method" deve ser: pix, dinheiro, cartao ou transferencia.', 422);
      }
      updates.method = body.method;
    }

    if (body.note !== undefined) {
      updates.note = body.note ? String(body.note) : null;
    }

    if (body.paid_at !== undefined) {
      updates.paid_at = String(body.paid_at);
    }

    if (body.status !== undefined) {
      if (body.status !== 'efetivado' && body.status !== 'pendente') {
        return apiError('O campo "status" deve ser "efetivado" ou "pendente".', 422);
      }
      updates.status = body.status;
    }

    const result = await apiService.updatePayment(paymentId, updates);

    if (!result.success) {
      return apiError(result.error || 'Não foi possível atualizar o pagamento.', 400);
    }

    return apiResponse({
      success: true,
      message: 'Pagamento atualizado e saldo recalculado com sucesso!',
      data: {
        payment: result.payment,
        rental: result.rental,
      },
    });
  } catch (err: unknown) {
    return apiError('Falha ao processar atualização do pagamento.', 500, (err as Error).message);
  }
}

/**
 * DELETE /api/v1/rentals/[id]/payments/[paymentId]
 * Exclui um pagamento do histórico e recalcula o saldo da locação.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { paymentId } = await params;
    const result = await apiService.deletePayment(paymentId);

    if (!result.success) {
      return apiError(result.error || 'Não foi possível excluir o pagamento.', 400);
    }

    return apiResponse({
      success: true,
      message: 'Pagamento excluído e saldo devedor recalculado com sucesso!',
      data: {
        rental: result.rental,
      },
    });
  } catch (err: unknown) {
    return apiError('Falha ao excluir pagamento.', 500, (err as Error).message);
  }
}
