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
  // Insert 3 test dummy themes
  const testIds = [
    '00000000-0000-4000-a000-000000000101',
    '00000000-0000-4000-a000-000000000102',
    '00000000-0000-4000-a000-000000000103'
  ];

  for (let i = 0; i < 3; i++) {
    await supabase.from('themes').upsert({
      id: testIds[i],
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      code: `MF-DEL-${i}`,
      name: `Tema Del ${i}`,
      slug: `tema-del-${i}`,
      characters: [],
      piece_count: 5,
      base_price: 100,
      status: 'active',
      stock_quantity: 1,
      featured: false
    });
  }
  console.log('Inserted 3 test themes.');

  // Now delete them using .delete().in('id', testIds)
  const delRes = await supabase.from('themes').delete().in('id', testIds);
  console.log('Delete result:', delRes);

  // Check if they are still there
  const check = await supabase.from('themes').select('id').in('id', testIds);
  console.log('Check after delete (should be empty):', check.data);
}

run().catch(console.error);
