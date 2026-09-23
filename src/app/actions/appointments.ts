'use server'

import { getCurrentUser } from '@/lib/auth'
import { deleteAppointments, deleteAppointment } from '@/services/appointments'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para exclusão em lote (dia específico ou todos os agendamentos).
 * Executa a lógica de estorno financeiro em transação caso haja cortes com status "DONE".
 */
export async function deleteAppointmentsAction(mode: 'all' | 'day', dateStr?: string) {
  try {
    const user = await getCurrentUser()
    const barber = user || (await db.user.findFirst({ include: { organization: true } }))

    if (!barber || !barber.organization_id) {
      return { success: false, error: 'Usuário ou barbearia não encontrada' }
    }

    const result = await deleteAppointments(barber.organization_id, mode, dateStr)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard/financeiro')

    return {
      success: true,
      count: result.count,
      reversedTransactionsCount: result.reversedTransactionsCount,
    }
  } catch (error: any) {
    console.error('Erro ao excluir agendamentos:', error)
    return { success: false, error: error.message || 'Erro ao excluir agendamentos' }
  }
}

/**
 * Server Action para exclusão de um único agendamento por ID.
 * Se o agendamento estiver concluído ("DONE"), realiza o estorno no caixa do barbeiro.
 */
export async function deleteSingleAppointmentAction(appointmentId: string) {
  try {
    const user = await getCurrentUser()
    const barber = user || (await db.user.findFirst({ include: { organization: true } }))

    if (!barber || !barber.organization_id) {
      return { success: false, error: 'Usuário ou barbearia não encontrada' }
    }

    const result = await deleteAppointment(appointmentId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard/financeiro')

    return result
  } catch (error: any) {
    console.error('Erro ao excluir agendamento:', error)
    return { success: false, error: error.message || 'Erro ao excluir agendamento' }
  }
}
