import pg from 'pg';
const { Client } = pg;

async function enableRealtime() {
  console.log('📡 Conectando ao PostgreSQL do Supabase...');
  const client = new Client({
    host: process.env.PGHOST || 'db.pajxnizsutuaonqpdiut.supabase.co',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '@Rbk171491re',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conexão estabelecida com sucesso!');

  const tables = [
    'themes',
    'theme_variants',
    'kits',
    'kit_items',
    'items',
    'customers',
    'rentals',
    'rental_lines',
    'payments',
    'calendar_sync',
    'categories',
    'media',
  ];

  console.log('⚡ Configurando REPLICA IDENTITY FULL e adicionando tabelas à publicação supabase_realtime...');

  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE ${table} REPLICA IDENTITY FULL;`);
      console.log(`  ✓ REPLICA IDENTITY FULL: ${table}`);
    } catch (err) {
      console.warn(`  ⚠ Falha ao alterar replica identity para ${table}:`, err.message);
    }
  }

  // Obter tabelas já presentes na publicação
  const existingRes = await client.query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'"
  );
  const existingTables = new Set(existingRes.rows.map((r) => r.tablename));

  for (const table of tables) {
    if (!existingTables.has(table)) {
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE ${table};`);
        console.log(`  ✓ Publicada no supabase_realtime: ${table}`);
      } catch (err) {
        console.warn(`  ⚠ Falha ao adicionar ${table} à publicação:`, err.message);
      }
    } else {
      console.log(`  ℹ ${table} já está na publicação supabase_realtime.`);
    }
  }

  const finalRes = await client.query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'"
  );
  console.log('\n🎉 Tabelas ativas no Supabase Realtime:', finalRes.rows.map((r) => r.tablename));

  await client.end();
}

enableRealtime().catch((err) => {
  console.error('❌ Erro fatal ao configurar Realtime:', err);
  process.exit(1);
});
