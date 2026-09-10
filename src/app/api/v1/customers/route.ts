import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/customers
 * Lista clientes cadastrados com busca opcional (?search=) e paginação (?limit=50&offset=0)
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = await apiService.getCustomers({ search, limit, offset });

    return apiResponse({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (err: unknown) {
    return apiError('Erro ao buscar clientes.', 500, (err as Error).message);
  }
}

/**
 * POST /api/v1/customers
 * Cadastra ou atualiza um cliente (CRM ou WhatsApp).
 * Suporta o parâmetro "upsert": true para atualizar caso o telefone já exista.
 */
export async function POST(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return apiError('O campo "name" (nome do cliente) é obrigatório e deve ter no mínimo 2 caracteres.', 422);
    }

    if (!body.phone || typeof body.phone !== 'string' || body.phone.replace(/\D/g, '').length < 8) {
      return apiError('O campo "phone" (telefone / WhatsApp) é obrigatório e deve conter DDD válido.', 422);
    }

    const { customer, isNew } = await apiService.upsertCustomer({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      document: body.document || null,
      address: body.address || null,
      notes: body.notes || null,
      upsert: body.upsert !== false, // Default true
    });

    return apiResponse(
      {
        success: true,
        message: isNew ? 'Cliente cadastrado com sucesso!' : 'Cliente existente atualizado com sucesso!',
        data: customer,
        isNew,
      },
      isNew ? 201 : 200
    );
  } catch (err: unknown) {
    return apiError('Falha ao processar cadastro de cliente.', 500, (err as Error).message);
  }
}
