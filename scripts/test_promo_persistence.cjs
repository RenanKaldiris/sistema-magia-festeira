const { createClient } = require('@supabase/supabase-js');

const url = 'https://pajxnizsutuaonqpdiut.supabase.co';
const anonKey = 'sb_publishable_ReR3azf81Bu7eYHiExaXjw_tOmn90MY';
const supabase = createClient(url, anonKey);

async function run() {
  // 1. Fetch first theme
  const { data: themes, error: fetchErr } = await supabase.from('themes').select('id, name, base_price, promotional_price').limit(1);
  if (fetchErr || !themes || themes.length === 0) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  const theme = themes[0];
  console.log('Original theme:', theme);

  // 2. Update promotional_price with decimal
  const testPromo = 149.99;
  const { data: updateData, error: updateErr } = await supabase
    .from('themes')
    .update({ promotional_price: testPromo })
    .eq('id', theme.id)
    .select();

  console.log('Update result:', updateData, updateErr);

  // 3. Fetch again to verify persistence
  const { data: reFetched } = await supabase.from('themes').select('id, name, promotional_price').eq('id', theme.id).single();
  console.log('Re-fetched theme:', reFetched);

  // 4. Reset back
  await supabase.from('themes').update({ promotional_price: theme.promotional_price }).eq('id', theme.id);
  console.log('Reset complete!');
}

run();
