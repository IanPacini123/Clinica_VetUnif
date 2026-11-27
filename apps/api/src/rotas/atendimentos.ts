import type { FastifyInstance } from 'fastify'
import {
    camposDoErro,
    chegadaSchema,
    idSchema,
    prioridadeQueixaSchema,
    STATUS_EM_ABERTO,
    type Atendimento,
} from '@clinica/shared'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'
import { exigirPerfil } from '../auth/guards.js'
import { comTutor, paraResposta as animalParaResposta } from './animais.js'

const NAO_ENCONTRADO = 'Atendimento não encontrado.'
const ANIMAL_INVALIDO = 'O animal selecionado não existe ou está inativo.'
const JA_NA_FILA = 'Este animal já tem um atendimento em aberto.'
const SO_AGUARDANDO = 'Só é possível alterar um atendimento que está aguardando.'

// O veterinário vem só com id e nome: o senhaHash nunca sai daqui.
const comAnimalEVeterinario = {
    animal: { include: comTutor },
    veterinario: { select: { id: true, nome: true } },
} satisfies Prisma.AtendimentoInclude
type AtendimentoDoBanco = Prisma.AtendimentoGetPayload<{
    include: typeof comAnimalEVeterinario
}>

function lerId(params: unknown): number {
    const r = idSchema.safeParse(params)
    if (!r.success) throw new ErroHttp(400, 'Id inválido.')
    return r.data.id
}

function camposInvalidos(erro: Parameters<typeof camposDoErro>[0]): ErroHttp {
    return new ErroHttp(400, 'Verifique os campos destacados.', camposDoErro(erro))
}

// As datas saem em ISO (UTC); a tela mostra no horário local.
function paraResposta(atendimento: AtendimentoDoBanco): Atendimento {
    return {
        id: atendimento.id,
        status: atendimento.status,
        prioridade: atendimento.prioridade,
        queixa: atendimento.queixa,
        dataChegada: atendimento.dataChegada.toISOString(),
        dataInicio: atendimento.dataInicio?.toISOString() ?? null,
        dataFim: atendimento.dataFim?.toISOString() ?? null,
        animal: animalParaResposta(atendimento.animal),
        veterinario: atendimento.veterinario,
    }
}

// Só o índice parcial (1 em aberto por Animal) gera P2002 nesta tabela.
function jaNaFila(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002'
}

// Lê o Atendimento e exige AGUARDANDO: 404 se não existe, 409 se já mudou.
async function exigirAguardando(id: number) {
    const atual = await prisma.atendimento.findUnique({ where: { id } })
    if (!atual) throw new ErroHttp(404, NAO_ENCONTRADO)
    if (atual.status !== 'AGUARDANDO') throw new ErroHttp(409, SO_AGUARDANDO)
}

// O update usa status AGUARDANDO no where: se mudou entre a leitura e a
// gravação (um VETERINARIO pegou o paciente), o Prisma dá P2025 e vira 409.
function traduzirErroDoBanco(erro: unknown): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
        throw new ErroHttp(409, SO_AGUARDANDO)
    }
    throw erro
}

export async function rotasAtendimentos(app: FastifyInstance) {
    const recepcao = { preHandler: exigirPerfil('ADMIN', 'ATENDENTE') }

    // Fila: prioritários no topo; dentro de cada grupo, por ordem de Chegada.
    app.get('/api/fila', async (): Promise<Atendimento[]> => {
        const fila = await prisma.atendimento.findMany({
            where: { status: { in: STATUS_EM_ABERTO } },
            include: comAnimalEVeterinario,
            orderBy: [{ prioridade: 'desc' }, { dataChegada: 'asc' }, { id: 'asc' }],
        })
        return fila.map(paraResposta)
    })

    app.get('/api/atendimentos/:id', async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        const atendimento = await prisma.atendimento.findUnique({
            where: { id },
            include: comAnimalEVeterinario,
        })
        if (!atendimento) throw new ErroHttp(404, NAO_ENCONTRADO)
        return paraResposta(atendimento)
    })

    // Registrar Chegada: cria o Atendimento AGUARDANDO.
    app.post('/api/atendimentos', recepcao, async (request, reply): Promise<Atendimento> => {
        const r = chegadaSchema.safeParse(request.body)
        if (!r.success) throw camposInvalidos(r.error)
        const { animalId, prioridade, queixa } = r.data

        const animal = await prisma.animal.findFirst({ where: { id: animalId, ativo: true } })
        if (!animal) throw new ErroHttp(409, ANIMAL_INVALIDO, { animalId: ANIMAL_INVALIDO })

        try {
            const atendimento = await prisma.atendimento.create({
                data: { animalId, prioridade, queixa: queixa ?? null },
                include: comAnimalEVeterinario,
            })
            reply.code(201)
            return paraResposta(atendimento)
        } catch (erro) {
            if (jaNaFila(erro)) throw new ErroHttp(409, JA_NA_FILA, { animalId: JA_NA_FILA })
            throw erro
        }
    })

    // Prioridade e Queixa mudam só enquanto o Atendimento está AGUARDANDO.
    app.put('/api/atendimentos/:id', recepcao, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        const r = prioridadeQueixaSchema.safeParse(request.body)
        if (!r.success) throw camposInvalidos(r.error)
        const { prioridade, queixa } = r.data

        await exigirAguardando(id)
        try {
            const atendimento = await prisma.atendimento.update({
                where: { id, status: 'AGUARDANDO' },
                data: { prioridade, queixa: queixa ?? null },
                include: comAnimalEVeterinario,
            })
            return paraResposta(atendimento)
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })

    // Cancelar (desistência): o Atendimento nunca é excluído.
    app.post('/api/atendimentos/:id/cancelar', recepcao, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        await exigirAguardando(id)
        try {
            const atendimento = await prisma.atendimento.update({
                where: { id, status: 'AGUARDANDO' },
                data: { status: 'CANCELADO', dataFim: new Date() },
                include: comAnimalEVeterinario,
            })
            return paraResposta(atendimento)
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })
}
