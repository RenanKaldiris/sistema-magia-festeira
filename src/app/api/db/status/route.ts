import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { testPostgresConnection, isPostgresConfigured } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  // 1. Verificação do Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: themesData, error: themesError } = await supabase.from('themes').select('id, name, code, base_price, stock_quantity, status');
      const { data: rentalsData } = await supabase.from('rentals').select('id, customer_name, event_date, status, total');
      const { data: customersData } = await supabase.from('customers').select('id, name, phone');

      const latencyMs = Date.now() - start;

      if (themesError) {
        return NextResponse.json({
          configured: true,
          connected: false,
          error: themesError.message,
          latencyMs,
        });
      }

      return NextResponse.json({
        configured: true,
        connected: true,
        tablesReady: true,
        provider: 'Supabase (São Paulo)',
        latencyMs,
        themesCount: themesData?.length || 0,
        rentalsCount: rentalsData?.length || 0,
        customersCount: customersData?.length || 0,
        themes: themesData,
        rentals: rentalsData,
      });
    } catch (err: any) {
      return NextResponse.json({
        configured: true,
        connected: false,
        provider: 'Supabase',
        message: `Falha na conexão com o Supabase: ${err.message || err}`,
      });
    }
  }

  // 2. Verificação do PostgreSQL Hostgator (Fallback)
  if (isPostgresConfigured()) {
    const result = await testPostgresConnection();
    return NextResponse.json({
      configured: true,
      connected: result.success,
      provider: 'Hostgator PostgreSQL',
      ...result,
    });
  }

  // 3. Nenhum banco configurado
  return NextResponse.json({
    configured: false,
    connected: false,
    provider: 'Nenhum (Modo Local)',
    message: 'Nenhum banco configurado no .env.local. Operando com catálogo em memória.',
  });
}
