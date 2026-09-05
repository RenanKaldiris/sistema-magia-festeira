import { NextResponse } from 'next/server';
// @ts-ignore
import convert from 'heic-convert';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Nenhum dado recebido' }, { status: 400 });
    }
    const inputBuffer = Buffer.from(arrayBuffer);
    
    // 1. Converte HEIC/HEIF para buffer intermediário
    const jpegBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9,
    });

    // 2. Converte e comprime para WebP com exatamente 70% de qualidade
    const webpBuffer = await sharp(jpegBuffer)
      .webp({ quality: 70 })
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
    console.error('[API convert-heic error]', error);
    return NextResponse.json({ error: 'Falha na conversão HEIC para WEBP', details: error?.message }, { status: 500 });
  }
}
