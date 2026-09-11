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

    console.log('Altering rentals table constraints to ON DELETE SET NULL...');
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

    // Now test deleting Vingadores in this transaction to verify it works!
    const testDel = await client.query("DELETE FROM themes WHERE id = 'e0000000-0000-0000-0000-000000000001';");
    console.log('Successfully deleted Vingadores with cascade / set null! Rows deleted:', testDel.rowCount);

    // Rollback so we don't delete Vingadores unless we want to, or commit the constraint migration!
    await client.query('ROLLBACK;');
    console.log('Constraint test succeeded and transaction rolled back.');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Error during test:', err);
  }

  await client.end();
}

run().catch(console.error);
