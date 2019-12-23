import { StorefrontModule } from '@vue-storefront/core/lib/modules'
import { cartStore } from './store'
import { cartCacheHandlerFactory } from './helpers';
import { isServer } from '@vue-storefront/core/helpers'
import Vue from 'vue'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import { tabSync } from '@vue-storefront/core/lib/tab-sync'
import * as types from '@vue-storefront/core/modules/cart/store/mutation-types'

export const CartModule: StorefrontModule = function ({store}) {
  StorageManager.init('cart')

  store.registerModule('cart', cartStore)

  if (!isServer) store.dispatch('cart/load')
  store.subscribe(cartCacheHandlerFactory(Vue))
  tabSync.listen('cart/load', async () => {
    console.log('load')
    return store.dispatch('cart/sync', { forceClientState: false })
  })
}
