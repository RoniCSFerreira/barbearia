import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  // 1. Criar Organização (Barbearia)
  const org = await prisma.organization.upsert({
    where: { slug: 'navalha-negra' },
    update: {
      name: 'Navalha negra',
    },
    create: {
      id: 'org-1',
      name: 'Navalha negra',
      slug: 'navalha-negra',
      commission_rate: 0,
    },
  })
  console.log(`✓ Organização criada/atualizada: ${org.name}`)

  // 2. Criar Barbeiro Proprietário
  const user = await prisma.user.upsert({
    where: { email: 'carlos@navalha.com' },
    update: {
      name: 'Roni Cleiton Souza Ferreira',
      phone: '11976543210',
      password_hash: hashedPassword,
      role: 'OWNER',
      status: 'ACTIVE',
      organization_id: org.id,
    },
    create: {
      id: 'user-1',
      organization_id: org.id,
      name: 'Roni Cleiton Souza Ferreira',
      email: 'carlos@navalha.com',
      password_hash: hashedPassword,
      phone: '11976543210',
      role: 'OWNER',
      status: 'ACTIVE',
      commission_rate: 0,
    },
  })
  console.log(`✓ Barbeiro criado/atualizado: ${user.name}`)

  // 2.1 Criar Usuário Administrador (Super Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: 'rcsfempresa@gmail.com' },
    update: {
      name: 'Administrador',
      phone: '11999999999',
      password_hash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      organization_id: org.id,
    },
    create: {
      id: 'admin-1',
      organization_id: org.id,
      name: 'Administrador',
      email: 'rcsfempresa@gmail.com',
      password_hash: hashedPassword,
      phone: '11999999999',
      role: 'ADMIN',
      status: 'ACTIVE',
      commission_rate: 0,
    },
  })
  console.log(`✓ Administrador criado/atualizado: ${adminUser.email}`)

  // 3. Criar Serviços
  const services = [
    {
      id: 's1',
      name: 'Barboterapia com Toalha Quente',
      description: 'Tratamento com óleos essenciais, toalha aromatizada e hidratação profunda para a barba.',
      price: 50.0,
      duration_minutes: 45,
    },
    {
      id: 's2',
      name: 'Corte Clássico Tesoura',
      description: 'Modelagem tradicional feita 100% na tesoura, lavagem e finalização com pomada.',
      price: 60.0,
      duration_minutes: 35,
    },
    {
      id: 's3',
      name: 'Degradê Navalhado + Barboterapia',
      description: 'Corte com navalha, acabamento milimétrico, toalha quente e tratamento de barba incluso.',
      price: 95.0,
      duration_minutes: 50,
    },
    {
      id: 's4',
      name: 'Fade Americano + Sobrancelha',
      description: 'Fade contemporâneo na máquina e navalha com desenho de sobrancelha e acabamento.',
      price: 75.0,
      duration_minutes: 40,
    },
    {
      id: 's5',
      name: 'Corte Militar + Barba',
      description: 'Corte estilo militar com máquina, barba completa com navalha e produtos premium.',
      price: 85.0,
      duration_minutes: 45,
    },
    {
      id: 's6',
      name: 'Camuflagem de Cabelo Branco',
      description: 'Coloração natural e discreta para fios brancos, resultado duradouro e aspecto jovem.',
      price: 110.0,
      duration_minutes: 60,
    },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {
        name: svc.name,
        price: svc.price,
        duration_minutes: svc.duration_minutes,
      },
      create: {
        id: svc.id,
        organization_id: org.id,
        name: svc.name,
        price: svc.price,
        duration_minutes: svc.duration_minutes,
      },
    })
  }
  console.log(`✓ ${services.length} serviços cadastrados com sucesso.`)

  // 4. Criar agendamentos para o dia de hoje
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  const seedAppointments = [
    {
      id: 'appt-1',
      client_name: 'Bruno Silveira',
      client_phone: '11998881111',
      service_id: 's3',
      start_time: new Date(y, m, d, 9, 30),
      end_time: new Date(y, m, d, 10, 20),
      status: 'DONE' as const,
    },
    {
      id: 'appt-2',
      client_name: 'Guilherme Prado',
      client_phone: '11976543210',
      service_id: 's2',
      start_time: new Date(y, m, d, 11, 0),
      end_time: new Date(y, m, d, 11, 35),
      status: 'CONFIRMED' as const,
    },
    {
      id: 'appt-3',
      client_name: 'Lucas Antunes',
      client_phone: '11997772222',
      service_id: 's5',
      start_time: new Date(y, m, d, 14, 0),
      end_time: new Date(y, m, d, 14, 45),
      status: 'CONFIRMED' as const,
    },
    {
      id: 'appt-4',
      client_name: 'Alexandre Costa',
      client_phone: '11996663333',
      service_id: 's4',
      start_time: new Date(y, m, d, 15, 30),
      end_time: new Date(y, m, d, 16, 10),
      status: 'CONFIRMED' as const,
    },
    {
      id: 'appt-5',
      client_name: 'Rodrigo Mendonça',
      client_phone: '11994445555',
      service_id: 's1',
      start_time: new Date(y, m, d, 17, 0),
      end_time: new Date(y, m, d, 17, 45),
      status: 'CONFIRMED' as const,
    },
  ]

  for (const appt of seedAppointments) {
    await prisma.appointment.upsert({
      where: { id: appt.id },
      update: {
        start_time: appt.start_time,
        end_time: appt.end_time,
        status: appt.status,
      },
      create: {
        id: appt.id,
        organization_id: org.id,
        user_id: user.id,
        client_name: appt.client_name,
        client_phone: appt.client_phone,
        service_id: appt.service_id,
        start_time: appt.start_time,
        end_time: appt.end_time,
        status: appt.status,
      },
    })
  }
  console.log(`✓ ${seedAppointments.length} agendamentos de hoje cadastrados.`)

  // 5. Transações iniciais (Receita do corte concluído + Gasto em insumos)
  await prisma.transaction.upsert({
    where: { id: 'tx-seed-1' },
    update: {},
    create: {
      id: 'tx-seed-1',
      organization_id: org.id,
      user_id: user.id,
      appointment_id: 'appt-1',
      type: 'INCOME',
      category: 'SERVICE',
      amount: 95.0,
      description: 'Atendimento: Degradê Navalhado + Barboterapia (Bruno Silveira)',
      created_at: new Date(y, m, d, 10, 20),
    },
  })

  await prisma.transaction.upsert({
    where: { id: 'tx-seed-2' },
    update: {},
    create: {
      id: 'tx-seed-2',
      organization_id: org.id,
      user_id: user.id,
      type: 'EXPENSE',
      category: 'SUPPLIES',
      amount: 45.0,
      description: 'Lâminas descartáveis e pomada matte',
      created_at: new Date(y, m, d, 8, 30),
    },
  })
  console.log('✓ Transações financeiras iniciais criadas.')

  console.log('Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
