'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return '欢迎使用星河曲谱！'
  })
}
