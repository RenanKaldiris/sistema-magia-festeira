const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// 1. Carregar variáveis de ambiente do .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.trim().startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

const pgClient = new Client({
  host: env.PGHOST,
  port: parseInt(env.PGPORT || '5432', 10),
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('====================================================');
  console.log('INICIANDO MIGRAÇÃO: BASE64 -> SUPABASE STORAGE (.WEBP)');
  console.log('====================================================');
  
  await pgClient.connect();
  console.log('Conectado ao PostgreSQL com sucesso.');

  // Mídias na tabela `media` com Data URL Base64
  const mediaRows = await pgClient.query(
    "SELECT id, entity_type, entity_id, is_primary, storage_path FROM media WHERE storage_path LIKE 'data:image%';"
  );
  console.log(`Encontradas ${mediaRows.rowCount} mídias em Base64 na tabela 'media'.`);

  let migratedMedia = 0;
  let errorMedia = 0;

  for (let i = 0; i < mediaRows.rows.length; i++) {
    const row = mediaRows.rows[i];
    try {
      const match = row.storage_path.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        console.warn(`[SKIP] Mídia ${row.id}: Formato Base64 não reconhecido.`);
        continue;
      }

      const rawBuffer = Buffer.from(match[2], 'base64');
      const originalBytes = rawBuffer.length;

      // Conversão obrigatória Sharp para WebP 60%
      const webpBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60, effort: 4 })
        .toBuffer();

      const storageFilePath = `uploads/migrated/${row.entity_type || 'entity'}-${row.id}.webp`;

      // Upload para Supabase Storage bucket photos
      const { error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(storageFilePath, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

      if (uploadErr) {
        console.error(`[ERRO UPLOAD] ${row.id}:`, uploadErr.message);
        errorMedia++;
        continue;
      }

      const { data: pubData } = supabase.storage.from('photos').getPublicUrl(storageFilePath);
      const publicUrl = pubData.publicUrl;

      // Atualiza tabela media no PostgreSQL
      await pgClient.query(
        "UPDATE media SET storage_path = $1, thumbnail_path = $1, mime_type = 'image/webp', file_size = $2 WHERE id = $3;",
        [publicUrl, webpBuffer.length, row.id]
      );

      migratedMedia++;
      const savedPercent = ((1 - webpBuffer.length / originalBytes) * 100).toFixed(0);
      if (migratedMedia % 10 === 0 || migratedMedia === mediaRows.rowCount) {
        console.log(`[PROGRESSO] ${migratedMedia}/${mediaRows.rowCount} mídias migradas (${(originalBytes / 1024).toFixed(0)}KB -> ${(webpBuffer.length / 1024).toFixed(0)}KB, -${savedPercent}%).`);
      }
    } catch (err) {
      console.error(`[FALHA] Mídia ${row.id}:`, err.message);
      errorMedia++;
    }
  }

  // Estatísticas finais
  const remainingBase64 = await pgClient.query("SELECT count(*) FROM media WHERE storage_path LIKE 'data:image%';");
  console.log('\n====================================================');
  console.log(`MIGRAÇÃO FINALIZADA COM SUCESSO!`);
  console.log(`Mídias migradas com sucesso: ${migratedMedia}`);
  console.log(`Mídias com erro: ${errorMedia}`);
  console.log(`Base64 restantes na tabela media: ${remainingBase64.rows[0].count}`);
  console.log('====================================================');

  await pgClient.end();
}

main().catch(err => {
  console.error('Falha fatal na migração:', err);
  process.exit(1);
});
