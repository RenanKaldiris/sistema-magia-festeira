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
    await client.query('BEGIN;');

    console.log('Applying permanent constraint updates to rentals table...');
    await client.query('ALTER TABLE rentals ALTER COLUMN theme_id DROP NOT NULL;');

    await client.query('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_theme_id_fkey;');
    await client.query(`
      ALTER TABLE rentals ADD CONSTRAINT rentals_theme_id_fkey 
      FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL;
    `);

    await client.query('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_theme_variant_id_fkey;');
    await client.query(`
      ALTER TABLE rentals ADD CONSTRAINT rentals_theme_variant_id_fkey 
      FOREIGN KEY (theme_variant_id) REFERENCES theme_variants(id) ON DELETE SET NULL;
    `);

    await client.query('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_kit_id_fkey;');
    await client.query(`
      ALTER TABLE rentals ADD CONSTRAINT rentals_kit_id_fkey 
      FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE SET NULL;
    `);

    await client.query('COMMIT;');
    console.log('✅ Constraints successfully updated with ON DELETE SET NULL in PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Failed to apply migration:', err);
    process.exit(1);
  }

  await client.end();
}

run().catch(console.error);
