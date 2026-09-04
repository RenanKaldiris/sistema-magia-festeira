import assert from 'node:assert';
import { store } from '../src/lib/store.ts';
import { detectEntityFromFilename } from '../src/lib/imageUtils.ts';

console.log('🧪 Iniciando Verificação de Uploads, Miniaturas e Persistência de Fotos em Temas...');

// 1. Testar detectEntityFromFilename
console.log('\n1. Testando Reconhecimento Inteligente de Entidades / Nomes de Arquivos:');
const existingThemes = store.getThemes();

const testCases = [
  { file: 'foto_vingadores_completa.jpg', expected: 'Vingadores' },
  { file: 'mesa-safari-baby-arco.png', expected: 'Safari Baby' },
  { file: 'barbie_princesa_painel.jpeg', expected: 'Barbie Princesa' },
  { file: 'solzinho_1ano.jpg', expected: 'Minha Primeira Volta ao Sol' },
  { file: 'patrulha_canina_chao.png', expected: 'Patrulha Canina' },
  { file: 'festa_fazendinha_menino.jpg', expected: 'Fazendinha' },
  { file: 'decoracao_bosque_encantado.png', expected: 'Decoracao Bosque Encantado' },
];

for (const tc of testCases) {
  const detected = detectEntityFromFilename(tc.file, existingThemes);
  assert.strictEqual(detected, tc.expected, `Falha na detecção para ${tc.file}. Esperado: "${tc.expected}", Obtido: "${detected}"`);
  console.log(`  ✓ "${tc.file}" detectado com sucesso como "${detected}"`);
}

// 2. Testar Criação Sequencial de Temas com Fotos (Verificar Ausência de Colisão de Fingerprint)
console.log('\n2. Testando Criação Sequencial de Múltiplos Temas com Fotos Únicas:');
const photoDataA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDThemeA...';
const photoDataB = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDThemeB...';
const photoDataC = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDThemeC...';

const themeA = store.createTheme({
  name: 'Tema Teste Alfa',
  base_price: 180,
  characters: ['Alfa'],
  imageUrl: photoDataA,
});

const themeB = store.createTheme({
  name: 'Tema Teste Beta',
  base_price: 220,
  characters: ['Beta'],
  imageUrl: photoDataB,
});

const themeC = store.createTheme({
  name: 'Tema Teste Gama',
  base_price: 250,
  characters: ['Gama'],
  imageUrl: photoDataC,
});

// Enriquecer e buscar temas
const themesList = store.getThemes();
const enrichedA = themesList.find((t) => t.id === themeA.id);
const enrichedB = themesList.find((t) => t.id === themeB.id);
const enrichedC = themesList.find((t) => t.id === themeC.id);

assert(enrichedA, 'Tema Alfa não encontrado na lista');
assert(enrichedB, 'Tema Beta não encontrado na lista');
assert(enrichedC, 'Tema Gama não encontrado na lista');

assert(enrichedA.primary_media, 'Tema Alfa deve possuir primary_media');
assert(enrichedB.primary_media, 'Tema Beta deve possuir primary_media (não pode ser nulo por colisão de fingerprint)');
assert(enrichedC.primary_media, 'Tema Gama deve possuir primary_media');

assert.strictEqual(enrichedA.primary_media.storage_path, photoDataA, 'Foto do Tema Alfa não confere');
assert.strictEqual(enrichedB.primary_media.storage_path, photoDataB, 'Foto do Tema Beta não confere');
assert.strictEqual(enrichedC.primary_media.storage_path, photoDataC, 'Foto do Tema Gama não confere');

console.log(`  ✓ Tema Alfa criado com foto própria: ${enrichedA.primary_media.storage_path.substring(0, 30)}...`);
console.log(`  ✓ Tema Beta criado com foto própria: ${enrichedB.primary_media.storage_path.substring(0, 30)}...`);
console.log(`  ✓ Tema Gama criado com foto própria: ${enrichedC.primary_media.storage_path.substring(0, 30)}...`);

// 3. Testar Fila de Importação com Reconhecimento de Nome e Foto
console.log('\n3. Testando Fila de Importação: Reconhecimento e Aprovação:');
const importPhotoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDImportedPhoto123...';
const job = store.queueImport('local_folder', 'Lote de Teste Local', 1);

const identifiedThemeName = detectEntityFromFilename('minha_primeira_volta_ao_sol_cenario.jpg', themesList);
const asset = store.addImportAsset({
  import_id: job.id,
  source_file: 'minha_primeira_volta_ao_sol_cenario.jpg',
  fingerprint: `sha256-test-import-${Date.now()}`,
  status: 'review',
  detected_entity: identifiedThemeName,
  confidence: 0.95,
  storage_path: importPhotoData,
});

assert.strictEqual(asset.detected_entity, 'Minha Primeira Volta ao Sol', 'Nome do tema deveria ser detectado');
assert.strictEqual(asset.storage_path, importPhotoData, 'storage_path do asset deve ser a foto');

// Aprovar o asset
const approvedTheme = store.approveImportAsset(asset.id, {
  name: 'Volta ao Sol Deluxe',
  base_price: 280,
});

assert(approvedTheme, 'Tema aprovado deve ser retornado');
const enrichedApproved = store.getThemeBySlug(approvedTheme.slug);
assert(enrichedApproved, 'Tema aprovado deve ser localizável pelo slug');
assert(enrichedApproved.primary_media, 'Tema aprovado deve ter primary_media');
assert.strictEqual(enrichedApproved.primary_media.storage_path, importPhotoData, 'Foto do tema aprovado deve ser a mesma do asset importado');
console.log(`  ✓ Asset importado aprovado com sucesso como "${enrichedApproved.name}" com a foto original preservada!`);

// 4. Testar Troca de Mídia Primária no Mesmo Tema
console.log('\n4. Testando Adição de Mídia Secundária e Promoção a Primária:');
const secondPhoto = 'data:image/jpeg;base64,/9j/secondPhoto...';
const mediaResult = store.addMediaToEntity({
  entity_type: 'theme',
  entity_id: themeA.id,
  storage_path: secondPhoto,
  original_name: 'foto_detalhe.jpg',
  mime_type: 'image/jpeg',
  file_size: 200000,
  fingerprint: `sha256-second-${Date.now()}`,
  is_primary: true, // Nova foto vira primária
});

assert.strictEqual(mediaResult.isDuplicate, false, 'Segunda foto não deve ser marcada como duplicata');
const updatedThemeA = store.getThemeBySlug(themeA.slug);
assert.strictEqual(updatedThemeA.primary_media.storage_path, secondPhoto, 'Nova foto primária deve ser a segunda foto');

const allThemeAMedia = store.getMediaByEntity('theme', themeA.id);
const firstMedia = allThemeAMedia.find((m) => m.storage_path === photoDataA);
assert.strictEqual(firstMedia.is_primary, false, 'Foto anterior deve ter is_primary = false');
console.log('  ✓ Adição e promoção de mídia primária funcionando perfeitamente.');

console.log('\n🎉 TODOS OS TESTES DE PERSISTÊNCIA DE UPLOAD E MINIATURAS PASSARAM COM 100% DE SUCESSO!\n');
