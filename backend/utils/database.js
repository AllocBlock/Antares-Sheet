const { sql } = require('mysqls')

async function get_user_info_by_token(connection, token) {
    const [rows, _] = await connection.query(
        sql.table('user').field("id,name").where({
            token: token,
        }).select(), [])
    if (rows.length > 0)
        return rows[0]
    else
        return null
}

async function get_user_info_by_id(connection, id) {
    const [rows, _] = await connection.query(
        sql.table('user').field("id,name").where({
            id: id,
        }).select(), [])
    if (rows.length > 0)
        return rows[0]
    else
        return null
}

module.exports = {
    get_user_info_by_token,
    get_user_info_by_id
}