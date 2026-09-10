import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';
import { Payment } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/rentals/[id]/payments
 * Registra um pagamento (sinal Pix, quitação, etc.) vinculado a uma locação.
 * Recalcula e abate automaticamente o saldo devedor ("balance").
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const body = await request.json();

    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return apiError('O campo "amount" (valor do pagamento em reais) é obrigatório e deve ser maior que 0.', 422);
    }

    const validMethods: Payment['method'][] = ['pix', 'dinheiro', 'cartao', 'transferencia'];
    const method: Payment['method'] = validMethods.includes(body.method) ? body.method : 'pix';

    const result = await apiService.recordPayment(id, amount, method, body.note || 'Pagamento via API');

    if (!result.success) {
      return apiError(result.error || 'Não foi possível registrar o pagamento.', 400);
    }

    return apiResponse(
      {
        success: true,
        message: `Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!`,
        data: {
          payment: result.payment,
          rental: result.rental,
        },
      },
      201
    );
  } catch (err: unknown) {
    return apiError('Falha ao processar pagamento.', 500, (err as Error).message);
  }
}
