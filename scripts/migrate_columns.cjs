const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    host: process.env.PGHOST || 'db.pajxnizsutuaonqpdiut.supabase.co',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '@Rbk171491re',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL Supabase!');

    await client.query('ALTER TABLE themes ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(10,2);');
    await client.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(10,2);');
    await client.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS show_prices BOOLEAN DEFAULT TRUE;');
    await client.query('ALTER TABLE kits ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(10,2);');
    await client.query('ALTER TABLE kits ADD COLUMN IF NOT EXISTS image_url TEXT;');
    await client.query('ALTER TABLE theme_variants ADD COLUMN IF NOT EXISTS image_url TEXT;');
    console.log('Columns added successfully!');

    const resThemes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'themes';");
    console.log('Themes columns:', resThemes.rows.map(r => r.column_name));

    const resItems = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'items';");
    console.log('Items columns:', resItems.rows.map(r => r.column_name));

    await client.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
