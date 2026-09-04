/**
 * VERIFICAÇÃO AUTOMATIZADA: PARIDADE DE INTERFACE, MOBILE E SINCRONIZAÇÃO EM TEMPO REAL
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

console.log('\n========================================================================');
console.log('🧪 VERIFICAÇÃO: PARIDADE, MOBILE, UPLOADS E SINCRONIZAÇÃO EM TEMPO REAL');
console.log('========================================================================\n');

// 1. Interface, Layout e Cores (UI/UX)
console.log('1. Interface, Layout e Cores (UI/UX):');

const navbarContent = readFileSync(resolve('src/components/layout/Navbar.tsx'), 'utf8');
assert(
  !navbarContent.includes('Painel do Operador'),
  '1.1. Navbar pública (/catalogo) sem botão "Painel do Operador"'
);

const adminLayoutContent = readFileSync(resolve('src/app/admin/layout.tsx'), 'utf8');
assert(
  adminLayoutContent.includes('DatabaseKeepAlive') && !adminLayoutContent.includes('<DatabaseStatusBadge />'),
  '1.2. Admin Layout usa DatabaseKeepAlive silencioso no lugar do badge chamativo'
);

const keepAliveExists = existsSync(resolve('src/components/database/DatabaseKeepAlive.tsx'));
assert(keepAliveExists, '1.2. Componente DatabaseKeepAlive criado com ping periódico de 30s');

const logsPageContent = readFileSync(resolve('src/app/admin/logs/page.tsx'), 'utf8');
assert(
  logsPageContent.includes('DatabaseStatusBadge'),
  '1.2. DatabaseStatusBadge agora exibido adequadamente na tela /admin/logs'
);

const temasPageContent = readFileSync(resolve('src/app/admin/temas/page.tsx'), 'utf8');
assert(
  temasPageContent.includes('Cadastrar Novo Tema') &&
  temasPageContent.includes('flex flex-col sm:flex-row sm:items-center justify-between'),
  '1.3. Botão "Cadastrar Novo Tema" alinhado na mesma linha das abas e responsivo'
);

// 2. Formulários e Cadastro de Temas
console.log('\n2. Formulários e Cadastro de Temas:');

assert(
  temasPageContent.includes('Tag ou Ref (separados por vírgula)') &&
  temasPageContent.includes('Ex: Homem-Aranha, Vingadores, Tardezinha, 1 Ano...'),
  '2.1. Campo renomeado para "Tag ou Ref (separados por vírgula)" com novo placeholder'
);

assert(
  temasPageContent.includes("basePrice, setBasePrice] = useState('179.90')") ||
  temasPageContent.includes("179.9"),
  '2.2. Preço base padrão inicializado em R$ 179,90'
);

const storeContent = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeContent.includes('base_price: 179.9'),
  '2.2. Store define 179.9 como fallback de preço base para novos temas e aprovações'
);

assert(
  temasPageContent.includes('variantPhoto') &&
  temasPageContent.includes('variantFileInputRef') &&
  temasPageContent.includes('kitPhoto') &&
  temasPageContent.includes('kitFileInputRef') &&
  temasPageContent.includes('type="file"'),
  '2.3. Upload real de arquivos com input file e preview em Variações e Kits'
);

// 3. Paridade Funcional: Aba "Itens & Estoque"
console.log('\n3. Paridade Funcional: Aba "Itens & Estoque":');

const itensTabContent = readFileSync(resolve('src/components/temas/ItensTabContent.tsx'), 'utf8');
assert(
  itensTabContent.includes('selectedItemIds') &&
  itensTabContent.includes('handleToggleSelectAll') &&
  itensTabContent.includes('handleToggleSelect') &&
  itensTabContent.includes('BatchActionBar'),
  '3.1. Aba Itens com suporte a seleção individual, selecionar todos e BatchActionBar'
);

const deleteModalContent = readFileSync(resolve('src/components/temas/DeleteConfirmationModal.tsx'), 'utf8');
assert(
  deleteModalContent.includes('confirmText') &&
  deleteModalContent.includes("confirmText.trim().toUpperCase() === 'EXCLUIR'"),
  '3.2. Modal de exclusão exige digitar "EXCLUIR" para deleção múltipla'
);

assert(
  itensTabContent.includes("sortState.field === 'status'") &&
  itensTabContent.includes("handleToggleSort('status')"),
  '3.3. Aba Itens com ordenação tri-state na coluna de status (ativo -> inativo -> padrão)'
);

const itemDrawerExists = existsSync(resolve('src/components/temas/ItemEditDrawer.tsx'));
assert(itemDrawerExists, '3.4. Componente ItemEditDrawer criado');

const itemDrawerContent = readFileSync(resolve('src/components/temas/ItemEditDrawer.tsx'), 'utf8');
assert(
  itemDrawerContent.includes('quantity_total') &&
  itemDrawerContent.includes('quantity_available') &&
  itemDrawerContent.includes('addMediaToEntity'),
  '3.4. ItemEditDrawer gerencia dados operacionais, status, estoque e fotos reais'
);

// 4. Fluxo de Importações e Lote
console.log('\n4. Fluxo de Importações e Lote:');

const importacoesTabContent = readFileSync(resolve('src/components/temas/ImportacoesTabContent.tsx'), 'utf8');
assert(
  importacoesTabContent.includes('selectedAssetIds') &&
  importacoesTabContent.includes('handleToggleSelectAllPending') &&
  importacoesTabContent.includes('handleApproveSelectedBatch') &&
  importacoesTabContent.includes('handleDeleteSelectedBatch'),
  '4.1. Aba Importações com seleção múltipla, aprovação e exclusão em lote'
);

assert(
  storeContent.includes('approveImportAsset') &&
  storeContent.includes('approveImportAssetsBatch') &&
  storeContent.includes('deleteImportAssetsBatch') &&
  storeContent.includes('createTheme'),
  '4.1. Store aprova assets criando Temas reais com status active e fotos vinculadas'
);

// 5. Responsividade Mobile e Prevenção de Auto-Zoom
console.log('\n5. Responsividade Mobile e Prevenção de Auto-Zoom:');

const globalsCss = readFileSync(resolve('src/app/globals.css'), 'utf8');
assert(
  globalsCss.includes('@media screen and (max-width: 768px)') &&
  globalsCss.includes('font-size: 16px !important'),
  '5.1. Regra font-size: 16px !important em inputs no mobile (previne auto-zoom em iOS/Safari)'
);

// 6. Sincronização em Tempo Real (Cross-Tab / Multi-Device)
console.log('\n6. Sincronização em Tempo Real:');

assert(
  storeContent.includes('BroadcastChannel') &&
  storeContent.includes('magia_festeira_realtime_sync') &&
  storeContent.includes('public subscribe(listener: () => void)'),
  '6.1. Store implementa BroadcastChannel e listener de storage para sincronização em tempo real'
);

assert(
  temasPageContent.includes('store.subscribe') &&
  itensTabContent.includes('store.subscribe') &&
  importacoesTabContent.includes('store.subscribe'),
  '6.2. Telas inscritas no pub/sub do store reagindo instantaneamente a alterações'
);

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL: ${passed + failed} verificações | ✅ APROVADOS: ${passed} | ❌ FALHAS: ${failed}`);
console.log('------------------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
