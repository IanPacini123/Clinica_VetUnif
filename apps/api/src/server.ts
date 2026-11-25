import Fastify from 'fastify'

const ENV_PORT = process.env.PORT


const fastify = Fastify({
    logger: true
})

fastify.get('/api/health', function (request, reply) {
    reply.send({status: 'Running'})
})

fastify.listen({ port: Number(ENV_PORT ?? 3000), host: '0.0.0.0' }, function (error, address) {
    if (error) {
        fastify.log.error(error)
        process.exit(1)
    }
    fastify.log.info(`Server listening on ${address}`)
})
