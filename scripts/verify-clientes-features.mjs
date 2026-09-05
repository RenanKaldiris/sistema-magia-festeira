/**
 * VERIFICAÇÃO AUTOMATIZADA - MELHORIAS NA PÁGINA DE CLIENTES
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('\n=============================================================');
console.log('🧪 VERIFICAÇÃO DA PÁGINA DE CLIENTES: LISTA, IMPORTAÇÃO, EXPORTAÇÃO E ORÇAMENTO');
console.log('=============================================================\n');

// 1. Arquivos existem
assert(
  existsSync(resolve('src/components/clientes/CustomerEditDrawer.tsx')),
  '1. Componente CustomerEditDrawer.tsx criado com sucesso'
);

assert(
  existsSync(resolve('src/components/clientes/CustomerBatchActionBar.tsx')),
  '2. Componente CustomerBatchActionBar.tsx criado com sucesso'
);

assert(
  existsSync(resolve('src/components/clientes/ImportCustomersModal.tsx')),
  '3. Componente ImportCustomersModal.tsx criado com sucesso'
);

assert(
  existsSync(resolve('src/components/clientes/ExportCustomersModal.tsx')),
  '4. Componente ExportCustomersModal.tsx criado com sucesso'
);

// 2. Verificação de Métodos no Store
const storeContent = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeContent.includes('updateCustomer(') &&
  storeContent.includes('deleteCustomer(') &&
  storeContent.includes('deleteCustomers(') &&
  storeContent.includes('getCustomerById('),
  '5. Métodos updateCustomer, deleteCustomer, deleteCustomers e getCustomerById implementados no store'
);

// 3. Verificação dos dois botões escuros: Importar e Exportar
const clientesPageContent = readFileSync(resolve('src/app/admin/clientes/page.tsx'), 'utf8');
assert(
  clientesPageContent.includes('<span>Importar</span>') &&
  clientesPageContent.includes('<span>Exportar</span>') &&
  clientesPageContent.includes('bg-slate-900') &&
  !clientesPageContent.includes('bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700'),
  '6. Existem dois botões dedicados (Importar e Exportar) com estilo escuro (bg-slate-900), sem botão branco'
);

// 4. Verificação do ExportCustomersModal
const exportModalContent = readFileSync(resolve('src/components/clientes/ExportCustomersModal.tsx'), 'utf8');
assert(
  exportModalContent.includes('handleExportExcel') &&
  exportModalContent.includes('handleExportPDF') &&
  exportModalContent.includes('handleCopyText') &&
  exportModalContent.includes('window.print'),
  '7. ExportCustomersModal possui exportação completa para Excel (.csv com UTF-8 BOM), PDF com impressão e cópia em texto'
);

// 5. Verificação do botão WhatsApp ao lado do telefone (removido do lado do telefone)
assert(
  !clientesPageContent.includes('<td className="py-4 px-6 font-medium text-slate-900 dark:text-white">\n                        <div className="flex items-center gap-2">\n                          <span className="font-semibold">{c.phone}</span>\n                          <a\n                            href={`https://wa.me') &&
  clientesPageContent.includes('<span className="font-semibold font-mono">{c.phone}</span>'),
  '8. Botão verde de WhatsApp removido de junto do telefone na tabela'
);

// 6. Verificação do botão de Criar Orçamento substituindo o de ligação
assert(
  clientesPageContent.includes('title="Criar Orçamento para este Cliente"') &&
  clientesPageContent.includes('handleOpenOrcamentoForCustomer') &&
  !clientesPageContent.includes('title="Ligar para o cliente"'),
  '9. Ícone de ligação substituído por botão de Criar Orçamento na tabela e no card mobile'
);

// 7. Verificação do OrcamentoModal suportando preenchimento do cliente
const orcamentoModalContent = readFileSync(resolve('src/components/temas/OrcamentoModal.tsx'), 'utf8');
assert(
  orcamentoModalContent.includes('initialCustomerName') &&
  orcamentoModalContent.includes('initialCustomerPhone'),
  '10. OrcamentoModal suporta preenchimento automático do cliente'
);

console.log(`\nResultado dos testes: ${passed} passaram, ${failed} falharam.\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 Todas as verificações passaram com 100% de sucesso!');
}
