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

export function exigirPerfil(...perfis: Perfil[]) {
    return async (request: FastifyRequest) => {
        if ( !perfis.includes(request.user.perfil )) {
            throw new ErroHttp(403, 'Você não tem a permissão para esta ação.')
        }
    }
}
