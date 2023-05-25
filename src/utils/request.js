import axios from 'axios'

// 全局使用的request，统一处理请求失败的操作
const g_BaseUrl = import.meta.env.VITE_APP_BASE_URL

// 设置默认前缀，之后的请求都不需要加了
axios.defaults.baseURL = g_BaseUrl

function reportError(msg, reject) {
  console.error(msg)
  reject("网络错误")
}

function handleResponse(response, resolve, reject) {
  if (response.status != 200) {
    reportError('网络错误，代码：' + response.status)
    reject()
    return
  }
  var res = response.data
  resolve(res)
}

function handleError(error, reject) {
  reportError(error.message, reject)
}

export default {
  get(url, params = {}) {
    return new Promise((resolve, reject) => {
      axios.get(url, {
        params: params
      })
      .then(response => handleResponse(response, resolve, reject))
      .catch(error => handleError(error, reject))
    })
  }
}
// export function post(url, form = {}) {
//   return new Promise((resolve, reject) => {
//     axios.post(url, form)
//       .then(response => handleResponse(response, resolve, reject))
//       .catch(error => handleError(error))
//   })
// }
