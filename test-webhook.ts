async function testWebhook() {
  const payload = {
    event: 'payment.approved',
    data: {
      customer: {
        email: 'thi@gmail.com'
      },
      subscription: {
        id: 'sub_cakto_test_9999'
      }
    }
  };

  try {
    const res = await fetch('http://localhost:3000/api/webhooks/cakto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(`[TESTE WEBHOOK] Status: ${res.status}`);
    console.log(`[TESTE WEBHOOK] Resposta:`, text);
  } catch (err) {
    console.error('[TESTE WEBHOOK] Erro ao chamar a rota:', err);
  }
}

testWebhook();
