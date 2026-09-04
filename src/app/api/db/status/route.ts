import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { testPostgresConnection, isPostgresConfigured } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  // 1. Verificação do Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('themes').select('id, name, code').limit(5);

      const latencyMs = Date.now() - start;

      if (error) {
        // Se a tabela ainda não existe no schema, o banco respondeu (conectou), mas precisa rodar o script SQL
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          return NextResponse.json({
            configured: true,
            connected: true,
            tablesReady: false,
            provider: 'Supabase (São Paulo)',
            latencyMs,
            message: 'Conectado ao Supabase! O banco está pronto, aguardando a execução do script SQL no SQL Editor para criar as tabelas.',
          });
        }

        return NextResponse.json({
          configured: true,
          connected: false,
          tablesReady: false,
          provider: 'Supabase',
          error: error.message,
          latencyMs,
          message: `Erro na resposta do Supabase: ${error.message}`,
        });
      }

      return NextResponse.json({
        configured: true,
        connected: true,
        tablesReady: true,
        provider: 'Supabase (São Paulo)',
        latencyMs,
        themesCount: data?.length || 0,
        message: `Conectado com sucesso ao Supabase! (${data?.length || 0} temas carregados)`,
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
