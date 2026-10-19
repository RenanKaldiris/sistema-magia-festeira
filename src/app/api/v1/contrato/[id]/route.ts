import { NextRequest, NextResponse } from 'next/server';
import { apiService, getDefaultRentalItems } from '@/services/api/api-service';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * GET /api/v1/contrato/[id]
 * Rota pública e segura para visualização e impressão do contrato oficial da Magia Festeira.
 * Acessível pelo cliente via link do WhatsApp sem necessidade de login administrativo.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do contrato obrigatório.' }, { status: 400 });
    }

    const rental: any = await apiService.getRentalById(id);
    if (!rental) {
      return NextResponse.json({ success: false, error: 'Contrato de locação não encontrado.' }, { status: 404 });
    }

    const themeName = rental.theme?.name || rental.theme_name || 'Tema Magia Festeira';

    // Itens: se a locação tiver linhas gravadas, usa elas; caso contrário, provê os 9 itens padrão oficiais
    let items = [];
    if (rental.lines && rental.lines.length > 0) {
      items = rental.lines.map((l: any) => ({
        description: l.description,
        quantity: l.quantity || 1,
        unitPrice: l.unit_price || 0,
      }));
    } else {
      items = getDefaultRentalItems(themeName).map((it) => ({
        description: it.description,
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
      }));
    }

    // Extrai horários e condições de pagamento
    let eventTime = '13h às 20h';
    let paymentTerms = 'PIX - 50% na reserva e 50% na retirada';
    if (rental.notes) {
      const timeMatch = rental.notes.match(/Horário:\s*([^\n]+)/i);
      if (timeMatch) eventTime = timeMatch[1].trim();

      const payTermsMatch = rental.notes.match(/Condição de Pagamento:\s*([^\n]+)/i);
      if (payTermsMatch) paymentTerms = payTermsMatch[1].trim();
    }

    const contractData = {
      id: rental.id,
      orderNumber: rental.id.slice(-4),
      customerName: rental.customer?.name || rental.customer_name || 'Cliente Magia Festeira',
      customerPhone: rental.customer?.phone || rental.customer_phone || '',
      customerDocument: rental.customer?.document || null,
      customerRg: null,
      customerAddress: rental.customer?.address || rental.delivery_location || null,
      customerNeighborhood: null,
      customerCity: 'São Paulo',
      customerCep: null,

      eventName: `Aniversário de ${(rental.customer?.name || rental.customer_name || 'Cliente').split(' ')[0]}`,
      eventDate: rental.event_date || rental.pickup_date,
      eventTime,
      deliveryLocation: rental.delivery_location || rental.customer?.address || 'Rua Adolina, 102 - Vila Mazzei',

      themeName,
      pickupDate: rental.pickup_date,
      pickupTime: '10:00',
      returnDate: rental.return_date,
      returnTime: 'Até às 17h00',

      total: Number(rental.total) || 0,
      paid: Number(rental.paid) || 0,
      balance: Math.max(0, (Number(rental.total) || 0) - (Number(rental.paid) || 0)),
      paymentMethod: rental.payment_method || 'PIX',
      paymentTerms,
      notes: rental.notes || null,
      items,
      createdAt: rental.created_at || new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: contractData,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('[Contrato API Error]', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar dados do contrato.', details: (err as Error).message },
      { status: 500 }
    );
  }
}
