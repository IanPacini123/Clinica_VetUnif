import type { FastifyInstance } from 'fastify'
import { buscaSchema, camposDoErro, idSchema, POR_PAGINA, type ListaTutores, type Tutor } from '@clinica/shared'
import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'

export async function rotasTutores(app: FastifyInstance) {
    app.get('/api/tutores', async (request): Promise<ListaTutores> => {
        const consulta = buscaSchema.safeParse(request.query)
        if (!consulta.success) {
            throw new ErroHttp(400, 'Parâmetros de busca inválidos.', camposDoErro(consulta.error))
        }
        const { busca, pagina } = consulta.data

        const where: Prisma.TutorWhereInput = { ativo: true }
        if (busca) {
            const digitos = busca.replace(/\D/g, '')
            where.OR = [
                { nome: { contains: busca, mode: 'insensitive' } },
                ...(digitos ? [{ cpf: { contains: digitos } }] : []),
            ]
        }

        const [itens, total] = await prisma.$transaction([
            prisma.tutor.findMany({
                where,
                orderBy: [{ nome: 'asc' }, { id: 'asc' }],
                skip: (pagina - 1) * POR_PAGINA,
                take: POR_PAGINA,
            }),
            prisma.tutor.count({ where }),
        ])
        return { itens, total, pagina, porPagina: POR_PAGINA }
    })

    app.get('/api/tutores/:id', async (request): Promise<Tutor> => {
        const params = idSchema.safeParse(request.params)
        if (!params.success) throw new ErroHttp(400, 'Id inválido.')

        const tutor = await prisma.tutor.findFirst({ where: { id: params.data.id, ativo: true } })
        if (!tutor) throw new ErroHttp(404, 'Tutor não encontrado.')
        return tutor
    })
}
