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

    const activeEvents = [
      'payment.approved',
      'purchase_approved',
      'subscription.renewed',
      'subscription_renewed',
      'subscription_created',
      'subscription_reactivated',
      'subscription_recovered'
    ];

    const suspendedEvents = [
      'subscription.canceled',
      'subscription_canceled',
      'subscription_paused',
      'subscription_delayed',
      'payment.refunded',
      'purchase_refunded',
      'payment.failed',
      'purchase_failed',
      'chargeback'
    ];

    // Pagamento Aprovado ou Renovação -> Ativar Usuário
    if (activeEvents.includes(event)) {
      const user = await db.user.findUnique({
        where: { email: clienteEmail },
      });

      if (user) {
        const now = new Date();
        const currentExpiration = user.trial_ends_at || now;
        
        let newExpiration = new Date();
        // Se pagou adiantado (vencimento ainda está no futuro), soma a partir do vencimento atual
        if (currentExpiration > now) {
          newExpiration = new Date(currentExpiration);
          newExpiration.setMonth(newExpiration.getMonth() + 1);
        } else {
          // Se pagou atrasado (já venceu), soma 1 mês a partir de hoje
          newExpiration.setMonth(newExpiration.getMonth() + 1);
        }

        await db.user.update({
          where: { email: clienteEmail },
          data: {
            status: 'ACTIVE',
            subscription_id: String(subscriptionId),
            subscription_provider: 'CAKTO',
            subscription_ends_at: newExpiration,
            trial_ends_at: newExpiration, 
          },
        });
        console.log(`[Webhook Cakto] Usuário ${clienteEmail} ativado. Novo vencimento: ${newExpiration.toISOString()}`);
      }
    }

    // Assinatura Cancelada, Inadimplente ou Estornada -> Suspender
    if (suspendedEvents.includes(event)) {
      await db.user.updateMany({
        where: { email: clienteEmail },
        data: {
          status: 'SUSPENDED',
        },
      });
      console.log(`[Webhook Cakto] Usuário ${clienteEmail} suspenso. Evento: ${event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[Webhook Cakto] Erro interno:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
