import Fastify from 'fastify'
import { prisma } from './db.js'
import { ErroHttp } from './models/erros.js';

const ENV_PORT = process.env.PORT

const fastify = Fastify({
    logger: true
})

fastify.get('/api/health', async (request, reply) => {
    
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

    if ( error instanceof Error && 'statusCode' in error && typeof error.statusCode == 'number' && error.statusCode < 500 ) {
        return reply.code(error.statusCode).send({ mensagem: 'requisição inválida' })
    }

    return reply.code(500).send({ mensagem: "Algum erro ocorreu, contatar suporte." })            
})

fastify.setNotFoundHandler((request, reply) => {
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

start()
