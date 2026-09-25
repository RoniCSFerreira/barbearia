import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // ou importar do caminho correto do seu prisma client, ajustaremos se for diferente

// Defina sua chave/token da Cakto (você pega no painel deles) e coloca no arquivo .env
const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || 'test_secret';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Na Cakto, você pode checar headers de autenticação se quiser mais segurança
    // const signature = request.headers.get('authorization');
    // if (signature !== CAKTO_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Exemplo de payload da Cakto
    const { event, data } = payload;
    
    // Certifique-se da estrutura correta enviada pela Cakto (ajuste 'data.customer.email' se necessário)
    const clienteEmail = data?.customer?.email || data?.email; 
    const subscriptionId = data?.subscription?.id || data?.id;

    if (!clienteEmail) {
      return NextResponse.json({ error: 'Email not found in payload' }, { status: 400 });
    }

    console.log(`[Webhook Cakto] Recebido evento: ${event} para o email: ${clienteEmail}`);

    // Pagamento Aprovado ou Renovação -> Ativar Usuário
    if (event === 'payment.approved' || event === 'subscription.renewed') {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1); // + 1 mês

      await db.user.updateMany({
        where: { email: clienteEmail },
        data: {
          status: 'ACTIVE',
          subscription_id: String(subscriptionId),
          subscription_provider: 'CAKTO',
          subscription_ends_at: expirationDate,
          trial_ends_at: expirationDate, // Atualiza a data de vencimento do painel
        },
      });
      console.log(`[Webhook Cakto] Usuário ${clienteEmail} ativado.`);
    }

    // Assinatura Cancelada, Inadimplente ou Estornada -> Suspender
    if (
      event === 'subscription.canceled' ||
      event === 'payment.refunded' ||
      event === 'payment.failed'
    ) {
      await db.user.updateMany({
        where: { email: clienteEmail },
        data: {
          status: 'SUSPENDED',
        },
      });
      console.log(`[Webhook Cakto] Usuário ${clienteEmail} suspenso.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook Cakto] Erro interno:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
