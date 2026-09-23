'use server'

import { db } from '@/lib/db'
import { decimalToNumber } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'
import { AppointmentStatus, TransactionCategory, TransactionType } from '@prisma/client'
import { startOfDay, endOfDay, addMinutes, format, isBefore, isAfter, parse } from 'date-fns'
import { getBarberScheduleAction } from '@/app/actions/profile'
import { revalidatePath } from 'next/cache'

export interface CreateAppointmentInput {
  organizationSlug: string
  clientName: string
  clientPhone: string
  serviceId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
}

export interface AppointmentItem {
  id: string
  clientName: string
  clientPhone: string | null
  serviceId: string
  serviceName: string
  price: number
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: AppointmentStatus
  date: string
}

/**
 * Busca agendamentos de uma data específica
 */
export async function getAppointmentsForDate(
  date: Date = new Date(),
  organizationId?: string
): Promise<AppointmentItem[]> {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  let targetOrgId = organizationId
  if (!targetOrgId) {
    const user = await getCurrentUser()
    const barber = user || (await db.user.findFirst({ include: { organization: true } }))
    targetOrgId = barber?.organization_id
  }

  const appointments = await db.appointment.findMany({
    where: {
      ...(targetOrgId ? { organization_id: targetOrgId } : {}),
      start_time: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      service: true,
    },
    orderBy: {
      start_time: 'asc',
    },
  })

  return appointments.map((a) => ({
    id: a.id,
    clientName: a.client_name,
    clientPhone: a.client_phone,
    serviceId: a.service_id,
    serviceName: a.service.name,
    price: decimalToNumber(a.service.price),
    startTime: format(a.start_time, 'HH:mm'),
    endTime: format(a.end_time, 'HH:mm'),
    status: a.status,
    date: format(a.start_time, 'yyyy-MM-dd'),
  }))
}

/**
 * Busca quais dias do mês possuem agendamentos para destacar no calendário
 */
export async function getAppointmentDaysForMonth(
  year: number,
  month: number,
  organizationId?: string
): Promise<number[]> {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

  let targetOrgId = organizationId
  if (!targetOrgId) {
    const user = await getCurrentUser()
    const barber = user || (await db.user.findFirst({ include: { organization: true } }))
    targetOrgId = barber?.organization_id
  }

  const appointments = await db.appointment.findMany({
    where: {
      ...(targetOrgId ? { organization_id: targetOrgId } : {}),
      start_time: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: {
        not: AppointmentStatus.CANCELED,
      },
    },
    select: {
      start_time: true,
    },
  })

  return Array.from(new Set(appointments.map((a) => a.start_time.getDate())))
}

/**
 * Cria um novo agendamento no banco de dados
 */
export async function createAppointment(input: CreateAppointmentInput) {
  // 1. Busca a organização e o barbeiro
  const org = await db.organization.findUnique({
    where: { slug: input.organizationSlug },
    include: { users: true },
  })

  if (!org) throw new Error('Barbearia não encontrada')

  const barber = org.users[0]
  if (!barber) throw new Error('Nenhum barbeiro disponível')

  // 2. Busca o serviço
  const service = await db.service.findUnique({
    where: { id: input.serviceId },
  })

  if (!service) throw new Error('Serviço não encontrado')

  // 3. Monta horários de início e término
  const startDateTime = parse(`${input.date} ${input.time}`, 'yyyy-MM-dd HH:mm', new Date())
  const endDateTime = addMinutes(startDateTime, service.duration_minutes)

  // 4. Verifica conflito de horário
  const conflict = await db.appointment.findFirst({
    where: {
      user_id: barber.id,
      status: { not: AppointmentStatus.CANCELED },
      OR: [
        {
          start_time: { lte: startDateTime },
          end_time: { gt: startDateTime },
        },
        {
          start_time: { lt: endDateTime },
          end_time: { gte: endDateTime },
        },
      ],
    },
  })

  if (conflict) {
    throw new Error('Este horário já foi preenchido. Por favor, escolha outro horário.')
  }

  // 5. Cria o agendamento
  const appointment = await db.appointment.create({
    data: {
      organization_id: org.id,
      user_id: barber.id,
      client_name: input.clientName.trim(),
      client_phone: input.clientPhone.trim(),
      service_id: service.id,
      start_time: startDateTime,
      end_time: endDateTime,
      status: AppointmentStatus.CONFIRMED,
    },
    include: {
      service: true,
    },
  })

  try {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/agenda')
  } catch {}

  return {
    success: true,
    appointmentId: appointment.id,
    clientName: appointment.client_name,
    serviceName: appointment.service.name,
    startTime: input.time,
    date: input.date,
  }
}

/**
 * Conclui um agendamento e lança a receita no caixa.
 * Bloqueia a conclusão de agendamentos para datas futuras.
 */
export async function completeAppointment(appointmentId: string) {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true },
  })

  if (!appt) throw new Error('Agendamento não encontrado')
  if (appt.status === AppointmentStatus.DONE) {
    return { success: true, message: 'Agendamento já estava concluído' }
  }

  // Validação: Não permite concluir agendamentos de datas futuras
  const todayStart = startOfDay(new Date())
  const apptDayStart = startOfDay(appt.start_time)
  if (isAfter(apptDayStart, todayStart)) {
    throw new Error('Não é permitido concluir agendamentos de datas futuras. O atendimento só pode ser concluído no dia do agendamento (ou em datas passadas).')
  }

  // 1. Atualiza status para DONE
  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.DONE },
  })

  // 2. Lança a transação no caixa na data exata do atendimento
  await db.transaction.create({
    data: {
      organization_id: appt.organization_id,
      user_id: appt.user_id,
      appointment_id: appt.id,
      type: TransactionType.INCOME,
      category: TransactionCategory.SERVICE,
      amount: appt.service.price,
      description: `Atendimento: ${appt.service.name} (${appt.client_name})`,
      created_at: appt.start_time,
    },
  })

  return { success: true, appointment: updated }
}

const DAY_NAMES: Record<string, string> = {
  dom: 'Domingo',
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
}

/**
 * Retorna os horários disponíveis para agendamento em uma data,
 * respeitando os dias de atendimento do barbeiro, horários de expediente e pausas.
 */
export async function getAvailableSlots(
  dateStr: string,
  durationMinutes: number = 30,
  organizationSlug?: string
): Promise<{ slots: string[]; isWorkDay: boolean; dayName: string }> {
  const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date())
  const DAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const dayKey = DAY_KEYS[targetDate.getDay()]
  const dayName = DAY_NAMES[dayKey] || 'Dia'

  // 1. Busca configurações de horários de atendimento do barbeiro
  const schedule = await getBarberScheduleAction()

  // 2. Se o dia da semana estiver configurado como FOLGA
  if (schedule.workDays && schedule.workDays[dayKey] === false) {
    return {
      slots: [],
      isWorkDay: false,
      dayName,
    }
  }

  // 3. Horários do expediente e intervalo de pausa
  const startTime = schedule.startTime || '09:00'
  const endTime = schedule.endTime || '20:00'
  const breakEnabled = schedule.breakEnabled ?? true
  const breakStart = schedule.breakStart || '12:30'
  const breakEnd = schedule.breakEnd || '13:30'
  const stepMinutes = schedule.slotMinutes || durationMinutes || 30

  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const toTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const startMins = toMins(startTime)
  const endMins = toMins(endTime)
  const breakStartMins = toMins(breakStart)
  const breakEndMins = toMins(breakEnd)

  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  // Busca a organização pelo slug para filtrar agendamentos
  let orgId: string | undefined
  if (organizationSlug) {
    const org = await db.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true },
    })
    orgId = org?.id
  }

  // Busca agendamentos existentes no dia
  const existingAppts = await db.appointment.findMany({
    where: {
      ...(orgId ? { organization_id: orgId } : {}),
      start_time: { gte: dayStart, lte: dayEnd },
      status: { not: AppointmentStatus.CANCELED },
    },
    select: {
      start_time: true,
      end_time: true,
    },
  })

  const slots: string[] = []
  const now = new Date()

  for (let currentMins = startMins; currentMins + durationMinutes <= endMins; currentMins += stepMinutes) {
    // Se a pausa estiver ativada, ignora horários que colidem com a pausa
    if (breakEnabled && currentMins < breakEndMins && currentMins + durationMinutes > breakStartMins) {
      continue
    }

    const timeStr = toTimeStr(currentMins)
    const slotStart = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date())
    const slotEnd = addMinutes(slotStart, durationMinutes)

    // Se for hoje, ignora horários passados
    if (isBefore(slotStart, now)) continue

    // Verifica colisão com agendamentos existentes
    const hasConflict = existingAppts.some((appt) => {
      return slotStart < appt.end_time && slotEnd > appt.start_time
    })

    if (!hasConflict) {
      slots.push(timeStr)
    }
  }

  return {
    slots,
    isWorkDay: true,
    dayName,
  }
}

/**
 * Exclui um único agendamento verificando seu status antes.
 * Se o agendamento estiver no status "DONE" (concluído/finalizado),
 * a transação de receita no caixa é estornada dentro de uma Database Transaction (db.$transaction).
 * Se o agendamento estiver como "PENDING", "CONFIRMED" ou "CANCELED", apenas o registro do agendamento é excluído sem alterar saldo.
 */
export async function deleteAppointment(appointmentId: string): Promise<{
  success: boolean
  appointmentId: string
  status: AppointmentStatus
  incomeReversed: boolean
}> {
  return await db.$transaction(async (tx) => {
    // 1. Busca o agendamento no banco antes da exclusão
    const appt = await tx.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, status: true, organization_id: true, user_id: true },
    })

    if (!appt) {
      throw new Error('Agendamento não encontrado')
    }

    let incomeReversed = false

    // 2. Se estiver no status DONE (concluído/finalizado), estorna as receitas vinculadas no caixa
    if (appt.status === AppointmentStatus.DONE) {
      const deletedTx = await tx.transaction.deleteMany({
        where: { appointment_id: appt.id },
      })
      incomeReversed = deletedTx.count > 0
    }

    // 3. Exclui o agendamento de forma atômica
    await tx.appointment.delete({
      where: { id: appointmentId },
    })

    return {
      success: true,
      appointmentId: appt.id,
      status: appt.status,
      incomeReversed,
    }
  })
}

/**
 * Apaga agendamentos da organização (todos ou de uma data específica).
 * Executado dentro de uma Database Transaction atômica (db.$transaction).
 * Valida o status dos agendamentos: se houver agendamentos "DONE" (concluídos/finalizados),
 * estorna os valores financeiros associados removendo as transações de receita no caixa do barbeiro.
 */
export async function deleteAppointments(
  organizationId: string,
  mode: 'all' | 'day',
  dateStr?: string
): Promise<{ count: number; reversedTransactionsCount: number }> {
  const orgIds = Array.from(new Set([organizationId, 'org-1']))

  let whereClause: Record<string, any> = {
    organization_id: { in: orgIds },
  }

  if (mode === 'day' && dateStr) {
    const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date())
    whereClause.start_time = {
      gte: startOfDay(targetDate),
      lte: endOfDay(targetDate),
    }
  }

  return await db.$transaction(async (tx) => {
    // 1. Busca os agendamentos afetados para validar os status ANTES da exclusão
    const targetAppts = await tx.appointment.findMany({
      where: whereClause,
      select: { id: true, status: true },
    })

    const doneApptIds = targetAppts
      .filter((a) => a.status === AppointmentStatus.DONE)
      .map((a) => a.id)

    let reversedTransactionsCount = 0

    // 2. Se houver agendamentos finalizados ou modo de exclusão geral (mode === 'all'), realiza o estorno das receitas no caixa
    const txWhere: Record<string, any> =
      mode === 'all'
        ? { organization_id: { in: orgIds }, category: TransactionCategory.SERVICE }
        : { appointment_id: { in: doneApptIds } }

    if (mode === 'all' || doneApptIds.length > 0) {
      const deletedTx = await tx.transaction.deleteMany({
        where: txWhere,
      })
      reversedTransactionsCount = deletedTx.count
    }

    // 3. Exclui os agendamentos do banco de dados
    const result = await tx.appointment.deleteMany({
      where: whereClause,
    })

    return {
      count: result.count,
      reversedTransactionsCount,
    }
  })
}
