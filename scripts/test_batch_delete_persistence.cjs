const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.trim().startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('--- TESTANDO EXCLUSÃO EM LOTE NO SUPABASE (PERSISTÊNCIA PÓS-REFRESH) ---');

  const testIds = [
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003'
  ];

  // 1. Inserir 3 temas de teste com mídias e variações
  for (let i = 0; i < 3; i++) {
    await supabase.from('themes').upsert({
      id: testIds[i],
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      code: `MF-BATCH-${i + 1}`,
      name: `Tema Lote ${i + 1}`,
      slug: `tema-lote-${i + 1}`,
      characters: ['Teste'],
      piece_count: 10,
      base_price: 150,
      status: 'active',
      stock_quantity: 1,
      featured: false
    });

    await supabase.from('media').upsert({
      id: `m0000000-0000-4000-b000-00000000000${i + 1}`,
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'theme',
      entity_id: testIds[i],
      storage_path: `https://test.com/photo-${i + 1}.webp`,
      original_name: `photo-${i + 1}.webp`,
      mime_type: 'image/webp',
      file_size: 10000,
      fingerprint: `test-fp-${i + 1}`,
      is_primary: true
    });
  }

  console.log('1. Inseridos 3 temas de teste com mídia no Supabase.');

  // 2. Executar a lógica de exclusão do store
  console.log('2. Executando exclusão em lote no Supabase...');
  // A) Deletar mídias
  const mediaDel = await supabase.from('media').delete().eq('entity_type', 'theme').in('entity_id', testIds);
  console.log('Mídias deletadas:', mediaDel.error || 'OK');

  // B) Deletar temas
  const themesDel = await supabase.from('themes').delete().in('id', testIds);
  console.log('Temas deletados:', themesDel.error || 'OK');

  // 3. Simular o F5 / syncWithSupabase()
  console.log('3. Simulando F5 / syncWithSupabase()...');
  const syncThemes = await supabase.from('themes').select('*').in('id', testIds);
  const syncMedia = await supabase.from('media').select('*').in('entity_id', testIds);

  console.log('Resultado do "F5" para temas (deve ser vazio 0):', syncThemes.data?.length);
  console.log('Resultado do "F5" para mídias (deve ser vazio 0):', syncMedia.data?.length);

  if (syncThemes.data?.length === 0 && syncMedia.data?.length === 0) {
    console.log('🎉 SUCESSO ABSOLUTO! Os temas foram permanentemente excluídos e NUNCA MAIS voltam no F5!');
  } else {
    console.error('❌ FALHA: Os temas ainda existem no Supabase!');
    process.exit(1);
  }
}

run().catch(console.error);
