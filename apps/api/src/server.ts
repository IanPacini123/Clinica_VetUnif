import Fastify from 'fastify';
import { prisma } from './db.js';
import { ErroHttp } from './models/erros.js';
import type { Saude } from '@clinica/shared';

import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import fastifyJwt from '@fastify/jwt';
import { rotasAuth } from './rotas/auth.js';
import './auth/tipos.js';

const ENV_PORT = process.env.PORT

const fastify = Fastify({
    logger: true
})

const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url))
const servirWeb = existsSync(WEB_DIST)

// ----

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não fornecido. Configure no ambiente.')
}

// -------------------------------------------------------------------------------

fastify.get('/api/health', async (request, reply): Promise<Saude> => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return { status: 'healthy' , dbConnection: 'healthy'}
    } catch (error) {
        request.log.error(error)
        throw new ErroHttp(503, "Falha na conexão com o banco de dados.");
    }
})

fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if ( error instanceof ErroHttp ) {
        return reply.code(error.statusCode).send({ mensagem: error.message })
    }

    if ( error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode < 500 ) {
        return reply.code(error.statusCode).send({ mensagem: 'requisição inválida' })
    }

    return reply.code(500).send({ mensagem: "Algum erro ocorreu, contatar suporte." })            
})

fastify.setNotFoundHandler((request, reply) => {
    if (servirWeb && request.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html')
    }
    return reply.code(404).send({ mensagem: 'Rota não encontrada.' })
})

const start = async () => {
  try {
    await fastify.listen({ port: Number(ENV_PORT ?? 3000), host: `0.0.0.0` })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// -------------------------------------------------------------------------------

await fastify.register(fastifyJwt, { secret: JWT_SECRET, sign: { expiresIn: '8h' } })
await fastify.register(rotasAuth)

if (servirWeb) {
    await fastify.register(fastifyStatic, { root: WEB_DIST })
}


start()
