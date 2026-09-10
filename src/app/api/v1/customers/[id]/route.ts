import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/customers/[id]
 * Detalhes do cliente e seu histórico de locações
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const customer = await apiService.getCustomerById(id);

    if (!customer) {
      return apiError(`Cliente com ID ${id} não encontrado.`, 404);
    }

    return apiResponse({
      success: true,
      data: customer,
    });
  } catch (err: unknown) {
    return apiError('Erro ao buscar dados do cliente.', 500, (err as Error).message);
  }
}

/**
 * PATCH /api/v1/customers/[id]
 * Atualiza campos específicos do cliente
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

    const updated = await apiService.updateCustomer(id, body);
    if (!updated) {
      return apiError(`Cliente com ID ${id} não encontrado para atualização.`, 404);
    }

    return apiResponse({
      success: true,
      message: 'Cliente atualizado com sucesso!',
      data: updated,
    });
  } catch (err: unknown) {
    return apiError('Erro ao atualizar cliente.', 500, (err as Error).message);
  }
}

/**
 * DELETE /api/v1/customers/[id]
 * Exclui o cliente caso não possua locações ativas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    const result = await apiService.deleteCustomer(id);

    if (!result.success) {
      return apiError(result.error || 'Não foi possível excluir o cliente.', 400);
    }

    return apiResponse({
      success: true,
      message: 'Cliente excluído com sucesso.',
    });
  } catch (err: unknown) {
    return apiError('Erro ao excluir cliente.', 500, (err as Error).message);
  }
}
