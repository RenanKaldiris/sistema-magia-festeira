async function testWebhook() {
  const url = 'https://n8n.grupokaldiris.com.br/webhook/magiafesteira';
  console.log(`Enviando POST de teste para: ${url}...`);

  const payload = {
    data: {
      key: {
        remoteJid: '5511977823876@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_MSG_' + Date.now()
      },
      pushName: 'Renan Kaldiris',
      messageType: 'conversation',
      message: {
        conversation: 'Quantos temas tenho disponíveis?'
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`Status do Webhook: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Resposta: ${text.slice(0, 300)}`);
  } catch (err) {
    console.error('Erro na chamada:', err.message);
  }
}

testWebhook();
