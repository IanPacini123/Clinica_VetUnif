import type { FastifyInstance } from 'fastify'
import {
    camposDoErro,
    chegadaSchema,
    dadosClinicosSchema,
    finalizacaoSchema,
    idSchema,
    prioridadeQueixaSchema,
    STATUS_EM_ABERTO,
    type Atendimento,
    type DadosClinicos,
} from '@clinica/shared'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'
import { exigirPerfil, podeVerInativos } from '../auth/guards.js'
import { comTutor, paraResposta as animalParaResposta } from './animais.js'

const NAO_ENCONTRADO = 'Atendimento não encontrado.'
const ANIMAL_INVALIDO = 'O animal selecionado não existe ou está inativo.'
const JA_NA_FILA = 'Este animal já tem um atendimento em aberto.'
const SO_AGUARDANDO = 'Só é possível alterar um atendimento que está aguardando.'
const JA_ENCERRADO = 'Este atendimento já foi encerrado.'
const VETERINARIO_OCUPADO =
    'Finalize ou devolva o atendimento atual antes de iniciar outro.'
const JA_FINALIZADO = 'Atendimento finalizado não pode mais ser alterado.'
const NAO_EM_ANDAMENTO = 'Este atendimento não está em andamento.'
const SO_RESPONSAVEL =
    'Só o veterinário responsável pode alterar este atendimento.'

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
        // O Prisma devolve o Decimal como objeto; o JSON leva número.
        peso: atendimento.peso?.toNumber() ?? null,
        anamnese: atendimento.anamnese,
        diagnostico: atendimento.diagnostico,
        conduta: atendimento.conduta,
    }
}

function codigoDoPrisma(erro: unknown): string | null {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) return erro.code
    return null
}

// Campo ausente vira null: Salvar e Finalizar gravam o formulário inteiro.
function lerDadosClinicos(d: DadosClinicos) {
    return {
        peso: d.peso ?? null,
        anamnese: d.anamnese ?? null,
        diagnostico: d.diagnostico ?? null,
        conduta: d.conduta ?? null,
    }
}

// Para iniciar: 404 se não existe; 409 se outro VETERINARIO já pegou
// o Paciente ou se o Atendimento foi encerrado.
async function exigirNaFila(id: number) {
    const atual = await prisma.atendimento.findUnique({
        where: { id },
        include: { veterinario: { select: { nome: true } } },
    })
    if (!atual) throw new ErroHttp(404, NAO_ENCONTRADO)
    if (atual.status === 'EM_ATENDIMENTO' && atual.veterinario) {
        const nome = atual.veterinario.nome
        throw new ErroHttp(409, `Paciente já está em atendimento com Dr(a). ${nome}.`)
    }
    if (atual.status !== 'AGUARDANDO') throw new ErroHttp(409, JA_ENCERRADO)
}

// Para salvar, finalizar e devolver: só o VETERINARIO responsável,
// e só enquanto está EM_ATENDIMENTO.
async function exigirResponsavel(id: number, veterinarioId: number) {
    const atual = await prisma.atendimento.findUnique({ where: { id } })
    if (!atual) throw new ErroHttp(404, NAO_ENCONTRADO)
    if (atual.status === 'FINALIZADO') throw new ErroHttp(409, JA_FINALIZADO)
    if (atual.status !== 'EM_ATENDIMENTO') {
        throw new ErroHttp(409, NAO_EM_ANDAMENTO)
    }
    if (atual.veterinarioId !== veterinarioId) {
        throw new ErroHttp(403, SO_RESPONSAVEL)
    }
}

// O where repete as condições do exigirResponsavel: se o Atendimento mudou
// entre a leitura e a gravação (outra aba finalizou), o P2025 vira 409.
async function gravarComoResponsavel(
    id: number,
    veterinarioId: number,
    data: Prisma.AtendimentoUncheckedUpdateInput,
): Promise<Atendimento> {
    try {
        const atendimento = await prisma.atendimento.update({
            where: { id, status: 'EM_ATENDIMENTO', veterinarioId },
            data,
            include: comAnimalEVeterinario,
        })
        return paraResposta(atendimento)
    } catch (erro) {
        if (codigoDoPrisma(erro) === 'P2025') {
            throw new ErroHttp(409, NAO_EM_ANDAMENTO)
        }
        throw erro
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

    // Histórico: todos os Atendimentos do Animal, do mais recente ao mais
    // antigo, inclusive os cancelados. Animal inativo, só para o ADMIN.
    app.get('/api/animais/:id/atendimentos', async (request): Promise<Atendimento[]> => {
        const id = lerId(request.params)
        const animal = await prisma.animal.findFirst({
            where: podeVerInativos(request) ? { id } : { id, ativo: true },
        })
        if (!animal) throw new ErroHttp(404, 'Animal não encontrado.')

        const atendimentos = await prisma.atendimento.findMany({
            where: { animalId: id },
            include: comAnimalEVeterinario,
            orderBy: [{ dataChegada: 'desc' }, { id: 'desc' }],
        })
        return atendimentos.map(paraResposta)
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

    const veterinario = { preHandler: exigirPerfil('VETERINARIO') }

    // Pegar o Paciente: EM_ATENDIMENTO com quem pegou como responsável.
    app.post('/api/atendimentos/:id/iniciar', veterinario, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        await exigirNaFila(id)
        try {
            const atendimento = await prisma.atendimento.update({
                where: { id, status: 'AGUARDANDO' },
                data: {
                    status: 'EM_ATENDIMENTO',
                    veterinarioId: request.user.id,
                    dataInicio: new Date(),
                },
                include: comAnimalEVeterinario,
            })
            return paraResposta(atendimento)
        } catch (erro) {
            // P2002: o índice parcial (1 EM_ATENDIMENTO por VETERINARIO).
            if (codigoDoPrisma(erro) === 'P2002') {
                throw new ErroHttp(409, VETERINARIO_OCUPADO)
            }
            // P2025: outro VETERINARIO pegou entre a leitura e a gravação;
            // a nova leitura lança o 409 com o nome dele.
            if (codigoDoPrisma(erro) === 'P2025') {
                await exigirNaFila(id)
                throw new ErroHttp(409, SO_AGUARDANDO)
            }
            throw erro
        }
    })

    // Salvar sem finalizar: o VETERINARIO pode sair e continuar depois.
    app.put('/api/atendimentos/:id/dados-clinicos', veterinario, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        const r = dadosClinicosSchema.safeParse(request.body)
        if (!r.success) throw camposInvalidos(r.error)

        await exigirResponsavel(id, request.user.id)
        return gravarComoResponsavel(id, request.user.id, lerDadosClinicos(r.data))
    })

    // Finalizar grava o formulário e conclui; FINALIZADO não muda mais.
    app.post('/api/atendimentos/:id/finalizar', veterinario, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        const r = finalizacaoSchema.safeParse(request.body)
        if (!r.success) throw camposInvalidos(r.error)

        await exigirResponsavel(id, request.user.id)
        return gravarComoResponsavel(id, request.user.id, {
            ...lerDadosClinicos(r.data),
            status: 'FINALIZADO',
            dataFim: new Date(),
        })
    })

    // Devolver à Fila: só tira o responsável; os dados clínicos ficam.
    app.post('/api/atendimentos/:id/devolver', veterinario, async (request): Promise<Atendimento> => {
        const id = lerId(request.params)
        await exigirResponsavel(id, request.user.id)
        return gravarComoResponsavel(id, request.user.id, {
            status: 'AGUARDANDO',
            veterinarioId: null,
            dataInicio: null,
        })
    })
}
