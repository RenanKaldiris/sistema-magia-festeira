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
  // Let's inspect themes and rentals
  const themesRes = await supabase.from('themes').select('id, name, code').limit(10);
  console.log('Themes sample:');
  for (const t of themesRes.data) {
    const rentals = await supabase.from('rentals').select('id').eq('theme_id', t.id);
    console.log(`Theme: ${t.name} (${t.code}, id: ${t.id}) -> rentals: ${rentals.data?.length}`);
  }
}

run().catch(console.error);
