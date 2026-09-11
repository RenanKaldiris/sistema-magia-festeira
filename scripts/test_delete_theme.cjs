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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  console.log('Testing delete with Supabase client (anon key)...');

  // 1. Create a dummy test theme in Supabase
  const testId = '00000000-0000-4000-a000-000000000999';
  const insertRes = await supabase.from('themes').insert({
    id: testId,
    tenant_id: 'a0000000-0000-0000-0000-000000000001',
    code: 'MF-TEST-DEL',
    name: 'Tema Teste Deletar',
    slug: 'tema-teste-deletar',
    characters: [],
    piece_count: 10,
    base_price: 150,
    status: 'active',
    stock_quantity: 1,
    featured: false
  });
  console.log('Insert dummy theme result:', insertRes);

  // 2. Try to delete it using .in('id', [testId])
  const deleteRes = await supabase.from('themes').delete().in('id', [testId]);
  console.log('Delete batch result:', deleteRes);

  // 3. Try on one real existing theme (let's check a theme from DB without deleting or check with a rollback query)
  const existingThemes = await supabase.from('themes').select('id, name, code').limit(5);
  console.log('Sample existing themes:', existingThemes.data);

  // Check if any existing theme has associated rows in rentals or other tables
  if (existingThemes.data && existingThemes.data.length > 0) {
    const firstId = existingThemes.data[0].id;
    console.log('Checking references for theme:', firstId, existingThemes.data[0].name);

    const rentals = await supabase.from('rentals').select('id').eq('theme_id', firstId);
    console.log('Rentals referencing this theme:', rentals.data);

    const media = await supabase.from('media').select('id').eq('entity_id', firstId);
    console.log('Media referencing this theme:', media.data?.length);

    const variants = await supabase.from('theme_variants').select('id').eq('theme_id', firstId);
    console.log('Variants referencing this theme:', variants.data?.length);

    const kits = await supabase.from('kits').select('id').eq('theme_id', firstId);
    console.log('Kits referencing this theme:', kits.data?.length);
  }
}

run().catch(console.error);
