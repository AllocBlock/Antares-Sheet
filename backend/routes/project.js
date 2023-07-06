'use strict'
const { sql } = require('mysqls')
const { genReply, onFastifyMysql } = require('../utils/common')
const { get_user_info_by_token, get_user_info_by_id } = require('../utils/database')

async function get_project(connection, projectCode) {
  const [rows, _] = await connection.query(
    sql.table('project').field("*").where({
      code: projectCode,
    }).select(), [])
  if (rows.length > 0)
    return rows[0]
  else
    return null
}

module.exports = async function (fastify, opts) {
  fastify.post(
    '/project/create_or_update', 
    {
      schema: {
        body: {
          type: 'object',
          required: ['token', 'code'],
          properties: {
            token: { type: 'string' },
            code: { type: 'string' },
            title: { type: 'string' },
            singer: { type: 'string' },
            sheet: { type: 'string' },
            isPublic: { type: 'boolean' },
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      console.log(request.body)
      const token = request.body.token
      const code = request.body.code
      const title = request.body.title
      const singer = request.body.singer
      const sheet = request.body.sheet
      const isPublic = request.body.isPublic

      if (!code) return genReply(false, {}, "同步曲谱失败：未提供曲谱code！")

      let userInfo = await get_user_info_by_token(conn, token)
      if (!userInfo) return genReply(false, {}, "同步曲谱失败：用户认证失败！")

      let project = await get_project(conn, code)
      if (project) { // update project
        if (project.creator_id != userInfo.id)
          return genReply(false, {}, "同步曲谱失败：没有项目权限！")
        let data = {}
        if (title != undefined) data.title = title
        if (singer != undefined) data.singer = singer
        if (sheet != undefined) data.sheet = sheet
        if (isPublic != undefined) data.is_public = isPublic
        let x = await conn.query(sql.table("project").data(data).where({id: project.id}).update())
        console.log(x)
        return genReply(true, { type: 'update' }, "同步曲谱成功~")
      } else { // create project
        await conn.query(sql.table("project").data({
          creator_id: userInfo.id,
          code: code,
          title: title ?? "",
          singer: singer ?? "",
          sheet: sheet ?? "",
          is_public: isPublic ?? false
        }).insert())
        return genReply(true, { type: 'insert' }, "同步曲谱成功~")
      }
    })
  )

  fastify.get(
    '/project/get', 
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['code'],
          properties: {
            token: { type: 'string' },
            code: { type: 'string' },
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      const token = request.query.token
      const code = request.query.code

      if (!code) return genReply(false, {}, "获取曲谱失败：未提供曲谱code！")

      let project = await get_project(conn, code)
      if (!project) return genReply(false, {}, "获取曲谱失败：不存在或没有权限")

      let projectData = {
        pid: project.code,
        title: project.title,
        singer: project.singer,
        by: creatorInfo.name,
        sheet: project.sheet
      }
      let creatorInfo = await get_user_info_by_id(conn, project.creator_id)
      if (project.is_public) {
        return genReply(true, projectData, "获取曲谱成功")
      } else {
        let requesterInfo = await get_user_info_by_token(conn, token)
        if (project.creator_id == requesterInfo.id) { 
          return genReply(true, projectData, "获取曲谱成功")
        } else {
          return genReply(false, {}, "获取曲谱失败：不存在或没有权限")
        }
      }
    })
  )

  fastify.get(
    '/project/get_public', 
    {
      schema: {
        querystring: {
          type: 'object',
          required: [],
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      const page = request.query.page ?? 1
      const limit = request.query.limit ?? 20

      const [rows, _] = await conn.query(
        sql.table('project').field("*").join([{
          dir: 'right',
          table: ('user'),
          where: [{'project.creator_id': ['user.id']}]
        }]).where({
            is_public: true,
        }).page(page, limit).select(), []
      )
      
      console.log("xxxxxxxxxxxxxx")
      console.log(rows)
      let projects = []
      for (let row of rows) {
        projects.push({
          pid: row.code,
          title: row.title,
          singer: row.singer,
          by: row.name,
          sheet: row.sheet
        })
      }

      return genReply(true, { projects }, "获取曲谱成功！")
    })
  )

  // TODO: merge duplicate codes
  fastify.get(
    '/project/get_owned', 
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['token'],
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
          }
        }
      }
    },
    onFastifyMysql(fastify, async (conn, request) => {
      const token = request.query.token
      const page = request.query.page ?? 1
      const limit = request.query.limit ?? 20

      let userInfo = await get_user_info_by_token(conn, token)
      if (!userInfo) return genReply(false, {}, "获取曲谱失败：未登录或登录已过期")

      const [rows, _] = await conn.query(
        sql.table('project').field("*").where({creator_id: userInfo.id}).page(page, limit).select(), []
      )
      
      let projects = []
      for (let project in rows) {
        projects.push({
          pid: project.code,
          title: project.title,
          singer: project.singer,
          by: userInfo.name,
          sheet: project.sheet,
          updateTime: project.updateTime,
          createTime: project.createTime,
        })
      }

      return genReply(true, { projects }, "获取曲谱成功！")
    })
  )
}
