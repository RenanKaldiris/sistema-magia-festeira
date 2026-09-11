const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.trim().startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const client = new Client({
  host: env.PGHOST,
  port: parseInt(env.PGPORT || '5432'),
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const themeCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'themes';");
  console.log('Themes cols:', themeCols.rows.map(r => r.column_name));

  const themeB64 = await client.query("SELECT count(*) FROM themes WHERE image_url LIKE 'data:image%';");
  console.log('Themes with base64 image_url:', themeB64.rows[0].count);

  const itemB64 = await client.query("SELECT count(*) FROM items WHERE image_url LIKE 'data:image%';");
  console.log('Items with base64 image_url:', itemB64.rows[0].count);

  const mediaB64 = await client.query("SELECT count(*) FROM media WHERE storage_path LIKE 'data:image%';");
  console.log('Media with base64 storage_path:', mediaB64.rows[0].count);

  await client.end();
}

main().catch(console.error);
