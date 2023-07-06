import { defineStore } from 'pinia'
import Storage from '@/utils/storage'

export default defineStore('user', {
    state: () => {
        return {
            userInfo: {
                token: Storage.load('token'),
                userName: Storage.load('userName'),
            }
        }
    },
    getters: {
        isLogged(): boolean {
            return !!this.userInfo.token
        }
    },
    actions: {
        updateUserInfo(token: string, userName: string) {
            this.userInfo.token = token
            this.userInfo.userName = userName
            Storage.save('token', token)
            Storage.save('userName', userName)
        },
        clearUserInfo() {
            this.userInfo.token = null
            this.userInfo.userName = ''
            Storage.save('token', null)
            Storage.save('userName', '')
        },
    },
})