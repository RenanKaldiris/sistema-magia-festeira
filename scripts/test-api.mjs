/**
 * SISTEMA MAGIA FESTEIRA - SUITE DE TESTES AUTOMATIZADOS DA API RESTFUL v1
 * Valida autenticação, clientes, locações, pagamentos, disponibilidade e webhook do WhatsApp.
 * Uso: node scripts/test-api.mjs
 */

import http from 'http';

const API_KEY = 'mf_live_sec_magiafesteira2026';
const PORT = 3000;

async function request(path, options = {}) {
  const url = `http://localhost:${PORT}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const json = await res.json().catch(() => null);
  return { status: res.status, data: json };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 SISTEMA MAGIA FESTEIRA - TESTES DA API RESTful v1');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} ${extra}`);
      failed++;
    }
  }

  try {
    // 1. Teste de Autenticação - Sem Chave (Esperado: 401)
    console.log('--- 1. SEGURANÇA & AUTENTICAÇÃO ---');
    const resNoAuth = await request('/api/v1/customers');
    assert('Bloqueio 401 quando sem x-api-key', resNoAuth.status === 401);

    // 2. Teste de Autenticação - Chave Inválida (Esperado: 401)
    const resBadAuth = await request('/api/v1/customers', {
      headers: { 'x-api-key': 'chave_incorreta_123' },
    });
    assert('Bloqueio 401 com x-api-key inválida', resBadAuth.status === 401);

    // 3. Teste de Autenticação - Chave Válida (Esperado: 200)
    const resAuth = await request('/api/v1/customers', {
      headers: { 'x-api-key': API_KEY },
    });
    assert('Acesso 200 permitido com x-api-key válida', resAuth.status === 200 && resAuth.data.success);

    // 4. Teste de Clientes - Criar Cliente
    console.log('\n--- 2. CLIENTES (CUSTOMERS) ---');
    const testPhone = `11999${Math.floor(10000 + Math.random() * 90000)}`;
    const createCustomerRes = await request('/api/v1/customers', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: {
        name: 'Marina Ruy Teste',
        phone: testPhone,
        email: 'marina.teste@email.com',
        notes: 'Cliente teste automatizado',
      },
    });
    assert(
      'POST /api/v1/customers cria novo cliente',
      createCustomerRes.status === 201 && createCustomerRes.data.data?.name === 'Marina Ruy Teste'
    );
    const createdCustomerId = createCustomerRes.data.data?.id;

    // 5. Teste de Clientes - Buscar por Telefone
    const findByPhoneRes = await request(`/api/v1/customers/by-phone?phone=${testPhone}`, {
      headers: { 'x-api-key': API_KEY },
    });
    assert(
      'GET /api/v1/customers/by-phone localiza cliente pelo telefone',
      findByPhoneRes.status === 200 && findByPhoneRes.data.found === true
    );

    // 6. Teste de Catálogo & Disponibilidade
    console.log('\n--- 3. CATÁLOGO & DISPONIBILIDADE ---');
    const themesRes = await request('/api/v1/themes', {
      headers: { 'x-api-key': API_KEY },
    });
    assert(
      'GET /api/v1/themes retorna lista de temas',
      themesRes.status === 200 && Array.isArray(themesRes.data.data) && themesRes.data.data.length > 0
    );

    const availRes = await request(
      '/api/v1/availability?themeName=Vingadores&pickupDate=2026-11-10&returnDate=2026-11-12',
      {
        headers: { 'x-api-key': API_KEY },
      }
    );
    assert(
      'GET /api/v1/availability calcula disponibilidade de estoque',
      availRes.status === 200 && availRes.data.data?.found === true
    );

    // 7. Teste de Pedidos / Locações - Criar com auto-cadastro de cliente
    console.log('\n--- 4. PEDIDOS & LOCAÇÕES (RENTALS) ---');
    const orderCustomerPhone = `11988${Math.floor(10000 + Math.random() * 90000)}`;
    const createRentalRes = await request('/api/v1/rentals', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: {
        customerName: 'Lucas Pedido Automatizado',
        customerPhone: orderCustomerPhone,
        themeQuery: 'Vingadores',
        eventDate: '2026-11-20',
        pickupDate: '2026-11-19',
        returnDate: '2026-11-21',
        total: 250.0,
        paid: 50.0,
        paymentMethod: 'pix',
        notes: 'Pedido teste com sinal de R$ 50',
      },
    });

    assert(
      'POST /api/v1/rentals cria pedido e cadastra cliente automaticamente',
      createRentalRes.status === 201 && createRentalRes.data.data?.rental?.total === 250
    );
    const createdRentalId = createRentalRes.data.data?.rental?.id;

    // 8. Teste de Pagamentos - Abater saldo com quitação
    console.log('\n--- 5. FINANCEIRO & PAGAMENTOS ---');
    if (createdRentalId) {
      const paymentRes = await request(`/api/v1/rentals/${createdRentalId}/payments`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: {
          amount: 200.0,
          method: 'pix',
          note: 'Quitação final de R$ 200',
        },
      });

      assert(
        'POST /api/v1/rentals/[id]/payments abate saldo e quita pedido',
        paymentRes.status === 201 && paymentRes.data.data?.rental?.balance === 0
      );
    }

    // 9. Teste do Webhook WhatsApp
    console.log('\n--- 6. WEBHOOK DO WHATSAPP & IA ---');
    const webhookRes = await request('/api/v1/webhook/whatsapp', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: {
        senderPhone: '5511977823876',
        message: 'Cadastrar cliente Roberto TesteWebhook 11977776666',
      },
    });

    assert(
      'POST /api/v1/webhook/whatsapp executa comando e retorna replyMessage',
      webhookRes.status === 200 &&
        webhookRes.data.action === 'CUSTOMER_UPSERT' &&
        typeof webhookRes.data.replyMessage === 'string'
    );

    console.log('\n=============================================================');
    console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Erro na execução dos testes (o servidor dev precisa estar rodando na porta 3000):', err.message);
    process.exit(1);
  }
}

runTests();
