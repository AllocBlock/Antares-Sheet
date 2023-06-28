function genReply(success, data = {}, msg = "") {
    return {
        success: success,
        message: msg,
        data: data
    }
}

function onFastifyMysql(fastify, func) {
    return async function (request, reply) {
        const connection = await fastify.mysql.getConnection()
        let result = await func(connection, request)
        console.log(result)
        if (!result) {
            result = genReply(true)
        }
        connection.release()
        return result
    }
}

module.exports = {
    genReply,
    onFastifyMysql
}