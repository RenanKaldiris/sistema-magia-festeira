import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/rentals/[id]
 * Detalhes da locação com cliente, tema, linhas de pedido e pagamentos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const rental = apiService.getRentalById(id);

    if (!rental) {
      return apiError(`Pedido de locação com ID ${id} não encontrado.`, 404);
    }

    return apiResponse({
      success: true,
      data: rental,
    });
  } catch (err: unknown) {
    return apiError('Erro ao buscar pedido de locação.', 500, (err as Error).message);
  }
}

/**
 * PATCH /api/v1/rentals/[id]
 * Atualiza status (reservado, alugado, devolvido, cancelado), observações ou detalhes da locação
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const body = await request.json();

    const result = await apiService.updateRental(id, body);
    if (!result.success) {
      return apiError(result.error || `Locação com ID ${id} não encontrada.`, 404);
    }

    return apiResponse({
      success: true,
      message: 'Locação atualizada com sucesso!',
      data: result.rental,
    });
  } catch (err: unknown) {
    return apiError('Erro ao atualizar locação.', 500, (err as Error).message);
  }
}

/**
 * DELETE /api/v1/rentals/[id]
 * Exclui ou cancela a locação
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const success = store.deleteRental(id);

    if (!success) {
      return apiError(`Locação com ID ${id} não encontrada para exclusão.`, 404);
    }

    return apiResponse({
      success: true,
      message: 'Locação excluída com sucesso.',
    });
  } catch (err: unknown) {
    return apiError('Erro ao excluir locação.', 500, (err as Error).message);
  }
}
