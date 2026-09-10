import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';
import { RentalStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/rentals
 * Lista pedidos e locações com filtros de status, cliente, tema ou data
 */
export async function GET(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as RentalStatus) || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const themeId = searchParams.get('themeId') || undefined;
    const date = searchParams.get('date') || undefined;
    const pickupDate = searchParams.get('pickupDate') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = await apiService.getRentals({
      status,
      customerId,
      themeId,
      date,
      pickupDate,
      limit,
      offset,
    });

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
    return apiError('Erro ao consultar locações.', 500, (err as Error).message);
  }
}

/**
 * POST /api/v1/rentals
 * Lança um novo pedido / locação no sistema.
 * 
 * Suporta:
 * 1. Cliente já existente via "customerId" OU criação instantânea via "customerName" + "customerPhone"
 * 2. Tema via "themeId", "themeCode" (ex: MF-0127) ou "themeQuery" (ex: "Vingadores")
 * 3. Validação estrita de conflito de datas de estoque (retorna 409 se indisponível, a menos que "forceOverride: true")
 * 4. Pagamento de sinal inicial opcional ("paid": 150, "paymentMethod": "pix")
 */
export async function POST(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await request.json();

    // 1. Validação de Cliente
    if (!body.customerId && (!body.customerName || !body.customerPhone)) {
      return apiError(
        'Identificação do cliente obrigatória: informe "customerId" ou ambos "customerName" e "customerPhone".',
        422
      );
    }

    // 2. Validação de Tema
    const themeIdentifier = body.themeId || body.themeCode || body.themeQuery || body.themeName;
    if (!themeIdentifier) {
      return apiError('Identificação do tema obrigatória: informe "themeId", "themeCode" ou "themeQuery".', 422);
    }

    // 3. Validação de Datas
    const eventDate = body.eventDate || body.pickupDate;
    const pickupDate = body.pickupDate || eventDate;
    const returnDate = body.returnDate || pickupDate;

    if (!eventDate) {
      return apiError('Informe a data do evento ("eventDate" no formato YYYY-MM-DD).', 422);
    }

    // 4. Se total não informado, consulta o tema para usar o preço base
    let total = body.total;
    if (typeof total !== 'number' || total <= 0) {
      const themeObj = apiService.resolveTheme(themeIdentifier);
      total = themeObj ? themeObj.base_price : 150.0;
    }

    const paid = typeof body.paid === 'number' ? body.paid : 0;

    const result = await apiService.createRental({
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      customerAddress: body.customerAddress || body.deliveryLocation,

      themeId: body.themeId,
      themeQuery: themeIdentifier,
      themeVariantId: body.themeVariantId || null,
      kitId: body.kitId || null,

      eventDate,
      pickupDate,
      returnDate,

      total,
      paid,
      paymentMethod: body.paymentMethod || 'pix',

      deliveryLocation: body.deliveryLocation || null,
      notes: body.notes || null,
      forceOverride: body.forceOverride === true,
    });

    if (!result.success) {
      // 409 Conflict se for conflito de datas de estoque
      const isConflict = Boolean(result.conflict);
      return apiError(result.error || 'Não foi possível registrar o pedido.', isConflict ? 409 : 400, {
        conflict: result.conflict,
        hint: isConflict
          ? 'Para confirmar esta reserva mesmo com conflito de agenda, envie "forceOverride": true.'
          : undefined,
      });
    }

    return apiResponse(
      {
        success: true,
        message: 'Pedido de locação lançado com sucesso!',
        data: {
          rental: result.rental,
          customer: result.customer,
        },
      },
      201
    );
  } catch (err: unknown) {
    return apiError('Falha ao processar lançamento do pedido.', 500, (err as Error).message);
  }
}
