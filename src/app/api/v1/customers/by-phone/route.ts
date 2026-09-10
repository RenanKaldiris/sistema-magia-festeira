import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/customers/by-phone?phone=5511977823876
 * Busca instantânea de cliente pelo número de telefone ou WhatsApp
 * Essencial para robôs de atendimento e automações de CRM.
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return apiError('Parâmetro query "phone" é obrigatório (ex: ?phone=11977823876).', 400);
    }

    const customer = await apiService.getCustomerByPhone(phone);

    if (!customer) {
      return apiResponse(
        {
          success: true,
          found: false,
          message: 'Nenhum cliente cadastrado com este telefone.',
          data: null,
        },
        200
      );
    }

    return apiResponse({
      success: true,
      found: true,
      data: customer,
    });
  } catch (err: unknown) {
    return apiError('Erro ao consultar cliente por telefone.', 500, (err as Error).message);
  }
}
