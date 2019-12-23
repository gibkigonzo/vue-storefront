import { isServer } from '@vue-storefront/core/helpers';

class TabSync {
  private callbacks = new Map()
  private quene = new Map()
  private lsName = 'vsf-tab-sync'
  private constructor () {} // eslint-disable-line no-useless-constructor
  private static instance: TabSync
  public static init () {
    if (!TabSync.instance) {
      TabSync.instance = new TabSync()
    } else {
      return TabSync.instance
    }
    if (isServer) return TabSync.instance
    window.addEventListener('storage', TabSync.instance.getMessage.bind(TabSync.instance))
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        TabSync.instance.flush()
      }
    })
    return TabSync.instance
  }
  private getMessage (ev) {
    if (ev.key !== this.lsName) return
    const payload = JSON.parse(ev.newValue)
    if (!payload) return // ignore empty msg or msg reset
    const quene = this.quene.get(payload.type)
    if (!quene) return
    quene.push(payload.data)
  }
  private flush () {
    this.callbacks.forEach(async ({callback, isUniq}, type) => {
      if (!callback) {
        this.resetQuene(type)
        this.callbacks.delete(type)
        return
      }
      const quene = this.quene.get(type)
      if (!quene.length) return
      if (isUniq) {
        await callback(quene[quene.length - 1])
      } else {
        for (const qItem of quene) {
          await callback(qItem)
        }
      }
      this.resetQuene(type)
    })
  }
  private resetQuene (type) {
    this.quene.delete(type)
    this.quene.set(type, [])
  }
  public listen (type: string, callback, isUniq: boolean = true) {
    this.callbacks.delete(type)
    this.resetQuene(type)
    this.callbacks.set(type, {callback, isUniq})
  }
  public send (type: string, data?) {
    localStorage.setItem(this.lsName, JSON.stringify({type, data}))
    localStorage.removeItem(this.lsName)
  }
}

export const tabSync = TabSync.init()
