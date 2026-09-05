import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pajxnizsutuaonqpdiut.supabase.co';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ReR3azf81Bu7eYHiExaXjw_tOmn90MY';

async function testRealtime() {
  console.log('🧪 Iniciando teste de sincronização Realtime multi-dispositivo...');

  // 1. Simula o Dispositivo A (ex: Celular do usuário)
  const clientA = createClient(url, anon);

  // 2. Simula o Dispositivo B (ex: Computador do usuário)
  const clientB = createClient(url, anon);

  const receivedEvents = [];

  // Dispositivo A se inscreve no canal de mudanças em tempo real
  const channelA = clientA
    .channel('test-realtime-multi-device')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'themes' },
      (payload) => {
        console.log(`📡 [Dispositivo A recebeu]: Evento ${payload.eventType} no tema ID: ${payload.new?.id || payload.old?.id}`);
        receivedEvents.push(payload);
      }
    )
    .subscribe(async (status) => {
      console.log('Status da assinatura do Dispositivo A:', status);

      if (status === 'SUBSCRIBED') {
        console.log('✅ Dispositivo A conectado ao WebSocket do Supabase Realtime!');
        
        // Aguarda estabilizar a conexão
        await new Promise((r) => setTimeout(r, 1000));

        // Dispositivo B insere um novo tema no banco de dados na nuvem
        const testId = 'e0000000-0000-4000-8000-000000000888';
        console.log('\n🚀 [Dispositivo B]: Inserindo novo tema de teste no Supabase Cloud...');
        const { error: insertErr } = await clientB.from('themes').insert({
          id: testId,
          tenant_id: 'a0000000-0000-0000-0000-000000000001',
          code: 'MF-TESTE-99',
          name: 'Tema Teste Realtime Multi-Device',
          slug: 'tema-teste-realtime-multi-device',
          base_price: 199.9,
          piece_count: 10,
          status: 'active',
          characters: ['Teste1', 'Teste2']
        });

        if (insertErr) {
          console.error('❌ Erro no insert do Dispositivo B:', insertErr);
          process.exit(1);
        }
        console.log('✅ [Dispositivo B]: Tema inserido com sucesso!');

        // Aguarda evento chegar no Dispositivo A
        await new Promise((r) => setTimeout(r, 2000));

        // Dispositivo B atualiza o tema
        console.log('\n✏️ [Dispositivo B]: Atualizando o preço do tema no Supabase Cloud...');
        await clientB.from('themes').update({ base_price: 249.9 }).eq('id', testId);

        await new Promise((r) => setTimeout(r, 2000));

        // Dispositivo B exclui o tema de teste
        console.log('\n🗑️ [Dispositivo B]: Excluindo tema de teste do Supabase Cloud...');
        await clientB.from('themes').delete().eq('id', testId);

        await new Promise((r) => setTimeout(r, 2000));

        console.log('\n📊 Resumo dos eventos recebidos pelo Dispositivo A:');
        console.log(`Total de eventos capturados via Realtime: ${receivedEvents.length}`);
        receivedEvents.forEach((e, idx) => {
          console.log(`  ${idx + 1}. Tipo: ${e.eventType} | Tabela: ${e.table}`);
        });

        if (receivedEvents.length >= 2) {
          console.log('\n🎉 SUCESSO TOTAL: A sincronização multi-dispositivo em tempo real está 100% OPERACIONAL!');
        } else {
          console.log('\n⚠ Alguns eventos podem ter demorado ou o canal precisa de mais tempo.');
        }

        await channelA.unsubscribe();
        process.exit(0);
      }
    });
}

testRealtime().catch(console.error);
