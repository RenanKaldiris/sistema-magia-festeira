import { NextResponse } from 'next/server';
import sharp from 'sharp';
// @ts-ignore
import convert from 'heic-convert';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint Universal de Conversao de Imagens:
 * Converte qualquer imagem recebida para formato .WEBP com 70% de qualidade.
 */
export async function POST(req: Request) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo de imagem recebido' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(arrayBuffer);
    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    let sourceBuffer = inputBuffer;

    // Se o payload for HEIC / HEIF, decodifica primeiro via heic-convert
    if (contentType.includes('heic') || contentType.includes('heif')) {
      try {
        sourceBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.9,
        });
      } catch (heicErr) {
        console.warn('[convert-image] Falha heic-convert, tentando sharp direto:', heicErr);
      }
    }

    // Processamento e conversao de alta performance com Sharp para WebP 70%
    const webpBuffer = await sharp(sourceBuffer)
      .rotate() // respeita orientacao EXIF da camera do celular
      .webp({ quality: 70, effort: 4 })
      .toBuffer();

    return new NextResponse(webpBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'X-Converted-Format': 'webp',
        'X-Converted-Quality': '70',
      },
    });
  } catch (error: any) {
    console.error('[API convert-image error]', error);
    return NextResponse.json(
      { error: 'Falha na conversao da imagem para WebP 70%', details: error?.message },
      { status: 500 }
    );
  }
}
