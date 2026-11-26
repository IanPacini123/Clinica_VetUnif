import Fastify from 'fastify'

const ENV_PORT = process.env.PORT

const fastify = Fastify({
    logger: true
})

fastify.get('/api/health', async (request, reply) => {
    return { status: 'running' }
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
