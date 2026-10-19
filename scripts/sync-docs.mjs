// SISTEMA MAGIA FESTEIRA - SCRIPT DE AUDITORIA & SINCRONIZAÇÃO DA DOCUMENTAÇÃO
// 
// Este script varre automaticamente:
// 1. Todas as rotas de páginas (src/app)
// 2. Todas as rotas de API (src/app/api)
// 3. Todos os componentes reutilizáveis (src/components)
// 4. As entidades de banco de dados e scripts operacionais
// 
// Gera um mapa completo em docs/PROJECT_MAP.json e verifica a integridade
// do Manual Mestre (docs/MANUAL_SISTEMA_COMPLETO.md).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function walkDir(dir, filterRegex) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walkDir(fullPath, filterRegex));
      }
    } else if (filterRegex.test(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('🔍 [Magia Festeira] Iniciando auditoria e sincronização do sistema...');

// 1. Mapear Rotas de Páginas
const pageFiles = walkDir(path.join(rootDir, 'src', 'app'), /page\.tsx$/);
const pages = pageFiles.map((p) => {
  const rel = path.relative(path.join(rootDir, 'src', 'app'), p).replace(/\\/g, '/');
  let route = '/' + rel.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  return {
    route: route || '/',
    file: 'src/app/' + rel,
  };
});

// 2. Mapear Rotas de API
const apiFiles = walkDir(path.join(rootDir, 'src', 'app', 'api'), /route\.ts$/);
const apis = apiFiles.map((p) => {
  const rel = path.relative(path.join(rootDir, 'src', 'app'), p).replace(/\\/g, '/');
  let route = '/' + rel.replace(/\/route\.ts$/, '');
  return {
    endpoint: route,
    file: 'src/app/' + rel,
  };
});

// 3. Mapear Componentes
const componentFiles = walkDir(path.join(rootDir, 'src', 'components'), /\.(tsx|jsx)$/);
const components = componentFiles.map((p) => {
  const rel = path.relative(path.join(rootDir, 'src', 'components'), p).replace(/\\/g, '/');
  const name = path.basename(p, path.extname(p));
  return {
    name,
    path: 'src/components/' + rel,
  };
});

// 4. Mapear Scripts de Suporte & Testes
const scriptFiles = walkDir(path.join(rootDir, 'scripts'), /\.(mjs|js|cjs)$/);
const scripts = scriptFiles.map((p) => path.basename(p));

// 5. Compilar o Mapa Geral
const projectMap = {
  lastSync: new Date().toISOString(),
  projectName: 'Sistema Magia Festeira',
  version: '1.2.0',
  summary: {
    totalPages: pages.length,
    totalApiRoutes: apis.length,
    totalComponents: components.length,
    totalScripts: scripts.length,
  },
  pages,
  apis,
  components,
  scripts,
};

const mapPath = path.join(rootDir, 'docs', 'PROJECT_MAP.json');
fs.writeFileSync(mapPath, JSON.stringify(projectMap, null, 2), 'utf-8');

console.log(`✅ Mapa atualizado com sucesso em docs/PROJECT_MAP.json:`);
console.log(`   - Páginas: ${pages.length}`);
console.log(`   - Endpoints API: ${apis.length}`);
console.log(`   - Componentes UI: ${components.length}`);
console.log(`   - Scripts Operacionais: ${scripts.length}`);

// 6. Verificar integridade do Manual Mestre
const manualPath = path.join(rootDir, 'docs', 'MANUAL_SISTEMA_COMPLETO.md');
if (fs.existsSync(manualPath)) {
  const manualContent = fs.readFileSync(manualPath, 'utf-8');
  let missingItems = [];

  for (const page of pages) {
    if (!manualContent.includes(page.route)) {
      missingItems.push(`Rota de página ausente no manual: ${page.route}`);
    }
  }

  if (missingItems.length > 0) {
    console.warn('⚠️ Alerta: Os seguintes itens foram detectados no código mas não estão citados no manual:');
    missingItems.forEach((item) => console.warn('   - ' + item));
  } else {
    console.log('🎉 O Manual Mestre (MANUAL_SISTEMA_COMPLETO.md) está 100% sincronizado com as rotas do projeto!');
  }
} else {
  console.error('❌ docs/MANUAL_SISTEMA_COMPLETO.md não foi encontrado!');
}
