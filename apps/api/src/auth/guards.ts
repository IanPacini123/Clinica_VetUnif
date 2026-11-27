import type { FastifyRequest } from "fastify";
import type { Perfil } from "@clinica/shared";
import { ErroHttp } from "../models/erros.js";

const ROTAS_PUBLICAS = new Set([`/api/login`, `/api/health`])

export async function autenticar(request: FastifyRequest) {
    if ( !request.url.startsWith(`/api/`) ) return
    if ( ROTAS_PUBLICAS.has(request.routeOptions.url ?? ``)) return

    try {
        await request.jwtVerify()
    } catch {
        throw new ErroHttp(401, `Sessão expirada ou inválida. Entre novamente.`)
    }
}

export const SEM_PERMISSAO = 'Você não tem a permissão para esta ação.'

export function exigirPerfil(...perfis: Perfil[]) {
    return async (request: FastifyRequest) => {
        if ( !perfis.includes(request.user.perfil )) {
            throw new ErroHttp(403, SEM_PERMISSAO)
        }
    }
}

// Só o ADMIN lista, abre e reativa registros inativos.
export function podeVerInativos(request: FastifyRequest): boolean {
    return request.user.perfil === 'ADMIN'
}
