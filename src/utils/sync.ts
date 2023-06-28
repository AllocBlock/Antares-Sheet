import Storage from './storage'
import Request from './request'
import md5 from 'md5'

interface BackendReply{
    success: boolean
    message: string
    data: any
}

export default {
    getSyncUrl() {
        return Storage.load("sync_url") ?? '/api'
    },
    async validateUser() : Promise<BackendReply> { // return user name if valid
        let token = Storage.load('sync_token')
        if (!token) return {
            success: false,
            message: "尚未登录",
            data: {}
        }
        
        let baseUrl = this.getSyncUrl()
        let result = await Request.get(baseUrl + "/user/validate", {
            token: token,
        }) as BackendReply
        return result
    },
    async login(userName : string, rawPassword : string) : Promise<BackendReply> {
        let password = md5('antares' + rawPassword + 'seratan')
        let baseUrl = this.getSyncUrl()
        let result = await Request.get(baseUrl + "/user/login_or_register", {
            username: userName,
            password: password
        }) as BackendReply
        if (result.success) {
            Storage.save('sync_token', result.data.token)
        }
        return result
    },
    logout() {
        Storage.save('sync_token', '')
    }

}