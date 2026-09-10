import { NextRequest } from 'next/server';
import { validateApiAuth, apiResponse, apiError, handleOptions } from '@/lib/api-auth';
import { aiOrchestrator } from '@/services/ai/orchestrator';
import { apiService } from '@/services/api/api-service';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/webhook/whatsapp
 * Webhook unificado e inteligente para conexão com WhatsApp
 * Compatível nativamente com Evolution API, Z-API, Baileys, Typebot e n8n.
 * 
 * Aceita tanto formatos padronizados:
 * { "senderPhone": "5511977823876", "message": "O tema Vingadores está livre dia 15/10?", "imageUrl": "..." }
 * 
 * Quanto webhooks da Evolution API / Z-API:
 * { "data": { "key": { "remoteJid": "5511977823876@s.whatsapp.net" }, "message": { "conversation": "..." } } }
 */
export async function POST(request: NextRequest) {
  const auth = validateApiAuth(request);
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const rawBody = await request.json();

    // Extração inteligente de parâmetros de múltiplos formatos de Webhook
    let senderPhone =
      rawBody.senderPhone ||
      rawBody.phone ||
      rawBody.from ||
      rawBody.remoteJid ||
      rawBody?.data?.key?.remoteJid ||
      '';

    // Limpa o JID do WhatsApp (ex: "5511977823876@s.whatsapp.net" -> "5511977823876")
    senderPhone = senderPhone.replace(/@.+/, '').replace(/\D/g, '');

    let text =
      rawBody.message ||
      rawBody.text ||
      rawBody.body ||
      rawBody?.data?.message?.conversation ||
      rawBody?.data?.message?.extendedTextMessage?.text ||
      '';

    const imageUrl =
      rawBody.imageUrl ||
      rawBody.mediaUrl ||
      rawBody?.data?.message?.imageMessage?.url ||
      undefined;

    if (!text && !imageUrl) {
      return apiError('O payload deve conter uma mensagem de texto ou uma URL de imagem.', 422);
    }

    // 1. Processamento de comandos estruturados rápidos (atalhos operacionais)
    const textTrimmed = text.trim();
    const textLower = textTrimmed.toLowerCase();

    // Comando rápido: Cadastrar Cliente ("cadastrar cliente João Silva 11999998888")
    if (textLower.startsWith('cadastrar cliente') || textLower.startsWith('criar cliente')) {
      const parts = textTrimmed.replace(/^(cadastrar|criar) cliente\s*/i, '').trim();
      // Extrair telefone do final da frase se houver
      const phoneMatch = parts.match(/(\+?\d[\d\s\-()]{8,}\d)$/);
      let name = parts;
      let phone = senderPhone;

      if (phoneMatch) {
        phone = phoneMatch[0].replace(/\D/g, '');
        name = parts.replace(phoneMatch[0], '').trim();
      }

      if (name.length >= 2 && phone.length >= 8) {
        const { customer, isNew } = await apiService.upsertCustomer({
          name,
          phone,
          notes: 'Cadastrado via comando do WhatsApp',
        });

        const reply = `✅ *Cliente ${isNew ? 'Cadastrado' : 'Atualizado'} com Sucesso!*\n\n` +
          `👤 *Nome:* ${customer.name}\n` +
          `📱 *WhatsApp:* ${customer.phone}\n` +
          `🆔 *ID:* \`${customer.id}\`\n\n` +
          `Você já pode lançar pedidos para este cliente.`;

        return apiResponse({
          success: true,
          action: 'CUSTOMER_UPSERT',
          replyMessage: reply,
          data: customer,
        });
      }
    }

    // 2. Consulta rápida de cliente pelo telefone do remetente
    if (textLower === 'meus dados' || textLower === 'quem sou eu' || textLower === 'consultar cliente') {
      const customer = await apiService.getCustomerByPhone(senderPhone);
      if (customer) {
        const rentals = apiService.getRentalById(customer.id);
        const reply = `🔍 *Cadastro Localizado!*\n\n` +
          `👤 *Nome:* ${customer.name}\n` +
          `📱 *Telefone:* ${customer.phone}\n` +
          (customer.email ? `📧 *Email:* ${customer.email}\n` : '') +
          (customer.address ? `📍 *Endereço:* ${customer.address}\n` : '');

        return apiResponse({
          success: true,
          action: 'CUSTOMER_INFO',
          replyMessage: reply,
          data: customer,
        });
      } else {
        const reply = `Olá! Não encontrei nenhum cadastro com o seu número de WhatsApp (${senderPhone}).\n` +
          `Para se cadastrar, envie:\n"Cadastrar cliente Seu Nome"`;
        return apiResponse({
          success: true,
          action: 'CUSTOMER_NOT_FOUND',
          replyMessage: reply,
          data: null,
        });
      }
    }

    // 3. Orquestrador de IA Multimodal (Gemini / Tool Calling / Catálogo)
    const aiResponse = await aiOrchestrator.processInput({
      channel: 'whatsapp',
      senderId: senderPhone || 'whatsapp-client',
      text,
      imageUrl,
      context: rawBody.context,
    });

    return apiResponse({
      success: true,
      action: 'AI_ORCHESTRATOR',
      replyMessage: aiResponse.message,
      confidence: aiResponse.confidence,
      identifiedTheme: aiResponse.identifiedTheme,
      identifiedVariant: aiResponse.identifiedVariant,
      requiresUserAction: aiResponse.requiresUserAction,
      options: aiResponse.options,
      toolCalls: aiResponse.toolCalls,
    });
  } catch (err: unknown) {
    return apiError('Falha no processamento do webhook.', 500, (err as Error).message);
  }
}
