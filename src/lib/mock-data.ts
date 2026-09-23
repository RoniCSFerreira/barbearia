/**
 * Mock data realista para desenvolvimento do Dashboard
 * Substitua por queries Prisma após configurar DATABASE_URL
 */

export const mockOrganization = {
  id: 'org-1',
  name: 'Navalha negra',
  slug: 'navalha-negra',
  subtitle: 'Barbearia',
}

export interface MockService {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
}

export const mockServices: MockService[] = [
  {
    id: 's1',
    name: 'Barboterapia com Toalha Quente',
    description: 'Tratamento com óleos essenciais, toalha aromatizada e hidratação profunda para a barba.',
    price: 50,
    duration_minutes: 45,
  },
  {
    id: 's2',
    name: 'Corte Clássico Tesoura',
    description: 'Modelagem tradicional feita 100% na tesoura, lavagem e finalização com pomada.',
    price: 60,
    duration_minutes: 35,
  },
  {
    id: 's3',
    name: 'Degradê Navalhado + Barboterapia',
    description: 'Corte com navalha, acabamento milimétrico, toalha quente e tratamento de barba incluso.',
    price: 95,
    duration_minutes: 50,
  },
  {
    id: 's4',
    name: 'Fade Americano + Sobrancelha',
    description: 'Fade contemporâneo na máquina e navalha com desenho de sobrancelha e acabamento.',
    price: 75,
    duration_minutes: 40,
  },
  {
    id: 's5',
    name: 'Corte Militar + Barba',
    description: 'Corte estilo militar com máquina, barba completa com navalha e produtos premium.',
    price: 85,
    duration_minutes: 45,
  },
  {
    id: 's6',
    name: 'Camuflagem de Cabelo Branco',
    description: 'Coloração natural e discreta para fios brancos, resultado duradouro e aspecto jovem.',
    price: 110,
    duration_minutes: 60,
  },
]


export const mockUser = {
  id: 'user-1',
  name: 'Roni Cleiton Souza Ferreira',
  initials: 'RC',
  role: 'BARBER' as const,
  label: 'BARBEIRO',
  phone: '11976543210',
  email: 'carlos@navalha.com',
  /** 0 = sem repasse. Valores: 0 | 10 | 20 | 30 | 40 | 50 */
  commission_rate: 30,
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELED' | 'IN_PROGRESS'
export type ChairStatus = 'EM_CORTE' | 'LIVRE' | 'INTERVALO'

export interface MockAppointment {
  id: string
  clientName: string
  clientPhone: string
  service: string
  price: number
  startTime: string
  endTime: string
  status: AppointmentStatus
  paymentTag?: string
  chairId: string
  barberName: string
  barberInitials: string
}

export interface MockChair {
  id: string
  label: string
  barberName: string
  barberInitials: string
  status: ChairStatus
  appointmentsCount: number
}

export const mockChairs: MockChair[] = [
  { id: 'c1', label: 'CADEIRA 01', barberName: 'Carlos Mestre', barberInitials: 'CM', status: 'EM_CORTE', appointmentsCount: 4 },
  { id: 'c2', label: 'CADEIRA 02', barberName: 'Lucas Fade', barberInitials: 'LF', status: 'LIVRE', appointmentsCount: 3 },
  { id: 'c3', label: 'CADEIRA 03', barberName: 'Rafael Tesoura', barberInitials: 'RT', status: 'INTERVALO', appointmentsCount: 2 },
  { id: 'c4', label: 'CADEIRA 04', barberName: 'Mateus Navalha', barberInitials: 'MN', status: 'EM_CORTE', appointmentsCount: 3 },
]

export const mockAppointments: MockAppointment[] = [
  { id: 'a1', clientName: 'Bruno Silveira', clientPhone: '11998881111', service: 'Degradê Navalhado + Barboterapia', price: 95, startTime: '10:00', endTime: '10:50', status: 'IN_PROGRESS', chairId: 'c1', barberName: 'Carlos Mestre', barberInitials: 'CM' },
  { id: 'a2', clientName: 'Guilherme Prado', clientPhone: '11976543210', service: 'Corte Clássico Tesoura', price: 60, startTime: '11:00', endTime: '11:35', status: 'CONFIRMED', chairId: 'c1', barberName: 'Carlos Mestre', barberInitials: 'CM' },
  { id: 'a3', clientName: 'Lucas Antunes', clientPhone: '11997772222', service: 'Corte Militar + Barba', price: 85, startTime: '13:30', endTime: '14:15', status: 'CONFIRMED', paymentTag: 'Pré-pago', chairId: 'c1', barberName: 'Carlos Mestre', barberInitials: 'CM' },
  { id: 'a4', clientName: 'Alexandre Costa', clientPhone: '11996663333', service: 'Corte Infantil Estilizado', price: 55, startTime: '09:00', endTime: '09:40', status: 'DONE', paymentTag: 'PIX PAGO', chairId: 'c1', barberName: 'Carlos Mestre', barberInitials: 'CM' },
  { id: 'a5', clientName: 'Marcos Vinícius', clientPhone: '11995554444', service: 'Fade Americano + Sobrancelha', price: 75, startTime: '10:15', endTime: '10:55', status: 'PENDING', paymentTag: 'Chega em 10m', chairId: 'c2', barberName: 'Lucas Fade', barberInitials: 'LF' },
  { id: 'a6', clientName: 'Rodrigo Mendonça', clientPhone: '11994445555', service: 'Camuflagem de Cabelo Branco', price: 110, startTime: '11:15', endTime: '12:00', status: 'CONFIRMED', paymentTag: 'Cartão na Local', chairId: 'c2', barberName: 'Lucas Fade', barberInitials: 'LF' },
  { id: 'a7', clientName: 'Felipe Andrade', clientPhone: '11993336666', service: 'Barba Completa + Hidratação', price: 70, startTime: '14:00', endTime: '14:50', status: 'PENDING', chairId: 'c2', barberName: 'Lucas Fade', barberInitials: 'LF' },
  { id: 'a8', clientName: 'Diego Martins', clientPhone: '11992227777', service: 'Corte + Barba Navalhada', price: 90, startTime: '09:30', endTime: '10:30', status: 'DONE', paymentTag: 'PIX PAGO', chairId: 'c3', barberName: 'Rafael Tesoura', barberInitials: 'RT' },
  { id: 'a9', clientName: 'Caio Ribeiro', clientPhone: '11991118888', service: 'Degradê + Risquinho', price: 65, startTime: '15:00', endTime: '15:45', status: 'PENDING', chairId: 'c3', barberName: 'Rafael Tesoura', barberInitials: 'RT' },
  { id: 'a10', clientName: 'André Lima', clientPhone: '11990009999', service: 'Corte Navalhado Completo', price: 80, startTime: '10:30', endTime: '11:20', status: 'IN_PROGRESS', chairId: 'c4', barberName: 'Mateus Navalha', barberInitials: 'MN' },
  { id: 'a11', clientName: 'Thiago Souza', clientPhone: '11989889900', service: 'Fade + Barba', price: 85, startTime: '12:00', endTime: '12:50', status: 'PENDING', chairId: 'c4', barberName: 'Mateus Navalha', barberInitials: 'MN' },
  { id: 'a12', clientName: 'Paulo Ferreira', clientPhone: '11978779911', service: 'Social Clássico', price: 50, startTime: '15:30', endTime: '16:00', status: 'PENDING', chairId: 'c4', barberName: 'Mateus Navalha', barberInitials: 'MN' },
]

export const mockFinancial = {
  grossRevenue: 960,
  chairCommission: 288,
  operationalExpenses: 80,
  netProfit: 592,
  commissionRate: 30,
  goalAmount: 1800,
  ticketAverage: 960,
  expenseDescription: 'Lâminas, pomadas e insumos',
  purchasesToday: 2,
}

export const mockStats = {
  totalAppointments: 12,
  occupancyRate: 58,
  done: 1,
  inProgress: 2,
  remaining: 9,
}

// ── Configuração de Horários ────────────────────────────────────

export type SlotMinutes = 30 | 40 | 45 | 60

export interface ScheduleConfig {
  /** Dias da semana em que atende: 0=Dom, 1=Seg … 6=Sáb */
  workDays: number[]
  /** Horário de início do expediente, ex: "09:00" */
  startTime: string
  /** Horário de término do expediente, ex: "20:00" */
  endTime: string
  /** Se o intervalo de almoço/pausa está ativado */
  breakEnabled: boolean
  /** Início da pausa, ex: "12:30" */
  breakStart: string
  /** Retorno da pausa, ex: "13:30" */
  breakEnd: string
  /** Duração padrão do slot de cada cliente em minutos */
  slotMinutes: SlotMinutes
}

export const defaultSchedule: ScheduleConfig = {
  workDays:     [1, 2, 3, 4, 5, 6], // Seg → Sáb
  startTime:    '09:00',
  endTime:      '20:00',
  breakEnabled: true,
  breakStart:   '12:30',
  breakEnd:     '13:30',
  slotMinutes:  45,
}
