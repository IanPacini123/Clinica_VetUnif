import '@fastify/jwt'
import type { UsuarioSessao } from '@clinica/shared'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: UsuarioSessao
        user: UsuarioSessao
    }
}
