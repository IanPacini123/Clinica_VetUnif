import type { FastifyInstance } from "fastify"
import { loginSchema, type RespostaLogin, type UsuarioSessao } from '@clinica/shared'
import { prisma } from '../db.js'
import { conferirSenha } from "../auth/senha.js"
import { ErroHttp } from "../models/erros.js"

export async function rotasAuth(app: FastifyInstance) {
    app.post('/api/login', async (request): Promise<RespostaLogin> => {
        const dados = loginSchema.safeParse(request.body)
        if (!dados.success) {
            throw new ErroHttp(400, 'Informe usuário e senha.')
        }

        const { nomeUsuario, senha } = dados.data
        const usuario = await prisma.usuario.findUnique({ where: { nomeUsuario } })

        if (!usuario || !(await conferirSenha(senha, usuario.senhaHash))) {
            throw new ErroHttp(401, 'Usuário ou senha inválidos.')
        }
        if (!usuario.ativo) {
            throw new ErroHttp(403, 'Usuário foi inativado. Procure o administrador.')
        }

        const sessao: UsuarioSessao = {
            id: usuario.id,
            nome: usuario.nome,
            nomeUsuario: usuario.nomeUsuario,
            perfil: usuario.perfil,
        }
        return { token: app.jwt.sign(sessao), usuario: sessao }
    })

    app.get(`/api/sessao`, async (request): Promise<UsuarioSessao> => {
        const { id, nome, nomeUsuario, perfil } = request.user
        return {id, nome, nomeUsuario, perfil }
    })
}

