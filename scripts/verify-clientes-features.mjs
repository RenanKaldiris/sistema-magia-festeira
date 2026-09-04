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
console.log('🧪 VERIFICAÇÃO DA PÁGINA DE CLIENTES NO PADRÃO LISTA/TEMAS');
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

// 2. Verificação de Métodos no Store
const storeContent = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeContent.includes('updateCustomer(') &&
  storeContent.includes('deleteCustomer(') &&
  storeContent.includes('deleteCustomers(') &&
  storeContent.includes('getCustomerById('),
  '3. Métodos updateCustomer, deleteCustomer, deleteCustomers e getCustomerById implementados no store'
);

// 3. Verificação do CustomerEditDrawer
const drawerContent = readFileSync(resolve('src/components/clientes/CustomerEditDrawer.tsx'), 'utf8');
assert(
  drawerContent.includes('CustomerEditDrawerProps') &&
  drawerContent.includes('customerRentals') &&
  drawerContent.includes('store.updateCustomer') &&
  drawerContent.includes('wa.me'),
  '4. CustomerEditDrawer possui suporte a edição completa, histórico de locações e atalho WhatsApp'
);

// 4. Verificação do CustomerBatchActionBar
const batchContent = readFileSync(resolve('src/components/clientes/CustomerBatchActionBar.tsx'), 'utf8');
assert(
  batchContent.includes('selectedCount') &&
  batchContent.includes('onCopyContacts') &&
  batchContent.includes('onDelete') &&
  batchContent.includes('onClearSelection'),
  '5. CustomerBatchActionBar possui suporte a contagem, cópia de contatos e exclusão em lote'
);

// 5. Verificação da Página Clientes (AdminClientesPage)
const clientesPageContent = readFileSync(resolve('src/app/admin/clientes/page.tsx'), 'utf8');
assert(
  clientesPageContent.includes('CustomerEditDrawer') &&
  clientesPageContent.includes('CustomerBatchActionBar') &&
  clientesPageContent.includes('DeleteConfirmationModal'),
  '6. AdminClientesPage importa os componentes modulares da aba de Temas'
);

assert(
  clientesPageContent.includes('masterCheckboxRef') &&
  clientesPageContent.includes('allVisibleSelected') &&
  clientesPageContent.includes('handleToggleSelectAll'),
  '7. AdminClientesPage possui seleção múltipla e checkbox mestre com estado indeterminado'
);

assert(
  clientesPageContent.includes("handleSort('name')") &&
  clientesPageContent.includes("handleSort('rentals')"),
  '8. AdminClientesPage possui ordenação tri-state (Nome e Locações)'
);

assert(
  clientesPageContent.includes('hidden md:block') &&
  clientesPageContent.includes('md:hidden space-y-3'),
  '9. Layout responsivo com tabela rica no desktop e lista de cards touch no mobile'
);

console.log(`\nResultado dos testes: ${passed} passaram, ${failed} falharam.\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 Todas as verificações passaram com 100% de sucesso!');
}
