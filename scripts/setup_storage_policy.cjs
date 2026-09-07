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
  try {
    const pols = await client.query("SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'");
    console.log('Existing storage policies:', pols.rows.map(r => r.policyname));

    await client.query(`
      DROP POLICY IF EXISTS "Public Full Access Photos" ON storage.objects;
      CREATE POLICY "Public Full Access Photos" ON storage.objects
      FOR ALL
      TO public
      USING (bucket_id = 'photos')
      WITH CHECK (bucket_id = 'photos');
    `);
    console.log('Successfully created "Public Full Access Photos" policy!');
  } catch (err) {
    console.error('Error creating policy:', err);
  } finally {
    await client.end();
  }
}

run();
