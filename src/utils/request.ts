import axios, { AxiosResponse } from 'axios'

// 全局使用的request，统一处理请求失败的操作
const g_BaseUrl = import.meta.env.VITE_APP_BASE_URL

// 设置默认前缀，之后的请求都不需要加了
axios.defaults.baseURL = g_BaseUrl
axios.defaults.timeout = 4000;

const gTimeoutResult = {
    success: false,
    message: '网络超时',
    data: {}
}

function createErrorResult(message: string) {
    return {
        success: false,
        message: message,
        data: {}
    }
}

function handleError(error, resolve) {
    if (error.message.includes("timeout")) {
        resolve(gTimeoutResult)
    } else {
        resolve(createErrorResult(error.response.data.message))
    }
}

function handleResponse(response: AxiosResponse, resolve) {
    if (response.status != 200) {
        resolve(createErrorResult("网络请求失败，错误码：" + response.status))
    } else {
        resolve(response.data)
    }
}

export default {
    get(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.get(url, { params })
                .then(response => handleResponse(response, resolve))
                .catch(error => handleError(error, resolve))
        })
    },
    post(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.post(url, params)
                .then(response => handleResponse(response, resolve))
                .catch(error => handleError(error, resolve))
        })
    }
}
