import type { FastifyInstance } from 'fastify'
import {
    buscaSchema,
    camposDoErro,
    idSchema,
    novaSenhaSchema,
    POR_PAGINA,
    usuarioEdicaoSchema,
    usuarioEntradaSchema,
    type ListaUsuarios,
    type Perfil,
    type Usuario,
} from '@clinica/shared'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db.js'
import { ErroHttp } from '../models/erros.js'
import { exigirPerfil } from '../auth/guards.js'
import { gerarHash } from '../auth/senha.js'

const NAO_ENCONTRADO = 'Usuário não encontrado.'
const NOME_USUARIO_REPETIDO = 'Este nome de usuário já está em uso.'
const INVALIDO = 'Verifique os campos destacados.'

// O hash nunca sai da api: toda consulta que responde um Usuário usa este omit.
const semSenha = { senhaHash: true } satisfies Prisma.UsuarioOmit

type DadosUsuario = { nome: string; perfil: Perfil; crmv: string | null }

function lerId(params: unknown): number {
    const r = idSchema.safeParse(params)
    if (!r.success) throw new ErroHttp(400, 'Id inválido.')
    return r.data.id
}

// Só o VETERINARIO guarda CRMV; nos outros perfis o campo vira null.
function crmvDoPerfil(perfil: Perfil, crmv: string | null | undefined): string | null {
    return perfil === 'VETERINARIO' ? crmv ?? null : null
}

function lerEdicao(body: unknown): DadosUsuario {
    const r = usuarioEdicaoSchema.safeParse(body)
    if (!r.success) throw new ErroHttp(400, INVALIDO, camposDoErro(r.error))
    const { nome, perfil, crmv } = r.data
    return { nome, perfil, crmv: crmvDoPerfil(perfil, crmv) }
}

function nomeUsuarioRepetido(erro: unknown): boolean {
    return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002'
}

function traduzirErroDoBanco(erro: unknown): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
        throw new ErroHttp(404, NAO_ENCONTRADO)
    }
    throw erro
}

export async function rotasUsuarios(app: FastifyInstance) {
    // Hook do plugin: vale para todas as rotas abaixo, e só para elas.
    app.addHook('preHandler', exigirPerfil('ADMIN'))

    app.get('/api/usuarios', async (request): Promise<ListaUsuarios> => {
        const consulta = buscaSchema.safeParse(request.query)
        if (!consulta.success) {
            throw new ErroHttp(400, 'Parâmetros de busca inválidos.', camposDoErro(consulta.error))
        }
        const { busca, pagina, inativos } = consulta.data

        const where: Prisma.UsuarioWhereInput = inativos ? {} : { ativo: true }
        if (busca) {
            where.OR = [
                { nome: { contains: busca, mode: 'insensitive' } },
                { nomeUsuario: { contains: busca, mode: 'insensitive' } },
            ]
        }

        const [itens, total] = await prisma.$transaction([
            prisma.usuario.findMany({
                where,
                omit: semSenha,
                orderBy: [{ nome: 'asc' }, { id: 'asc' }],
                skip: (pagina - 1) * POR_PAGINA,
                take: POR_PAGINA,
            }),
            prisma.usuario.count({ where }),
        ])
        return { itens, total, pagina, porPagina: POR_PAGINA }
    })

    app.get('/api/usuarios/:id', async (request): Promise<Usuario> => {
        const id = lerId(request.params)
        const usuario = await prisma.usuario.findUnique({ where: { id }, omit: semSenha })
        if (!usuario) throw new ErroHttp(404, NAO_ENCONTRADO)
        return usuario
    })

    app.post('/api/usuarios', async (request, reply): Promise<Usuario> => {
        const r = usuarioEntradaSchema.safeParse(request.body)
        if (!r.success) throw new ErroHttp(400, INVALIDO, camposDoErro(r.error))
        const { nome, nomeUsuario, perfil, crmv, senha } = r.data
        try {
            const usuario = await prisma.usuario.create({
                data: {
                    nome,
                    nomeUsuario,
                    perfil,
                    crmv: crmvDoPerfil(perfil, crmv),
                    senhaHash: await gerarHash(senha),
                },
                omit: semSenha,
            })
            reply.code(201)
            return usuario
        } catch (erro) {
            if (nomeUsuarioRepetido(erro)) {
                throw new ErroHttp(409, NOME_USUARIO_REPETIDO, {
                    nomeUsuario: NOME_USUARIO_REPETIDO,
                })
            }
            traduzirErroDoBanco(erro)
        }
    })

    app.put('/api/usuarios/:id', async (request): Promise<Usuario> => {
        const id = lerId(request.params)
        const dados = lerEdicao(request.body)
        // Sem esta regra, o último ADMIN poderia tirar o próprio acesso.
        if (id === request.user.id && dados.perfil !== 'ADMIN') {
            const mensagem = 'Você não pode mudar o seu próprio perfil.'
            throw new ErroHttp(409, mensagem, { perfil: mensagem })
        }
        try {
            return await prisma.usuario.update({
                where: { id, ativo: true },
                data: dados,
                omit: semSenha,
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })

    app.put('/api/usuarios/:id/senha', async (request, reply) => {
        const id = lerId(request.params)
        const r = novaSenhaSchema.safeParse(request.body)
        if (!r.success) throw new ErroHttp(400, INVALIDO, camposDoErro(r.error))
        try {
            await prisma.usuario.update({
                where: { id, ativo: true },
                data: { senhaHash: await gerarHash(r.data.senha) },
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
        return reply.code(204).send()
    })

    app.delete('/api/usuarios/:id', async (request, reply) => {
        const id = lerId(request.params)
        if (id === request.user.id) {
            throw new ErroHttp(409, 'Você não pode inativar o seu próprio usuário.')
        }
        try {
            await prisma.usuario.update({
                where: { id, ativo: true },
                data: { ativo: false },
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
        return reply.code(204).send()
    })

    // Reativar um usuário já ativo não muda nada e responde 200.
    app.post('/api/usuarios/:id/reativar', async (request): Promise<Usuario> => {
        const id = lerId(request.params)
        try {
            return await prisma.usuario.update({
                where: { id },
                data: { ativo: true },
                omit: semSenha,
            })
        } catch (erro) {
            traduzirErroDoBanco(erro)
        }
    })
}
