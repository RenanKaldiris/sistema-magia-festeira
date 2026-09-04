/**
 * Utilitários de Imagem e Detecção de Entidades - Sistema Magia Festeira
 * Garante:
 * 1. Pré-visualização instantânea (0ms)
 * 2. Conversão e compressão otimizada em Base64 via Canvas (evita estourar cota de 5MB do LocalStorage)
 * 3. Identificação inteligente do nome do tema a partir do arquivo e catálogo existente
 */

export async function fileToDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => {
        resolve(result);
      };
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function detectEntityFromFilename(
  fileName: string,
  existingThemes?: Array<{ name: string; characters?: string[] }>
): string {
  if (!fileName) return 'Tema Decorativo';

  // Remove extensão e limpa caracteres especiais
  const clean = fileName
    .replace(/\.[^/.]+$/, '') // remove extensão .jpg, .png, etc.
    .replace(/[-_]+/g, ' ')   // substitui traços e underlines por espaços
    .replace(/\s+/g, ' ')     // normaliza espaços
    .trim();

  const cleanLower = clean.toLowerCase();

  // 1. Tentar encontrar tema existente cujo nome ou personagens estejam contidos no nome do arquivo
  if (existingThemes && existingThemes.length > 0) {
    for (const t of existingThemes) {
      if (cleanLower.includes(t.name.toLowerCase())) {
        return t.name;
      }
      if (t.characters) {
        for (const char of t.characters) {
          if (char.length > 2 && cleanLower.includes(char.toLowerCase())) {
            return t.name;
          }
        }
      }
    }
  }

  // 2. Mapeamento de termos temáticos frequentes para títulos amigáveis
  const commonPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /vingador|avenger|marvel/i, name: 'Vingadores' },
    { pattern: /hulk/i, name: 'Vingadores (Hulk)' },
    { pattern: /homem\s*aranha|spider/i, name: 'Homem-Aranha' },
    { pattern: /safari/i, name: 'Safari Baby' },
    { pattern: /barbie/i, name: 'Barbie Princesa' },
    { pattern: /solzinho|volta\s*ao\s*sol/i, name: 'Minha Primeira Volta ao Sol' },
    { pattern: /tardezinha|sunset/i, name: 'Tardezinha' },
    { pattern: /patrulha\s*canina|paw\s*patrol/i, name: 'Patrulha Canina' },
    { pattern: /fazendinha/i, name: 'Fazendinha' },
    { pattern: /sereia|fundo\s*do\s*mar/i, name: 'Fundo do Mar' },
    { pattern: /dinossauro|jurassic/i, name: 'Dinossauros' },
    { pattern: /circo/i, name: 'Circo Mágico' },
    { pattern: /realeza|principe|princesa/i, name: 'Princesas da Realeza' },
    { pattern: /jardim\s*encantado/i, name: 'Jardim Encantado' },
    { pattern: /astronauta|espaco/i, name: 'Astronauta no Espaço' },
  ];

  for (const { pattern, name } of commonPatterns) {
    if (pattern.test(clean)) {
      return name;
    }
  }

  // 3. Fallback inteligente: formata o nome limpo em Title Case
  const formatted = clean
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return formatted || 'Tema em Revisão';
}
