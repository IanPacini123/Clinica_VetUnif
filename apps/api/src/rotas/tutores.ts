import type { FastifyInstance } from 'fastify'
import {
    buscaSchema,
    camposDoErro,
    idSchema,
    tutorEntradaSchema,
    POR_PAGINA,
    type ListaTutores,
    type Tutor,
    type TutorEntrada,
} from '@clinica/shared'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'
import { exigirPerfil } from '../auth/guards.js'

const CPF_REPETIDO = 'Já existe um tutor cadastrado com este CPF.'
const NAO_ENCONTRADO = 'Tutor não encontrado.'

type DadosTutor = Omit<TutorEntrada, 'email'> & { email: string | null }

function lerId(params: unknown): number {
    const r = idSchema.safeParse(params)
    if (!r.success) throw new ErroHttp(400, 'Id inválido.')
    return r.data.id
}

function lerTutor(body: unknown): DadosTutor {
    const r = tutorEntradaSchema.safeParse(body)
    if (!r.success) {
        throw new ErroHttp(400, 'Verifique os campos destacados.', camposDoErro(r.error))
    }
    return { ...r.data, email: r.data.email ?? null }
}

function traduzirErroDoBanco(erro: unknown): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
        if (erro.code === 'P2002') {
            throw new ErroHttp(409, CPF_REPETIDO, { cpf: CPF_REPETIDO })
        }
        if (erro.code === 'P2025') {
            throw new ErroHttp(404, NAO_ENCONTRADO)
        }
    }
    throw erro
}

export async function rotasTutores(app: FastifyInstance) {
    const podeCriarEInativar = { preHandler: exigirPerfil('ADMIN', 'ATENDENTE') }

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
        const id = lerId(request.params)
        const tutor = await prisma.tutor.findFirst({ where: { id, ativo: true } })
        if (!tutor) throw new ErroHttp(404, NAO_ENCONTRADO)
        return tutor
    })

    app.post('/api/tutores', podeCriarEInativar, async (request, reply): Promise<Tutor> => {
        const dados = lerTutor(request.body)
        try {
            const tutor = await prisma.tutor.create({ data: dados })
            reply.code(201)
            return tutor
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })

    app.put('/api/tutores/:id', async (request): Promise<Tutor> => {
        const id = lerId(request.params)
        const dados = lerTutor(request.body)
        try {
            return await prisma.tutor.update({
                where: { id, ativo: true },
                data: dados,
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })

    app.delete('/api/tutores/:id', podeCriarEInativar, async (request, reply) => {
        const id = lerId(request.params)
        const animaisAtivos = await prisma.animal.count({ where: { tutorId: id, ativo: true } })
        if (animaisAtivos > 0) {
            throw new ErroHttp(409, 'Este tutor tem animais ativos. Inative os animais primeiro.')
        }
        try {
            await prisma.tutor.update({
                where: { id, ativo: true },
                data: { ativo: false },
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
        return reply.code(204).send()
    })
}
