import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

/**
 * Conexão com o Banco de Dados PostgreSQL no Hostgator / Supabase
 * Suporta string de conexão única (DATABASE_URL) ou variáveis individuais (PGHOST, PGUSER, etc.).
 */

const getPoolConfig = (): PoolConfig => {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    const isSsl = process.env.PGSSL === 'true' || connectionString.includes('sslmode=require');
    return {
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  const isSsl = process.env.PGSSL === 'true';

  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || '',
    user: process.env.PGUSER || '',
    password: process.env.PGPASSWORD || '',
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

export const isPostgresConfigured = (): boolean => {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10) {
    return true;
  }
  return Boolean(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER);
};

// Singleton pool para evitar múltiplas instâncias em Next.js dev server
declare global {
  // eslint-disable-next-line no-var
  var __postgresPool: Pool | undefined;
}

export const getPool = (): Pool => {
  if (!global.__postgresPool) {
    global.__postgresPool = new Pool(getPoolConfig());
    
    global.__postgresPool.on('error', (err: any) => {
      console.error('[PostgreSQL] Erro inesperado no cliente do pool:', err);
    });
  }
  return global.__postgresPool;
};

/**
 * Executa uma consulta SQL parametrizada de forma segura
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

/**
 * Realiza um teste de integridade e conectividade com o banco
 */
export async function testPostgresConnection(): Promise<{
  success: boolean;
  message: string;
  host?: string;
  database?: string;
  tableCount?: number;
  latencyMs?: number;
  error?: string;
}> {
  if (!isPostgresConfigured()) {
    return {
      success: false,
      message: 'PostgreSQL não configurado. Adicione as credenciais no arquivo .env.local.',
    };
  }

  const start = Date.now();
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      // 1. Testar query simples
      await client.query('SELECT 1');

      // 2. Contar tabelas criadas no schema public
      const tableCountRes = await client.query(`
        SELECT count(*)::int as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableCount = tableCountRes.rows[0]?.count || 0;

      const latencyMs = Date.now() - start;
      const host = process.env.PGHOST || (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'configurado');
      const database = process.env.PGDATABASE || (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.replace('/', '') : 'configurado');

      return {
        success: true,
        message: `Conexão com o PostgreSQL estabelecida com sucesso! (${tableCount} tabelas encontradas)`,
        host,
        database,
        tableCount,
        latencyMs,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      message: `Falha ao conectar no PostgreSQL: ${err.message || err}`,
      error: err.code || err.message,
      latencyMs,
    };
  }
}
