import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/rentals/[id]/contract
 * Gera ou atualiza o contrato no Google Docs e agenda no Google Calendar
 * Permite que o operador humano personalize itens, valores e prazos pelo Drawer web.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { id } = await params;
    if (!id) {
      return apiError('ID da locação obrigatório.', 422);
    }

    const body = await request.json().catch(() => ({}));

    const result = await apiService.generateRentalContract(id, {
      items: body.items,
      total: body.total,
      paid: body.paid,
      paymentMethod: body.paymentMethod,
      paymentTerms: body.paymentTerms,
      pickupDate: body.pickupDate,
      pickupTime: body.pickupTime,
      returnDate: body.returnDate,
      returnTime: body.returnTime,
      deliveryLocation: body.deliveryLocation,
      notes: body.notes,
      customer: body.customer,
      event: body.event,
    });

    if (!result.success) {
      return apiError(result.error || 'Falha ao gerar contrato.', 400);
    }

    return apiResponse({
      success: true,
      message: 'Contrato gerado com sucesso!',
      data: {
        contractUrl: result.contractUrl,
        docId: result.docId,
        calendarEventId: result.calendarEventId,
        formattedText: result.formattedText,
        rental: result.rental,
      },
    });
  } catch (err: unknown) {
    return apiError('Erro ao gerar contrato.', 500, (err as Error).message);
  }
}
