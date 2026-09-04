import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

async function run() {
  console.log('📡 Conectando ao PostgreSQL do Supabase...');
  
  // Opções de conexão: Direto e Pooler
  const directConfig = {
    host: 'db.pajxnizsutuaonqpdiut.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '@Rbk171491re',
    ssl: { rejectUnauthorized: false },
  };

  const poolerConfig = {
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.pajxnizsutuaonqpdiut',
    password: '@Rbk171491re',
    ssl: { rejectUnauthorized: false },
  };

  let client;
  try {
    console.log('Tentando conexão direta (db.pajxnizsutuaonqpdiut.supabase.co:5432)...');
    client = new Client(directConfig);
    await client.connect();
    console.log('✅ Conexão direta estabelecida com sucesso!');
  } catch (err) {
    console.log('Falha na direta (' + err.message + '), tentando pooler...');
    client = new Client(poolerConfig);
    await client.connect();
    console.log('✅ Conexão via Pooler estabelecida com sucesso!');
  }

  try {
    const sqlPath = path.resolve(process.cwd(), 'scripts/hostgator-schema.sql');
    console.log('📄 Lendo schema SQL:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Executando criação de tabelas, índices e dados iniciais...');
    await client.query(sql);

    console.log('🔍 Verificando tabelas criadas...');
    const res = await client.query(`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`🎉 Total de tabelas criadas: ${res.rows[0]?.count}`);

    const themesRes = await client.query('SELECT count(*)::int as count FROM themes');
    console.log(`🎨 Total de temas cadastrados: ${themesRes.rows[0]?.count}`);

    const customersRes = await client.query('SELECT count(*)::int as count FROM customers');
    console.log(`👥 Total de clientes cadastrados: ${customersRes.rows[0]?.count}`);

    const rentalsRes = await client.query('SELECT count(*)::int as count FROM rentals');
    console.log(`📅 Total de locações cadastradas: ${rentalsRes.rows[0]?.count}`);

    console.log('\n✨ BANCO DE DADOS NA NUVEM CONFIGURADO COM SUCESSO!');
  } catch (e) {
    console.error('❌ Erro na execução do SQL:', e);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
