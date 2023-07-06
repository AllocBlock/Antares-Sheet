'use strict'
const { sql } = require('mysqls')
const { genReply, onFastifyMysql } = require('../utils/common')
const { get_user_info_by_token } = require('../utils/database')

const TOKEN_LENGTH = 16
const CHARACTERS = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' // no 1-l, 0-o-O which cause confused
function generateRandomCode(len) {
  let result = '';
  let charMaxLength = CHARACTERS.length;
  for (let i = 0; i < len; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * charMaxLength));
  }
  return result;
}

async function does_user_exist(connection, userName) {
  const [rows, _] = await connection.query(
    sql.table('user').field("id").where({
      name: userName,
    }).select(), [])
  console.log(rows)
  if (rows.length > 0)
    return true
  else
    return false
}

// is user name and password correct
// return user id if success
// return null if bad password or user not exist
async function get_user_id(connection, userName, password) {
  const [rows, _] = await connection.query(
    sql.table('user').field("id").where({
      name: userName,
      password: password
    }).select(), [])
  if (rows.length > 0)
    return rows[0]
  else
    return null
}

module.exports = async function (fastify, opts) {
  fastify.get(
    '/user/login_or_register', 
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' }
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      let userName = request.query.username
      let password = request.query.password
      let token = generateRandomCode(TOKEN_LENGTH)

      if (await does_user_exist(conn, userName)) {
        let uid = await get_user_id(conn, userName, password)
        if (uid) {
          await conn.query(sql.table("user").data({token}).where({id: uid}).update())
          return genReply(true, { token }, "登录成功~")
        } else {
          return genReply(false, {}, "登录/注册失败~密码错误，或已有用户注册了该名称")
        }
      } else {
        let result = await conn.query(sql.table("user").data({
          name: userName,
          password: password,
          token: token
        }).insert())
        console.log(result)
        return genReply(true, { token }, "注册成功~")
      }
    })
  )

  fastify.get(
    '/user/validate', 
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      let token = request.query.token
      let result = await get_user_info_by_token(conn, token)
      if (result)
        return genReply(true, { uid: result.id, name: result.name }, "已登录")
      else
        return genReply(false, {}, "未登录")
    })
  )
}
