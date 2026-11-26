import { prisma } from "./db.js"
import { gerarHash } from "./auth/senha.js"

const senhaAdmin = process.env.ADMIN_SENHA

if (!senhaAdmin || senhaAdmin.length < 8) {
    throw new Error('ADMIN_SENHA nao fornecido ou com menos de 8 caracteres.')
}

const admin = await prisma.usuario.upsert({
    where: { nomeUsuario: 'admin' },
    update: {},
    create: {
        nome: 'Administrador',
        nomeUsuario: 'admin',
        senhaHash: await gerarHash(senhaAdmin),
        perfil: 'ADMIN',
    },
})

console.log(`Seed ok: usuário "${admin.nomeUsuario}" (id ${admin.id}).`)
await prisma.$disconnect()


