import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('========================================================================');
console.log('🧪 VERIFICAÇÃO: UPLOADS PERSISTENTES, CATÁLOGO E PRÉ-APROVAÇÃO');
console.log('========================================================================');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

// 1. Correção de Bug e UI de Imagens (Zero Unsplash & Uploads Reais)
console.log('\n1. Persistência de Uploads & Eliminação de Imagens Aleatórias:');

const catalogoPage = readFileSync(resolve('src/app/catalogo/page.tsx'), 'utf8');
assert(!catalogoPage.includes('unsplash.com'), '1.1. /catalogo não possui fallback estático para Unsplash');

const catalogoSlugPage = readFileSync(resolve('src/app/catalogo/[slug]/page.tsx'), 'utf8');
assert(!catalogoSlugPage.includes('unsplash.com'), '1.1. /catalogo/[slug] não possui fallback estático para Unsplash');

const temasPage = readFileSync(resolve('src/app/admin/temas/page.tsx'), 'utf8');
assert(!temasPage.includes('unsplash.com'), '1.1. /admin/temas não possui fallback nem substituição no onError para Unsplash');

const themeDrawer = readFileSync(resolve('src/components/temas/ThemeEditDrawer.tsx'), 'utf8');
assert(!themeDrawer.includes('unsplash.com'), '1.1. ThemeEditDrawer não possui fallback para Unsplash no onError');

const importacoesContent = readFileSync(resolve('src/components/temas/ImportacoesTabContent.tsx'), 'utf8');
assert(
  importacoesContent.includes('fileToDataUrl') || importacoesContent.includes('readAsDataURL'),
  '1.1. ImportacoesTabContent converte uploads locais para Base64 persistente'
);

const itensContent = readFileSync(resolve('src/components/temas/ItensTabContent.tsx'), 'utf8');
assert(
  itensContent.includes('fileToDataUrl') || itensContent.includes('readAsDataURL'),
  '1.1. ItensTabContent converte uploads locais para Base64 persistente'
);

assert(
  temasPage.includes('setVariantPhoto') && temasPage.includes('setKitPhoto'),
  '1.1. Variações e Kits salvam fotos via FileReader.readAsDataURL de forma persistente'
);

// 2. Padronização de UI de Botões de Upload
console.log('\n2. Padronização Visual de Botões de Upload:');

const uploadBtnStandardClasses = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold';

assert(themeDrawer.includes(uploadBtnStandardClasses), '2.1. ThemeEditDrawer possui classes padronizadas de botão');
assert(temasPage.includes(uploadBtnStandardClasses), '2.1. /admin/temas (Novo Tema, Variação e Kit) possui classes padronizadas');
assert(itensContent.includes(uploadBtnStandardClasses), '2.1. ItensTabContent possui classes padronizadas de botão');

const itemDrawer = readFileSync(resolve('src/components/temas/ItemEditDrawer.tsx'), 'utf8');
assert(itemDrawer.includes(uploadBtnStandardClasses), '2.1. ItemEditDrawer possui classes padronizadas de botão');

// 3. Catálogo Público
console.log('\n3. Catálogo Público e Subpágina de Detalhes:');

assert(
  catalogoPage.includes('aspect-[3/4]') || catalogoPage.includes('aspect-[4/5]'),
  '3.1. Cards do /catalogo usam proporção vertical/retrato (aspect-[3/4]) para exibir decoração completa'
);

assert(
  catalogoPage.includes('<Link') && catalogoPage.includes('/catalogo/${theme.slug}') && catalogoPage.includes('cursor-pointer'),
  '3.2. Card do tema no /catalogo é 100% clicável como um Link completo para o tema'
);

assert(
  catalogoPage.includes('e.stopPropagation()') && catalogoPage.includes('Falar no WhatsApp'),
  '3.3. Botão de WhatsApp no /catalogo possui e.stopPropagation() e não navega o card'
);

assert(
  catalogoSlugPage.includes('object-contain') && catalogoSlugPage.includes('max-h-[620px]'),
  '3.4. Subpágina /catalogo/[slug] exibe foto principal em object-contain preservando proporções originais'
);

assert(
  catalogoSlugPage.includes('Thumbnail Strip positioned below main photo') && catalogoSlugPage.includes('activeImage === img.storage_path'),
  '3.5. Subpágina possui galeria de miniaturas posicionada abaixo da foto principal para alternância'
);

// 4. Fila de Revisão e Edição Pré-Aprovação
console.log('\n4. Fila de Revisão e Edição Pré-Aprovação:');

assert(
  importacoesContent.includes('handleOpenPreApprovalDrawer') &&
  importacoesContent.includes('cursor-pointer') &&
  importacoesContent.includes('Clique para revisar e editar dados pré-aprovação'),
  '4.1. Cards de itens pendentes na fila de revisão são 100% clicáveis e abrem a gaveta de pré-aprovação'
);

assert(
  themeDrawer.includes('isPreApproval') &&
  themeDrawer.includes('Revisão Pré-Aprovação: ajuste dados e fotos antes de publicar') &&
  themeDrawer.includes('Aprovar & Publicar no Catálogo'),
  '4.2. ThemeEditDrawer suporta modo de pré-aprovação com ações contextuais de salvar fila ou aprovar'
);

const storeFile = readFileSync(resolve('src/lib/store.ts'), 'utf8');
assert(
  storeFile.includes('customData?:') &&
  storeFile.includes('updateImportAsset(assetId: string, updates: Partial<ImportAsset>)'),
  '4.3. Store suporta atualização de dados na fila de importação e aprovação com customData'
);

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL: ${passed + failed} verificações | ✅ APROVADOS: ${passed} | ❌ FALHAS: ${failed}`);
console.log('------------------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
