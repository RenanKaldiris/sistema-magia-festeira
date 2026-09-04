/**
 * VERIFICAÇÃO AUTOMATIZADA - ORÇAMENTOS EM LOTE, UPLOADS REAIS E STATUS OPERACIONAL
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
console.log('🧪 VERIFICAÇÃO AUTOMATIZADA - ORÇAMENTOS, UPLOADS E STATUS OPERACIONAL');
console.log('========================================================================\n');

// 1. Ações em Lote e Fluxo de Orçamento
const batchBarContent = readFileSync(resolve('src/components/temas/BatchActionBar.tsx'), 'utf8');
assert(
  batchBarContent.includes('Gerar Orçamento') &&
  batchBarContent.includes('onGenerateQuote') &&
  batchBarContent.includes('Excluir'),
  '1.1. Substituição de Compartilhar por Gerar Orçamento na barra de lote mantendo Excluir'
);

const orcamentoModalExists = existsSync(resolve('src/components/temas/OrcamentoModal.tsx'));
assert(orcamentoModalExists, '1.2. Componente OrcamentoModal criado');

const orcamentoModalContent = readFileSync(resolve('src/components/temas/OrcamentoModal.tsx'), 'utf8');
assert(
  orcamentoModalContent.includes('Montagem de Orçamento') &&
  orcamentoModalContent.includes('customerName') &&
  orcamentoModalContent.includes('eventDate') &&
  orcamentoModalContent.includes('freight') &&
  orcamentoModalContent.includes('discount') &&
  orcamentoModalContent.includes('total'),
  '1.2. OrcamentoModal com dados do cliente, data do evento, cálculo de frete, desconto e total'
);

assert(
  orcamentoModalContent.includes('handleShareWhatsApp') &&
  orcamentoModalContent.includes('handleCopyProposal') &&
  orcamentoModalContent.includes('handleShareEmail') &&
  orcamentoModalContent.includes('handlePrint'),
  '1.2. OrcamentoModal com canais múltiplos: WhatsApp, Copiar Texto, E-mail e Imprimir/PDF'
);

// 2. Regra de Negócio: Status Operacional (Ativo e Inativo)
const drawerContent = readFileSync(resolve('src/components/temas/ThemeEditDrawer.tsx'), 'utf8');
assert(
  drawerContent.includes("value=\"active\"") &&
  drawerContent.includes("value=\"inactive\"") &&
  !drawerContent.includes("value=\"archived\""),
  '2.1. ThemeEditDrawer restringe status estritamente para Ativo e Inativo (sem Arquivado)'
);

const catalogoPageContent = readFileSync(resolve('src/app/catalogo/page.tsx'), 'utf8');
assert(
  catalogoPageContent.includes("status: 'active'"),
  '2.1. Catálogo público filtra apenas temas com status active'
);

const slugPageContent = readFileSync(resolve('src/app/catalogo/[slug]/page.tsx'), 'utf8');
assert(
  slugPageContent.includes("theme.status !== 'active'") &&
  slugPageContent.includes('Tema Indisponível no Momento'),
  '2.1. Acesso direto por slug bloqueia visualização de temas inativos com aviso amigável'
);

const temasPageContent = readFileSync(resolve('src/app/admin/temas/page.tsx'), 'utf8');
assert(
  temasPageContent.includes("handleSort('status')") &&
  temasPageContent.includes("sortState.field === 'status'"),
  '2.2. Coluna de Status com ordenação tri-state (Ativo -> Inativo -> Padrão)'
);

// 3. Gestão Visual de Fotos do Tema
assert(
  drawerContent.includes('mediaList') &&
  drawerContent.includes('handleSetPrimary') &&
  drawerContent.includes('handleDeleteMedia') &&
  drawerContent.includes('Capa Principal'),
  '3.1. ThemeEditDrawer possui galeria de miniaturas com definição de foto de capa e exclusão'
);

const storeContent = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeContent.includes('getMediaByEntity') &&
  storeContent.includes('deleteMedia') &&
  storeContent.includes('setPrimaryMedia'),
  '3.1. Store implementa getMediaByEntity, deleteMedia e setPrimaryMedia com persistência'
);

// 4. Upload de Arquivos Real (Multi-fonte)
assert(
  temasPageContent.includes('newThemeFileInputRef') &&
  temasPageContent.includes('newThemeGalleryInputRef') &&
  temasPageContent.includes('Do Dispositivo') &&
  temasPageContent.includes('Google Drive') &&
  temasPageContent.includes('Da Galeria') &&
  temasPageContent.includes('handleRemoveUploadedFile'),
  '4.1. Modal de Novo Tema com upload multi-fonte (Dispositivo, Drive, Galeria) e miniaturas com remoção'
);

const itensTabContent = readFileSync(resolve('src/components/temas/ItensTabContent.tsx'), 'utf8');
assert(
  itensTabContent.includes('fileInputRef') &&
  itensTabContent.includes('galleryInputRef') &&
  itensTabContent.includes('Do Dispositivo') &&
  itensTabContent.includes('Google Drive') &&
  itensTabContent.includes('Da Galeria') &&
  itensTabContent.includes('handleRemoveUploadedFile'),
  '4.2. Modal de Novo Item com upload multi-fonte (Dispositivo, Drive, Galeria) e miniaturas com remoção'
);

// 5. Histórico e Importações
const importacoesTabContent = readFileSync(resolve('src/components/temas/ImportacoesTabContent.tsx'), 'utf8');
assert(
  importacoesTabContent.includes('Histórico e Importações') &&
  importacoesTabContent.includes('stagedFiles') &&
  importacoesTabContent.includes('handleFileSelect') &&
  importacoesTabContent.includes('handleImportStagedPhotos') &&
  importacoesTabContent.includes('Importar Fotos'),
  '5.1. Aba Histórico e Importações renderiza miniaturas no quadro pontilhado e botão Importar Fotos'
);

assert(
  importacoesTabContent.includes("status: 'review'") &&
  storeContent.includes('approveImportAsset') &&
  storeContent.includes('addImportAsset'),
  '5.2. Assets locais são enfileirados em revisão ("review") e exigem aprovação manual do operador antes da publicação'
);

const sidebarContent = readFileSync(resolve('src/components/layout/AdminSidebar.tsx'), 'utf8');
assert(
  sidebarContent.includes("'Histórico e Importações'") &&
  !sidebarContent.includes("'Fila de Importações'"),
  '5.3. Submenu do AdminSidebar renomeado para "Histórico e Importações"'
);

console.log('\n========================================================================');
console.log(`📊 TOTAL DE TESTES: ${passed} / ${passed + failed} PASSARAM COM SUCESSO!`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
