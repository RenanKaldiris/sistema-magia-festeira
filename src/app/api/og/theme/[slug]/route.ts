import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { apiService } from '@/services/api/api-service';
import { store } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/og/theme/[slug]
 * Retorna a foto do tema otimizada em JPEG (1200x630 px) para preview em redes sociais e WhatsApp.
 * Compatível 100% com o crawler do WhatsApp (que exige imagem de alta resolução, leve < 300KB e formato JPEG).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug).trim();

    // 1. Busca tema no Supabase Cloud ou Store
    let theme = (await apiService.resolveTheme(cleanSlug)) || store.getThemeBySlug(cleanSlug);

    // 2. Determina a imagem principal do tema
    let imageUrl =
      theme?.primary_media?.storage_path ||
      (theme?.media && theme.media.length > 0 ? theme.media[0].storage_path : '') ||
      (theme as any)?.imageUrl ||
      '';

    // 2.1 Fallback Direto Supabase: se imageUrl estiver vazia, consulta direto na tabela media
    if (!imageUrl && supabase) {
      try {
        const themeId = theme?.id;
        if (themeId) {
          const { data: mediaRow } = await supabase
            .from('media')
            .select('storage_path')
            .eq('entity_id', themeId)
            .order('is_primary', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (mediaRow?.storage_path) {
            imageUrl = mediaRow.storage_path;
          }
        } else {
          const { data: foundTheme } = await supabase
            .from('themes')
            .select('id, name')
            .or(`slug.ilike.${cleanSlug},code.ilike.${cleanSlug},name.ilike.%${cleanSlug}%`)
            .limit(1)
            .maybeSingle();

          if (foundTheme?.id) {
            const { data: mediaRow } = await supabase
              .from('media')
              .select('storage_path')
              .eq('entity_id', foundTheme.id)
              .order('is_primary', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (mediaRow?.storage_path) {
              imageUrl = mediaRow.storage_path;
            }
          }
        }
      } catch (err) {
        console.warn('[OG Direct Media Fallback Error]', err);
      }
    }

    let imageBuffer: Buffer | null = null;

    if (imageUrl) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          const res = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            signal: AbortSignal.timeout(6000),
          });
          if (res.ok) {
            const arr = await res.arrayBuffer();
            imageBuffer = Buffer.from(arr);
          }
        } catch (fetchErr) {
          console.warn('[OG Image Fetch Error]', fetchErr);
        }
      } else if (imageUrl.startsWith('/')) {
        // Arquivo local em /public
        const localPath = path.join(process.cwd(), 'public', imageUrl);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
        }
      }
    }

    // 3. Fallback: Se não encontrou a foto do tema, usa o logo da Magia Festeira
    if (!imageBuffer) {
      const defaultLogoPath = path.join(process.cwd(), 'public', 'logo', 'logo-dark.png');
      if (fs.existsSync(defaultLogoPath)) {
        imageBuffer = fs.readFileSync(defaultLogoPath);
      }
    }

    if (!imageBuffer) {
      // Cria imagem sólida de 1200x630 com cor de fundo da Magia Festeira (Rose)
      const svgPlaceholder = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="630" fill="#0f172a"/>
          <text x="600" y="315" font-family="sans-serif" font-size="48" font-weight="bold" fill="#f43f5e" text-anchor="middle" dominant-baseline="middle">
            ${theme?.name || 'Magia Festeira'}
          </text>
        </svg>
      `;
      imageBuffer = Buffer.from(svgPlaceholder);
    }

    // 4. Converte e redimensiona para 1200x630 JPEG com compressão otimizada para WhatsApp
    const processedJpeg = await sharp(imageBuffer)
      .rotate()
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    return new Response(new Uint8Array(processedJpeg), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        'Content-Length': String(processedJpeg.length),
      },
    });
  } catch (error) {
    console.error('[API OG Theme Error]', error);
    return NextResponse.json({ error: 'Erro ao gerar prévia da imagem' }, { status: 500 });
  }
}
