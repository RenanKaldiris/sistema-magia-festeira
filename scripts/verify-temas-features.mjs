/**
 * VERIFICAÇÃO AUTOMATIZADA - MELHORIAS NA PÁGINA TEMAS, ITENS E ESTOQUE
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
console.log('🧪 VERIFICAÇÃO DAS NOVAS FUNCIONALIDADES: TEMAS, ITENS E ESTOQUE');
console.log('=============================================================\n');

// 1. Nomenclatura e Navegação
const sidebarContent = readFileSync(resolve('src/components/layout/AdminSidebar.tsx'), 'utf8');
assert(
  sidebarContent.includes("'Temas, Itens e Estoque'") &&
  sidebarContent.includes("href: '/admin/temas'") &&
  !sidebarContent.includes("'Temas & Acervo'"),
  '1.1. Renomeação do rótulo de navegação para "Temas, Itens e Estoque" no AdminSidebar'
);

const temasPageContent = readFileSync(resolve('src/app/admin/temas/page.tsx'), 'utf8');
assert(
  temasPageContent.includes('Temas, Itens e Estoque'),
  '1.1. Título da página principal alterado para "Temas, Itens e Estoque"'
);

assert(
  temasPageContent.includes("activeTab === 'temas'") &&
  temasPageContent.includes("activeTab === 'itens'") &&
  temasPageContent.includes("activeTab === 'importacoes'"),
  '1.2. Abas internas integradas ("Temas de Decoração", "Itens & Estoque", "Fila de Importações")'
);

assert(
  temasPageContent.includes('window.history.pushState') || temasPageContent.includes('tab='),
  '1.2. Controle de abas com URL limpa sem recarregar a tela'
);

// 2. Ordenação por Colunas (Tri-State)
assert(
  temasPageContent.includes("handleSort('name')") &&
  temasPageContent.includes("handleSort('price')"),
  '2.1. Colunas obrigatórias com ordenação: Nome e Preço'
);

assert(
  temasPageContent.includes("prev.order === 'asc'") &&
  temasPageContent.includes("order: 'desc'") &&
  temasPageContent.includes("field: null, order: null"),
  '2.1. Ordenação tri-state (1º asc, 2º desc, 3º ordem original de cadastro)'
);

assert(
  temasPageContent.includes('ArrowUp') &&
  temasPageContent.includes('ArrowDown') &&
  temasPageContent.includes('ArrowUpDown'),
  '2.1. Indicador visual discreto (seta para cima/baixo) na coluna ativa'
);

// 2.2 Modal / Gaveta de Edição Rápida
const drawerExists = existsSync(resolve('src/components/temas/ThemeEditDrawer.tsx'));
assert(drawerExists, '2.2. Componente ThemeEditDrawer criado com sucesso');

const drawerContent = readFileSync(resolve('src/components/temas/ThemeEditDrawer.tsx'), 'utf8');
assert(
  drawerContent.includes('Edição Rápida') &&
  drawerContent.includes('Foto de Capa do Tema') &&
  drawerContent.includes('store.updateTheme'),
  '2.2. Gaveta lateral de edição rápida com prévia de foto e atualização no store'
);

assert(
  temasPageContent.includes('setEditingTheme(theme)') &&
  temasPageContent.includes('e.stopPropagation()'),
  '2.2. Abertura da gaveta ao clicar na linha (com stopPropagation nos botões de ação e checkbox)'
);

// 3. Ações em Lote e Seleção Múltipla
assert(
  temasPageContent.includes('masterCheckboxRef') &&
  temasPageContent.includes('handleToggleSelectAll'),
  '3.1. Checkbox mestre no cabeçalho da tabela para "Selecionar Todos"'
);

assert(
  temasPageContent.includes('handleToggleSelect(theme.id)'),
  '3.1. Checkbox por item adjacente ao botão Ver no catálogo'
);

const batchBarExists = existsSync(resolve('src/components/temas/BatchActionBar.tsx'));
assert(batchBarExists, '3.2. Componente BatchActionBar criado com sucesso');

const batchBarContent = readFileSync(resolve('src/components/temas/BatchActionBar.tsx'), 'utf8');
assert(
  batchBarContent.includes('selectedCount') &&
  (batchBarContent.includes('Gerar Orçamento') || batchBarContent.includes('Compartilhar')) &&
  batchBarContent.includes('Excluir'),
  '3.2. Barra suspensa contextual com contagem, Gerar Orçamento e Excluir Selecionados'
);

assert(
  temasPageContent.includes('handleBatchShare') &&
  temasPageContent.includes('navigator.clipboard.writeText'),
  '3.2. Ação de compartilhamento agrupado dos temas selecionados'
);

// 3.3 Confirmação de Segurança
const deleteModalExists = existsSync(resolve('src/components/temas/DeleteConfirmationModal.tsx'));
assert(deleteModalExists, '3.3. Componente DeleteConfirmationModal criado com sucesso');

const deleteModalContent = readFileSync(resolve('src/components/temas/DeleteConfirmationModal.tsx'), 'utf8');
assert(
  deleteModalContent.includes('Confirmar Exclusão') &&
  deleteModalContent.includes('Esta ação removerá permanentemente os registros') &&
  deleteModalContent.includes('themeNames'),
  '3.3. Caixa de confirmação de segurança com mensagem nominal e irreversibilidade'
);

// Store: Exclusão com Auditoria
const storeContent = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeContent.includes('public deleteTheme(id: string)') &&
  storeContent.includes('public deleteThemes(ids: string[])') &&
  storeContent.includes("'DELETE_THEME'"),
  '3.3. Métodos deleteTheme e deleteThemes implementados no store com trilha de auditoria'
);

console.log('\n=============================================================');
console.log(`📊 TOTAL DE TESTES DE ESPECIFICAÇÃO: ${passed} / ${passed + failed} PASSARAM COM SUCESSO!`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
}
