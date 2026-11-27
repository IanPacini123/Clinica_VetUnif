import type { FastifyInstance } from 'fastify'
import {
    animalEntradaSchema,
    buscaSchema,
    camposDoErro,
    idSchema,
    POR_PAGINA,
    type Animal,
    type AnimalEntrada,
    type ListaAnimais,
} from '@clinica/shared'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'
import { exigirPerfil, podeVerInativos, SEM_PERMISSAO } from '../auth/guards.js'

const NAO_ENCONTRADO = 'Animal não encontrado.'
const TUTOR_INVALIDO = 'O tutor selecionado não existe ou está inativo.'
const TUTOR_DO_ANIMAL_INATIVO = 'O tutor deste animal está inativo. Reative o tutor primeiro.'

type DadosAnimal = Omit<AnimalEntrada, 'raca' | 'dataNascimento'> & {
    raca: string | null
    dataNascimento: Date | null
}

// O tutor vem junto em toda resposta: a lista e o detalhe mostram o nome dele.
const comTutor = { tutor: true } satisfies Prisma.AnimalInclude
type AnimalDoBanco = Prisma.AnimalGetPayload<{ include: typeof comTutor }>

function lerId(params: unknown): number {
    const r = idSchema.safeParse(params)
    if (!r.success) throw new ErroHttp(400, 'Id inválido.')
    return r.data.id
}

function lerAnimal(body: unknown): DadosAnimal {
    const r = animalEntradaSchema.safeParse(body)
    if (!r.success) {
        throw new ErroHttp(400, 'Verifique os campos destacados.', camposDoErro(r.error))
    }
    const { dataNascimento, raca } = r.data
    return {
        ...r.data,
        raca: raca ?? null,
        // "2020-05-01" vira meia-noite UTC, e a coluna DATE guarda só o dia.
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
    }
}

// O @db.Date volta como Date; a API responde só "AAAA-MM-DD".
function paraResposta(animal: AnimalDoBanco): Animal {
    return {
        id: animal.id,
        nome: animal.nome,
        especie: animal.especie,
        raca: animal.raca,
        sexo: animal.sexo,
        dataNascimento: animal.dataNascimento?.toISOString().slice(0, 10) ?? null,
        ativo: animal.ativo,
        tutor: animal.tutor,
    }
}

async function exigirTutorAtivo(tutorId: number) {
    const tutor = await prisma.tutor.findFirst({ where: { id: tutorId, ativo: true } })
    if (!tutor) throw new ErroHttp(409, TUTOR_INVALIDO, { tutorId: TUTOR_INVALIDO })
}

function traduzirErroDoBanco(erro: unknown): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
        throw new ErroHttp(404, NAO_ENCONTRADO)
    }
    throw erro
}

export async function rotasAnimais(app: FastifyInstance) {
    const podeCriarEInativar = { preHandler: exigirPerfil('ADMIN', 'ATENDENTE') }

    app.get('/api/animais', async (request): Promise<ListaAnimais> => {
        const consulta = buscaSchema.safeParse(request.query)
        if (!consulta.success) {
            throw new ErroHttp(400, 'Parâmetros de busca inválidos.', camposDoErro(consulta.error))
        }
        const { busca, pagina, inativos } = consulta.data
        if (inativos && !podeVerInativos(request)) throw new ErroHttp(403, SEM_PERMISSAO)

        const where: Prisma.AnimalWhereInput = inativos ? {} : { ativo: true }
        if (busca) {
            where.OR = [
                { nome: { contains: busca, mode: 'insensitive' } },
                { tutor: { nome: { contains: busca, mode: 'insensitive' } } },
            ]
        }

        const [itens, total] = await prisma.$transaction([
            prisma.animal.findMany({
                where,
                include: comTutor,
                orderBy: [{ nome: 'asc' }, { id: 'asc' }],
                skip: (pagina - 1) * POR_PAGINA,
                take: POR_PAGINA,
            }),
            prisma.animal.count({ where }),
        ])
        return { itens: itens.map(paraResposta), total, pagina, porPagina: POR_PAGINA }
    })

    app.get('/api/animais/:id', async (request): Promise<Animal> => {
        const id = lerId(request.params)
        const animal = await prisma.animal.findFirst({
            where: podeVerInativos(request) ? { id } : { id, ativo: true },
            include: comTutor,
        })
        if (!animal) throw new ErroHttp(404, NAO_ENCONTRADO)
        return paraResposta(animal)
    })

    // Animais de um tutor, para o detalhe do tutor (sem paginação).
    // O ADMIN vê também os inativos, depois dos ativos.
    app.get('/api/tutores/:id/animais', async (request): Promise<Animal[]> => {
        const id = lerId(request.params)
        const admin = podeVerInativos(request)
        const tutor = await prisma.tutor.findFirst({
            where: admin ? { id } : { id, ativo: true },
        })
        if (!tutor) throw new ErroHttp(404, 'Tutor não encontrado.')

        const animais = await prisma.animal.findMany({
            where: admin ? { tutorId: id } : { tutorId: id, ativo: true },
            include: comTutor,
            orderBy: [{ ativo: 'desc' }, { nome: 'asc' }, { id: 'asc' }],
        })
        return animais.map(paraResposta)
    })

    app.post('/api/animais', podeCriarEInativar, async (request, reply): Promise<Animal> => {
        const dados = lerAnimal(request.body)
        await exigirTutorAtivo(dados.tutorId)

        const animal = await prisma.animal.create({ data: dados, include: comTutor })
        reply.code(201)
        return paraResposta(animal)
    })

    app.put('/api/animais/:id', async (request): Promise<Animal> => {
        const id = lerId(request.params)
        const dados = lerAnimal(request.body)
        await exigirTutorAtivo(dados.tutorId)
        try {
            const animal = await prisma.animal.update({
                where: { id, ativo: true },
                data: dados,
                include: comTutor,
            })
            return paraResposta(animal)
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })

    app.delete('/api/animais/:id', podeCriarEInativar, async (request, reply) => {
        const id = lerId(request.params)
        try {
            await prisma.animal.update({
                where: { id, ativo: true },
                data: { ativo: false },
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
        return reply.code(204).send()
    })

    // Um animal ativo precisa de um tutor ativo (o mesmo vale no POST e no PUT).
    const soAdmin = { preHandler: exigirPerfil('ADMIN') }
    app.post('/api/animais/:id/reativar', soAdmin, async (request): Promise<Animal> => {
        const id = lerId(request.params)
        const atual = await prisma.animal.findUnique({ where: { id }, include: comTutor })
        if (!atual) throw new ErroHttp(404, NAO_ENCONTRADO)
        if (!atual.tutor.ativo) throw new ErroHttp(409, TUTOR_DO_ANIMAL_INATIVO)

        const animal = await prisma.animal.update({
            where: { id },
            data: { ativo: true },
            include: comTutor,
        })
        return paraResposta(animal)
    })
}
