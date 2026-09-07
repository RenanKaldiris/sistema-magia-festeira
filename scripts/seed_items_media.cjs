const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'db.pajxnizsutuaonqpdiut.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '@Rbk171491re',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const itemMediaSeeds = [
    {
      id: '20000000-0000-0000-0000-000000000011',
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'item',
      entity_id: 'd0000000-0000-0000-0000-000000000001',
      storage_path: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
      original_name: 'comoda_fake_branca.jpg',
      mime_type: 'image/jpeg',
      file_size: 450000,
      fingerprint: 'sha256-item-comoda-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['comoda', 'mobilia', 'branca']
    },
    {
      id: '20000000-0000-0000-0000-000000000012',
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'item',
      entity_id: 'd0000000-0000-0000-0000-000000000002',
      storage_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      original_name: 'display_vingadores.jpg',
      mime_type: 'image/jpeg',
      file_size: 520000,
      fingerprint: 'sha256-item-vingadores-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['display', 'vingadores', 'chao']
    },
    {
      id: '20000000-0000-0000-0000-000000000013',
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'item',
      entity_id: 'd0000000-0000-0000-0000-000000000003',
      storage_path: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
      original_name: 'painel_redondo_ripado.jpg',
      mime_type: 'image/jpeg',
      file_size: 610000,
      fingerprint: 'sha256-item-painel-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['painel', 'ripado', 'madeira']
    },
    {
      id: '20000000-0000-0000-0000-000000000014',
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'item',
      entity_id: 'd0000000-0000-0000-0000-000000000004',
      storage_path: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
      original_name: 'arco_baloes_organico.jpg',
      mime_type: 'image/jpeg',
      file_size: 580000,
      fingerprint: 'sha256-item-baloes-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['arco', 'baloes', 'cenografia']
    },
    {
      id: '20000000-0000-0000-0000-000000000015',
      tenant_id: 'a0000000-0000-0000-0000-000000000001',
      entity_type: 'item',
      entity_id: 'd0000000-0000-0000-0000-000000000005',
      storage_path: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&auto=format&fit=crop&q=80',
      original_name: 'tapete_grama_sintetica.jpg',
      mime_type: 'image/jpeg',
      file_size: 490000,
      fingerprint: 'sha256-item-tapete-01',
      sort_order: 1,
      is_primary: true,
      ai_tags: ['tapete', 'grama', 'piso']
    }
  ];

  for (const m of itemMediaSeeds) {
    await client.query(`
      INSERT INTO media (id, tenant_id, entity_type, entity_id, storage_path, original_name, mime_type, file_size, fingerprint, sort_order, is_primary, ai_tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        storage_path = EXCLUDED.storage_path,
        is_primary = EXCLUDED.is_primary;
    `, [m.id, m.tenant_id, m.entity_type, m.entity_id, m.storage_path, m.original_name, m.mime_type, m.file_size, m.fingerprint, m.sort_order, m.is_primary, m.ai_tags]);
  }

  console.log('Seeded items media in Supabase!');
  await client.end();
}

run();
