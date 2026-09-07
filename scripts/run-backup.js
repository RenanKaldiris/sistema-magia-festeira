const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const git = '"C:\\Program Files\\Git\\cmd\\git.exe"';

console.log('=== 1. VERIFICANDO STATUS DO GIT ===');
try {
  execSync(`${git} add -A`, { stdio: 'inherit' });
  const status = execSync(`${git} status -s`).toString().trim();
  console.log('Arquivos para commit:\n', status || '(nenhuma modificação pendente)');

  if (status) {
    console.log('\n=== 2. CRIANDO COMMIT "backup: Magia festeira sistema 1.2" ===');
    execSync(`${git} commit -m "backup: Magia festeira sistema 1.2"`, { stdio: 'inherit' });
  } else {
    console.log('Tudo já estava comitado.');
  }

  console.log('\n=== 3. CRIANDO TAG E BRANCH v1.2 ===');
  try {
    execSync(`${git} tag -a v1.2 -m "Magia festeira sistema 1.2" -f`, { stdio: 'inherit' });
    console.log('Tag v1.2 criada com sucesso.');
  } catch (e) {
    console.log('Aviso ao criar tag:', e.message);
  }

  try {
    execSync(`${git} branch -f backup-v1.2`, { stdio: 'inherit' });
    console.log('Branch backup-v1.2 criada com sucesso.');
  } catch (e) {
    console.log('Aviso ao criar branch:', e.message);
  }

  console.log('\n=== 4. ENVIANDO PARA O GITHUB (PUSH) ===');
  try {
    console.log('Enviando branch main...');
    execSync(`${git} push origin main`, { stdio: 'inherit' });
    console.log('Enviando branch backup-v1.2...');
    execSync(`${git} push origin backup-v1.2 -f`, { stdio: 'inherit' });
    console.log('Enviando tags...');
    execSync(`${git} push origin v1.2 -f`, { stdio: 'inherit' });
    console.log('Push no GitHub concluído com sucesso!');
  } catch (e) {
    console.error('Erro durante o git push:', e.message);
  }
} catch (err) {
  console.error('Erro na etapa Git:', err);
}

console.log('\n=== 5. GERANDO ARQUIVO ZIP NA ÁREA DE TRABALHO ===');
try {
  const home = require('os').homedir();
  const desktop = path.join(home, 'Desktop');
  const zipName = 'Magia_Festeira_Sistema_v1.2.zip';
  const zipPath = path.join(desktop, zipName);

  // Pasta temporária de staging para zip limpo (sem node_modules, sem .next, sem .git)
  const stagingDir = path.join(home, 'AppData', 'Local', 'Temp', 'magia_festeira_staging');
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  const projectDir = path.resolve(__dirname, '..');
  console.log('Copiando arquivos do projeto para staging (excluindo node_modules, .next, .git)...');

  function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      const base = path.basename(src);
      if (base === 'node_modules' || base === '.next' || base === '.git' || base === '.turbo') {
        return;
      }
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursiveSync(projectDir, stagingDir);
  console.log('Staging preparado. Compactando para:', zipPath);

  // Se o zip já existir na Área de Trabalho, remove para sobrescrever
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Usar PowerShell Compress-Archive no stagingDir
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Limpar stagingDir
  fs.rmSync(stagingDir, { recursive: true, force: true });

  const zipStats = fs.statSync(zipPath);
  const sizeMB = (zipStats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 SUCESSO! Arquivo ZIP criado na Área de Trabalho:`);
  console.log(`Local: ${zipPath}`);
  console.log(`Tamanho: ${sizeMB} MB (limpo e pronto para upload no Google Drive)`);
} catch (err) {
  console.error('Erro ao gerar arquivo ZIP:', err);
}
