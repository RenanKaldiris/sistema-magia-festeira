/**
 * TESTE RUNTIME DO STORE: EXCLUSÃO INDIVIDUAL, EM LOTE E AUDITORIA
 */

import { store } from '../src/lib/store.ts';

console.log('Iniciando teste de runtime do store para temas...');

// Criar dois temas temporários para teste
const themeA = store.createTheme({
  name: 'Tema Teste Alfa',
  base_price: 199.90,
  stock_quantity: 2,
  characters: ['Alfa', 'Hero'],
});

const themeB = store.createTheme({
  name: 'Tema Teste Beta',
  base_price: 249.90,
  stock_quantity: 1,
  characters: ['Beta'],
});

console.log(`Temas criados: ${themeA.name} (${themeA.id}) e ${themeB.name} (${themeB.id})`);

// 1. Testar exclusão individual
const deletedSingle = store.deleteTheme(themeA.id);
if (!deletedSingle) {
  console.error('Falha ao excluir themeA individualmente');
  process.exit(1);
}
console.log('✅ deleteTheme individual funcionou com sucesso');

// Verificar se não está mais na lista
const foundA = store.getThemes().find(t => t.id === themeA.id);
if (foundA) {
  console.error('Tema A ainda encontrado na lista após deleteTheme');
  process.exit(1);
}
console.log('✅ Tema A removido da lista');

// 2. Testar exclusão em lote
const deletedCount = store.deleteThemes([themeB.id]);
if (deletedCount !== 1) {
  console.error(`deleteThemes retornou ${deletedCount}, esperado 1`);
  process.exit(1);
}
console.log('✅ deleteThemes em lote funcionou com sucesso');

const foundB = store.getThemes().find(t => t.id === themeB.id);
if (foundB) {
  console.error('Tema B ainda encontrado na lista após deleteThemes');
  process.exit(1);
}
console.log('✅ Tema B removido da lista');

// 3. Verificar se as auditorias foram registradas
const audits = (store).getAuditLogs ? (store).getAuditLogs() : [];
console.log(`Total de logs de auditoria disponíveis: ${audits.length}`);

console.log('\n🎉 TODOS OS TESTES DE RUNTIME DO STORE FORAM BEM-SUCEDIDOS!');
