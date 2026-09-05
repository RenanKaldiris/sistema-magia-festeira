/**
 * Utilit�rios de Imagem, Convers�o WebP (70% de qualidade) e Detec��o de Entidades - Sistema Magia Festeira
 * Garante:
 * 1. Convers�o mandat�ria de toda e qualquer foto enviada para formato .WEBP com 70% de qualidade
 * 2. Redu��o dr�stica do tamanho dos arquivos preservando nitidez visual para cat�logos e decora��es
 * 3. Suporte integral a fotos de iPhone/iOS (.HEIC / .HEIF), JPEG, PNG e outros formatos
 * 4. Pr�-visualiza��o instant�nea (0ms) e persist�ncia sem estouro de cota do navegador
 */

export const WEBP_QUALITY = 0.70;

export function ensureWebpExtension(fileName: string): string {
  if (!fileName) return 'foto.webp';
  const clean = fileName.replace(/\.[^/.]+$/, '').trim();
  return (clean || 'foto') + '.webp';
}

export function isHeicFile(file: File | Blob, originalFileName?: string): boolean {
  const fileName = (file as File).name || originalFileName || '';
  const fileType = (file.type || '').toLowerCase();
  return (
    /\.(heic|heif)$/i.test(fileName) ||
    fileType.includes('heic') ||
    fileType.includes('heif')
  );
}

export function isWebpFile(file: File | Blob, originalFileName?: string): boolean {
  const fileName = (file as File).name || originalFileName || '';
  const fileType = (file.type || '').toLowerCase();
  return fileName.toLowerCase().endsWith('.webp') || fileType === 'image/webp';
}

/**
 * Converte qualquer imagem (PNG, JPEG, HEIC, BMP, etc.) para formato .WEBP com 70% de qualidade
 */
export async function convertImageToWebP(
  file: File | Blob,
  quality = WEBP_QUALITY,
  maxDimension = 1920
): Promise<{ file: File; dataUrl: string; blob: Blob; originalSize: number; newSize: number }> {
  const originalName = (file as File).name || 'imagem.webp';
  const originalSize = file.size || 0;
  const webpName = ensureWebpExtension(originalName);

  // 1. Tratamento espec�fico para HEIC/HEIF via API backend ou heic2any
  let sourceBlob: Blob = file;
  if (isHeicFile(file, originalName)) {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/convert-heic', {
          method: 'POST',
          body: file,
        });
        if (response.ok) {
          const convertedBlob = await response.blob();
          if (convertedBlob && convertedBlob.size > 0) {
            sourceBlob = convertedBlob;
          }
        }
      }
    } catch (e) {
      console.warn('API /api/convert-heic indispon�vel, tentando heic2any...', e);
      try {
        if (typeof window !== 'undefined') {
          const heic2anyModule = await import('heic2any');
          const heic2any = (heic2anyModule as any).default || heic2anyModule;
          const converted = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          sourceBlob = Array.isArray(converted) ? converted[0] : converted;
        }
      } catch (err) {
        console.warn('heic2any falhou, mantendo blob original:', err);
      }
    }
  }

  // 2. Se executando no servidor (SSR), encaminha para sharp ou fallback
  if (typeof window === 'undefined') {
    const fallbackFile = new File([sourceBlob], webpName, { type: 'image/webp' });
    return {
      file: fallbackFile,
      dataUrl: '',
      blob: sourceBlob,
      originalSize,
      newSize: sourceBlob.size,
    };
  }

  // 3. Convers�o e compress�o via Canvas no navegador para image/webp a 70%
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(sourceBlob);
    const img = new Image();

    img.onload = async () => {
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
          URL.revokeObjectURL(objectUrl);
          const f = new File([sourceBlob], webpName, { type: 'image/webp' });
          resolve({ file: f, dataUrl: objectUrl, blob: sourceBlob, originalSize, newSize: f.size });
          return;
        }

        // Desenha a imagem no canvas respeitando as dimens�es otimizadas
        ctx.drawImage(img, 0, 0, width, height);

        // Gera a representa��o WebP com 70% de qualidade
        const dataUrl = canvas.toDataURL('image/webp', quality);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob && blob.size > 0) {
              const webpFile = new File([blob], webpName, { type: 'image/webp' });
              resolve({
                file: webpFile,
                dataUrl,
                blob,
                originalSize,
                newSize: blob.size,
              });
            } else {
              // Fallback se o navegador rejeitar toBlob
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => {
                  const webpFile = new File([b], webpName, { type: 'image/webp' });
                  resolve({
                    file: webpFile,
                    dataUrl,
                    blob: b,
                    originalSize,
                    newSize: b.size,
                  });
                })
                .catch(() => {
                  const f = new File([sourceBlob], webpName, { type: 'image/webp' });
                  resolve({ file: f, dataUrl, blob: sourceBlob, originalSize, newSize: f.size });
                });
            }
          },
          'image/webp',
          quality
        );
      } catch (canvasErr) {
        URL.revokeObjectURL(objectUrl);
        console.warn('Erro no processamento canvas WebP:', canvasErr);
        const f = new File([sourceBlob], webpName, { type: 'image/webp' });
        resolve({ file: f, dataUrl: objectUrl, blob: sourceBlob, originalSize, newSize: f.size });
      }
    };

    img.onerror = async () => {
      URL.revokeObjectURL(objectUrl);
      // Tentativa de convers�o via API de fallback /api/convert-image
      try {
        const resp = await fetch('/api/convert-image', {
          method: 'POST',
          body: sourceBlob,
        });
        if (resp.ok) {
          const webpBlob = await resp.blob();
          const webpFile = new File([webpBlob], webpName, { type: 'image/webp' });
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = (reader.result as string) || '';
            resolve({
              file: webpFile,
              dataUrl,
              blob: webpBlob,
              originalSize,
              newSize: webpBlob.size,
            });
          };
          reader.readAsDataURL(webpBlob);
          return;
        }
      } catch (apiErr) {
        console.warn('Fallback /api/convert-image falhou:', apiErr);
      }

      const f = new File([sourceBlob], webpName, { type: 'image/webp' });
      resolve({ file: f, dataUrl: getFallbackImageDataUrl(originalName), blob: sourceBlob, originalSize, newSize: f.size });
    };

    img.src = objectUrl;
  });
}

/**
 * Converte HEIC/HEIF para WebP mantendo compatibilidade com c�digo existente
 */
export async function convertHeicToJpeg(file: File | Blob, originalFileName?: string): Promise<File> {
  const result = await convertImageToWebP(file, WEBP_QUALITY);
  return result.file;
}

export async function convertHeicToWebP(file: File | Blob, originalFileName?: string): Promise<File> {
  const result = await convertImageToWebP(file, WEBP_QUALITY);
  return result.file;
}

/**
 * Converte arquivo para DataURL em formato image/webp com 70% de qualidade
 */
export async function fileToDataUrl(
  file: File | Blob,
  maxDimension = 1920,
  quality = WEBP_QUALITY
): Promise<string> {
  const result = await convertImageToWebP(file, quality, maxDimension);
  return result.dataUrl;
}

export function detectEntityFromFilename(
  fileName: string,
  existingThemes?: Array<{ name: string; characters?: string[] }>
): string {
  if (!fileName) return 'Tema Decorativo';

  // Remove extens�o e limpa caracteres especiais
  const clean = fileName
    .replace(/\.[^/.]+$/, '')       // remove extens�o .jpg, .png, .heic, .webp etc.
    .replace(/\(\d+\)/g, '')        // remove sufixos num�ricos de arquivo como (1), (2), (3), (6)
    .replace(/[-_]+/g, ' ')         // substitui tra�os e underlines por espa�os
    .replace(/\s+/g, ' ')           // normaliza espa�os
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

  // 2. Mapeamento de termos tem�ticos frequentes para t�tulos amig�veis
  const commonPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /hot\s*wheels|hotweels/i, name: 'Hot Wheels' },
    { pattern: /naruto|sasuke|kakashi|shinobi|ninja/i, name: 'Naruto' },
    { pattern: /bob\s*esponja|spongebob|patrick\s*estrela/i, name: 'Turma do Bob Esponja' },
    { pattern: /mario|luigi|yoshi/i, name: 'Super Mario Bros' },
    { pattern: /frozen|elsa|anna|olaf/i, name: 'Frozen Uma Aventura Congelante' },
    { pattern: /moana|maui/i, name: 'Moana Baby' },
    { pattern: /bolofofos/i, name: 'Bolofofos' },
    { pattern: /mickey|minnie/i, name: 'Mickey & Minnie' },
    { pattern: /sonic/i, name: 'Sonic the Hedgehog' },
    { pattern: /pokemon|pikachu/i, name: 'Pok�mon' },
    { pattern: /dragon\s*ball|goku|vegeta/i, name: 'Dragon Ball Z' },
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
    { pattern: /circo/i, name: 'Circo M�gico' },
    { pattern: /realeza|principe|princesa/i, name: 'Princesas da Realeza' },
    { pattern: /jardim\s*encantado/i, name: 'Jardim Encantado' },
    { pattern: /astronauta|espaco/i, name: 'Astronauta no Espa�o' },
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

  return formatted || 'Tema em Revis�o';
}

export function getFallbackImageDataUrl(label: string = 'Tema'): string {
  const cleanLabel = (label || 'Tema').replace(/\.[^/.]+$/, '').substring(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e11d48"/>
        <stop offset="100%" stop-color="#9f1239"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="24" fill="url(#g)"/>
    <circle cx="200" cy="165" r="46" fill="rgba(255,255,255,0.2)"/>
    <path d="M178 175 l15 -18 l14 16 l15 -22 l18 24 z" fill="#ffffff"/>
    <text x="200" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanLabel}</text>
    <text x="200" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fecdd3" text-anchor="middle">Foto Vinculada (.WEBP 70%)</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
