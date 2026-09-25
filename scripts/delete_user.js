const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.user.delete({
      where: { email: 'carlos@navalha.com' }
    })
    console.log('Usuário apagado com sucesso!')
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('O usuário já não existe no banco.')
    } else {
      console.error(error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
