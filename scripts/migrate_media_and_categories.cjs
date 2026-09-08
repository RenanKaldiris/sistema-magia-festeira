const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

const pgClient = new Client({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await pgClient.connect();
  console.log('Connected to PostgreSQL database.');

  // 1. Assign categories to themes that currently have category_id = null
  console.log('\n--- 1. Categorizando Temas Existentes ---');
  const catMap = {
    'Homem-Aranha': 'c0000000-0000-0000-0000-000000000001', // Super-heróis
    'Naruto': 'c0000000-0000-0000-0000-000000000002',       // Infantil Meninos
    'Game': 'c0000000-0000-0000-0000-000000000002',         // Infantil Meninos
    'Hot Wheels': 'c0000000-0000-0000-0000-000000000002',   // Infantil Meninos
    'Dinossauros': 'c0000000-0000-0000-0000-000000000002',  // Infantil Meninos
    'Manicrafit': 'c0000000-0000-0000-0000-000000000002',   // Infantil Meninos
    'Simpsons': 'c0000000-0000-0000-0000-000000000002',     // Infantil Meninos
    'Pepa Pig': 'c0000000-0000-0000-0000-000000000003',     // Infantil Meninas
    'Moana Baby': 'c0000000-0000-0000-0000-000000000003',   // Infantil Meninas
    'Baby Shark': 'c0000000-0000-0000-0000-000000000004',   // 1º Aninho & Chá de Bebê
    'Ursinho 1': 'c0000000-0000-0000-0000-000000000004',    // 1º Aninho & Chá de Bebê
    'Blippi': 'c0000000-0000-0000-0000-000000000004',       // 1º Aninho & Chá de Bebê
    'Fazendinha': 'c0000000-0000-0000-0000-000000000004',   // 1º Aninho & Chá de Bebê
    'Pjmax': 'c0000000-0000-0000-0000-000000000004',        // 1º Aninho & Chá de Bebê
    'Boteco': 'c0000000-0000-0000-0000-000000000005',       // Temas Especiais & Adultos
    'Churrasco': 'c0000000-0000-0000-0000-000000000005',    // Temas Especiais & Adultos
    'Cha Bar': 'c0000000-0000-0000-0000-000000000005',      // Temas Especiais & Adultos
  };

  for (const [themeName, catId] of Object.entries(catMap)) {
    const res = await pgClient.query('UPDATE themes SET category_id = $1 WHERE name = $2 AND category_id IS NULL;', [catId, themeName]);
    if (res.rowCount > 0) {
      console.log(`Atualizada categoria de "${themeName}" -> ${catId}`);
    }
  }

  // 2. Remove orphan media where theme was deleted
  console.log('\n--- 2. Limpando Mídias Órfãs de Temas Inexistentes ---');
  const orphanRes = await pgClient.query(
    "DELETE FROM media WHERE entity_type = 'theme' AND entity_id NOT IN (SELECT id FROM themes);"
  );
  console.log(`Removidas ${orphanRes.rowCount} mídias órfãs.`);

  // 3. Fetch all remaining media with base64 data URLs
  console.log('\n--- 3. Migrando Base64 para Supabase Storage (.WEBP com 60% qualidade) ---');
  const mediaRes = await pgClient.query(
    "SELECT id, entity_type, entity_id, mime_type, storage_path FROM media WHERE storage_path LIKE 'data:image%';"
  );
  console.log(`Encontradas ${mediaRes.rowCount} mídias base64 para conversão e migração.`);

  for (const row of mediaRes.rows) {
    try {
      const match = row.storage_path.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        console.warn(`Formato base64 inválido na mídia ${row.id}`);
        continue;
      }

      const rawBuffer = Buffer.from(match[2], 'base64');
      const originalBytes = rawBuffer.length;

      // Conversão obrigatória Sharp para .WEBP qualidade 60%
      const webpBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60, effort: 4 })
        .toBuffer();

      const storageFilePath = `migrated/${row.entity_type}-${row.id}.webp`;

      // Upload para bucket photos
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(storageFilePath, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

      if (uploadErr) {
        console.error(`Erro ao subir arquivo ${storageFilePath} no Supabase:`, uploadErr.message);
        continue;
      }

      const { data: pubData } = supabase.storage.from('photos').getPublicUrl(storageFilePath);
      const publicUrl = pubData.publicUrl;

      // Atualiza PostgreSQL
      await pgClient.query(
        "UPDATE media SET storage_path = $1, thumbnail_path = $1, mime_type = 'image/webp', file_size = $2 WHERE id = $3;",
        [publicUrl, webpBuffer.length, row.id]
      );

      console.log(`✅ [${row.entity_type}] ${row.id}: ${(originalBytes / 1024).toFixed(1)}KB -> ${(webpBuffer.length / 1024).toFixed(1)}KB (redução de ${((1 - webpBuffer.length / originalBytes) * 100).toFixed(0)}%) -> ${publicUrl}`);
    } catch (err) {
      console.error(`Erro processando mídia ${row.id}:`, err);
    }
  }

  // 4. Verify results
  console.log('\n--- 4. Verificação Final das Mídias ---');
  const verifyRes = await pgClient.query(
    "SELECT id, entity_type, entity_id, mime_type, file_size, length(storage_path) as path_len, substring(storage_path, 1, 65) as preview FROM media ORDER BY created_at ASC;"
  );
  console.table(verifyRes.rows);

  await pgClient.end();
  console.log('Migração concluída com sucesso!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
