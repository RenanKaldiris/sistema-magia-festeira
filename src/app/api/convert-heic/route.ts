import { NextResponse } from 'next/server';
// @ts-ignore
import convert from 'heic-convert';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Nenhum dado recebido' }, { status: 400 });
    }
    const inputBuffer = Buffer.from(arrayBuffer);
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.85,
    });
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error: any) {
    console.error('[API convert-heic error]', error);
    return NextResponse.json({ error: 'Falha na conversão HEIC', details: error?.message }, { status: 500 });
  }
}
