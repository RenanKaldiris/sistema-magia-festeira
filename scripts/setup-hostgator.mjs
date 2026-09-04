/**
 * SISTEMA MAGIA FESTEIRA - SCRIPT DE SETUP E MIGRAÇÃO DO POSTGRESQL HOSTGATOR
 * Executa a conexão com o banco no Hostgator, cria as 23 tabelas e insere os dados iniciais.
 * Uso: npm run db:setup
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

// Tenta carregar .env.local manualmente se existir
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
    }
  }
}

loadEnv();

async function runSetup() {
  console.log('\n=============================================================');
  console.log('🐘 SISTEMA MAGIA FESTEIRA - SETUP POSTGRESQL HOSTGATOR');
  console.log('=============================================================\n');

  const connectionString = process.env.DATABASE_URL;
  const host = process.env.PGHOST;
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const isSsl = process.env.PGSSL === 'true';

  const isConfigured = Boolean(connectionString || (host && database && user));

  if (!isConfigured) {
    console.log('⚠️  ATENÇÃO: Nenhuma credencial do PostgreSQL foi configurada ainda!\n');
    console.log('Para conectar o Sistema Magia Festeira ao seu PostgreSQL no Hostgator:');
    console.log('1. Crie o banco e usuário no cPanel da Hostgator (ex: usuario_magia)');
    console.log('2. Habilite o "Acesso Remoto" no cPanel adicionando seu IP ou "%"');
    console.log('3. Preencha as credenciais no arquivo .env.local com:');
    console.log('\n   PGHOST=seu-servidor.hostgator.com.br (ou IP do seu cPanel)');
    console.log('   PGPORT=5432');
    console.log('   PGDATABASE=seu_usuario_nomedobanco');
    console.log('   PGUSER=seu_usuario_nomedousuario');
    console.log('   PGPASSWORD=sua_senha_do_banco');
    console.log('   PGSSL=false (ou true se tiver certificado SSL ativado)');
    console.log('\n4. Em seguida, execute este comando novamente: npm run db:setup\n');
    process.exit(0);
  }

  console.log('📡 Conectando ao PostgreSQL do Hostgator...');
  console.log(`   Host: ${host || (connectionString ? new URL(connectionString).hostname : 'DATABASE_URL')}`);
  console.log(`   Banco: ${database || (connectionString ? new URL(connectionString).pathname.replace('/', '') : 'DATABASE_URL')}`);
  console.log(`   Usuário: ${user || (connectionString ? new URL(connectionString).username : 'DATABASE_URL')}`);

  const client = new Client(
    connectionString
      ? { connectionString, ssl: isSsl ? { rejectUnauthorized: false } : false }
      : { host, port, database, user, password, ssl: isSsl ? { rejectUnauthorized: false } : false }
  );

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso com o servidor Hostgator!\n');

    // Ler script SQL
    const sqlPath = path.resolve(process.cwd(), 'scripts/hostgator-schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo scripts/hostgator-schema.sql não encontrado.`);
    }

    console.log('🚀 Executando criação das 23 tabelas e dados iniciais...');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(sqlContent);

    // Conferir tabelas criadas
    const res = await client.query(`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableCount = res.rows[0]?.count || 0;

    console.log(`🎉 Migração concluída com sucesso! Total de ${tableCount} tabelas no schema public.`);
    console.log('✨ O Sistema Magia Festeira agora está conectado ao seu PostgreSQL no Hostgator!\n');
  } catch (err) {
    console.error('\n❌ Erro durante o processo de conexão / migração:');
    console.error(err.message || err);
    console.log('\n💡 Dica de Diagnóstico Hostgator:');
    console.log('- Verifique se o Host/IP está correto (encontrado no cPanel em "Informações do Servidor").');
    console.log('- No cPanel Hostgator, abra "Bancos de Dados PostgreSQL" > "Acesso Remoto" e adicione seu IP atual ou "%" para autorizar conexões externas.');
    console.log('- Verifique se o usuário do banco tem todas as permissões concedidas (ALL PRIVILEGES).');
  } finally {
    await client.end().catch(() => {});
  }
}

runSetup();
