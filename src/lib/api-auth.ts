import { NextResponse } from 'next/server';

/**
 * SISTEMA MAGIA FESTEIRA - AUTENTICAÇÃO E CONTROLE DE ACESSO DA API
 * Valida requisições externas vindas de robôs de WhatsApp (Evolution API, Z-API),
 * CRMs (Kommo, RD Station, HubSpot) e ferramentas de automação (n8n, Make).
 */

export const DEFAULT_DEV_API_KEY = 'mf_live_sec_magiafesteira2026';

export function getExpectedApiKey(): string {
  return process.env.MAGIA_API_KEY || process.env.API_SECRET_KEY || DEFAULT_DEV_API_KEY;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, X-Requested-With',
};

export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

export function validateApiAuth(request: Request): {
  authorized: boolean;
  errorResponse?: NextResponse;
} {
  // Permitir preflight OPTIONS sem verificação
  if (request.method === 'OPTIONS') {
    return { authorized: true };
  }

  const expectedKey = getExpectedApiKey();

  // 1. Verificar cabeçalho 'x-api-key'
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey && xApiKey.trim() === expectedKey) {
    return { authorized: true };
  }

  // 2. Verificar cabeçalho 'Authorization: Bearer <key>'
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerKey = authHeader.replace('Bearer ', '').trim();
    if (bearerKey === expectedKey) {
      return { authorized: true };
    }
  }

  // 3. Fallback de verificação por query param ?api_key= (útil para webhooks simples)
  try {
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('api_key');
    if (queryKey && queryKey.trim() === expectedKey) {
      return { authorized: true };
    }
  } catch {
    // Ignora erro de parsing de URL
  }

  return {
    authorized: false,
    errorResponse: apiError(
      'Não autorizado: Chave de API ausente ou inválida. Envie o cabeçalho "x-api-key: SUA_CHAVE" ou "Authorization: Bearer SUA_CHAVE".',
      401,
      { hint: 'Consulte a documentação e sua chave em /admin/integracoes' }
    ),
  };
}
