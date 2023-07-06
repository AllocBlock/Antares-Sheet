import Storage from './storage'
import Request from './request'
import md5 from 'md5'
import { assert } from './assert'
import useUserStore from '@/store/user'

interface BackendReply{
    success: boolean
    message: string
    data: any
}

export default {
    initStore(store) {
        gStore = store
    },
    getSyncUrl() {
        return Storage.load("sync_url") ?? '/api'
    },
    async validateUser() : Promise<BackendReply> { // return user name if valid
        const userStore = useUserStore()
        const token = userStore.userInfo.token
        if (!token) return {
            success: false,
            message: "尚未登录",
            data: {}
        }
        
        const baseUrl = this.getSyncUrl()
        return await Request.get(baseUrl + "/user/validate", {
            token: token,
        }) as BackendReply
    },
    async login(userName : string, rawPassword : string) : Promise<BackendReply> {
        const password = md5('antares' + rawPassword + 'seratan')
        const baseUrl = this.getSyncUrl()
        try {
            const result = await Request.get(baseUrl + "/user/login_or_register", {
                username: userName,
                password: password
            }) as BackendReply
            
            if (result.success) {
                const userStore = useUserStore()
                userStore.updateUserInfo(result.data.token, userName)
            }
            return result
        }
        catch (e) {
            return {
                success: false,
                message: "网络超时",
                data: {}
            }
        }
    },
    logout() {
        const userStore = useUserStore()
        userStore.clearUserInfo()
    },
    async get_owned_project() {
        const userStore = useUserStore()
        assert(userStore.userInfo.token, "用户未登录")
        const baseUrl = this.getSyncUrl()
        const result = await Request.get(baseUrl + "/project/get_owned", {
            token: userStore.userInfo.token,
            page: 1,
            limit: 100
        }) as BackendReply
        return result
    },
    async get_project(projectCode) {
        const userStore = useUserStore()
        assert(userStore.userInfo.token, "用户未登录")
        const baseUrl = this.getSyncUrl()
        const result = await Request.get(baseUrl + "/project/get", {
            token: userStore.userInfo.token,
            code: projectCode,
        }) as BackendReply
        return result
    },
    async create_or_update_project(projectCode, title, singer, sheet, isPublic) {
        const userStore = useUserStore()
        assert(userStore.userInfo.token, "用户未登录")
        const baseUrl = this.getSyncUrl()
        const result = await Request.post(baseUrl + "/project/create_or_update", {
            token: userStore.userInfo.token,
            code: projectCode,
            title,
            singer,
            sheet,
            isPublic,
        }) as BackendReply
        return result
    },
    
    async get_public_projects() {
        const baseUrl = this.getSyncUrl()
        const result = await Request.get(baseUrl + "/project/get_public", {
            page: 1,
            limit: 100
        }) as BackendReply
        return result
    },
}