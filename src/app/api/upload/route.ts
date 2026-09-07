import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import convert from 'heic-convert';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Pipeline Universal de Upload e Conversão Obrigatória para WebP 70%
 * - Converte qualquer formato (JPEG, PNG, HEIC, HEIF, WebP, etc.)
 * - Rotação automática respeitando EXIF de câmeras de celular
 * - Redimensionamento inteligente (máx. 1600px de largura/altura)
 * - Compressão Sharp para .webp com quality: 70
 * - Salva no Supabase Storage bucket 'photos' (persistente e de alta velocidade)
 * - Retorna URL pública persistente do CDN Supabase
 */
export async function POST(req: Request) {
  try {
    let inputBuffer: Buffer | null = null;
    let originalName = 'foto.webp';
    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo encontrado no formulário' }, { status: 400 });
      }
      originalName = file.name || 'foto.webp';
      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      const arrayBuffer = await req.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: 'Nenhum dado de imagem recebido' }, { status: 400 });
      }
      inputBuffer = Buffer.from(arrayBuffer);
      const nameHeader = req.headers.get('x-filename');
      if (nameHeader) {
        originalName = decodeURIComponent(nameHeader);
      }
    }

    const originalSize = inputBuffer.length;
    let sourceBuffer = inputBuffer;

    // Decodificação para arquivos HEIC / HEIF de iPhone
    const isHeic =
      contentType.includes('heic') ||
      contentType.includes('heif') ||
      /\.(heic|heif)$/i.test(originalName);

    if (isHeic) {
      try {
        sourceBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.9,
        });
      } catch (heicErr) {
        console.warn('[upload] Falha na conversão heic-convert, tentando sharp direto:', heicErr);
      }
    }

    // Processamento e compressão via Sharp para WebP 70% com limites de dimensão
    const processed = sharp(sourceBuffer)
      .rotate() // orienta corretamente fotos tiradas em pé/deitado
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 70, effort: 4 });

    const { data: webpBuffer, info } = await processed.toBuffer({ resolveWithObject: true });

    // Nome limpo do arquivo com extensão .webp
    const baseSlug = originalName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'imagem';
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 7);
    const fileName = `${baseSlug}-${timestamp}-${randomHex}.webp`;

    let finalUrl = '';

    // 1. Tentar upload no Supabase Storage via supabaseAdmin ou client
    const storageClient = supabaseAdmin || supabase;
    if (storageClient) {
      try {
        const bucket = 'photos';
        const { data: uploadData, error: uploadErr } = await storageClient.storage
          .from(bucket)
          .upload(`uploads/${fileName}`, webpBuffer, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: true,
          });

        if (!uploadErr && uploadData?.path) {
          const { data: publicUrlData } = storageClient.storage
            .from(bucket)
            .getPublicUrl(uploadData.path);
          if (publicUrlData?.publicUrl) {
            finalUrl = publicUrlData.publicUrl;
          }
        } else if (uploadErr) {
          console.warn('[upload] Erro Supabase storage:', uploadErr.message);
        }
      } catch (cloudErr) {
        console.warn('[upload] Supabase storage upload indisponível, usando fallback local:', cloudErr);
      }
    }

    // 2. Armazenamento local persistente em public/uploads/
    if (!finalUrl) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, webpBuffer);
      finalUrl = `/uploads/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      fileName,
      originalName,
      mimeType: 'image/webp',
      originalSize,
      size: webpBuffer.length,
      width: info.width,
      height: info.height,
    });
  } catch (error: any) {
    console.error('[API /api/upload error]', error);
    return NextResponse.json(
      {
        error: 'Falha no upload e conversão da imagem para WebP 70%',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
