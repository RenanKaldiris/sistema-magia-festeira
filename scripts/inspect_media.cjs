const fs = require('fs');
const path = require('path');

// Parse .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const lines = envContent.split('\n');
for (const line of lines) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.trim().startsWith('#')) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    process.env[k] = v;
  }
}

const { Client } = require('pg');
const client = new Client({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'media' ORDER BY ordinal_position;");
  console.log('Columns in media table:');
  console.table(cols.rows);

  const res = await client.query("SELECT id, tenant_id, entity_type, entity_id, mime_type, file_size, is_primary, sort_order, length(storage_path) as path_len, substring(storage_path, 1, 60) as path_preview FROM media ORDER BY created_at ASC;");
  console.log('Total media rows:', res.rowCount);
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
