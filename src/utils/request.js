import { getToken } from '@/utils/auth'
import axios from 'axios'
import { Message } from 'element-ui'

// 全局使用的request，统一处理请求失败的操作
const g_BaseUrl = process.env.VUE_APP_BASE_API

// 设置默认前缀，之后的请求都不需要加了
axios.defaults.baseURL = g_BaseUrl

function reportError(msg) {
  console.error(msg)
  Message({
    message: msg,
    type: 'error',
    duration: 5000
  })
}

function handleResponse(response, resolve, reject) {
  if (response.status != 200) {
    reportError('网络错误，代码：' + response.status)
    reject()
    return
  }
  var res = response.data
  if (res.code != 10001) {
    reportError('请求失败，错误信息：' + res.error)
    reject()
    return
  }

  resolve(res)
}

function handleError(error) {
  reportError(error.message)
}

export function get(url, params = {}) {
  return new Promise((resolve, reject) => {
    params.token = getToken()
    axios.get(url, {
      params: params
    })
    .then(response => handleResponse(response, resolve, reject))
    .catch(error => handleError(error))
  })
}

// export function post(url, form = {}) {
//   return new Promise((resolve, reject) => {
//     axios.post(url, form)
//       .then(response => handleResponse(response, resolve, reject))
//       .catch(error => handleError(error))
//   })
// }
