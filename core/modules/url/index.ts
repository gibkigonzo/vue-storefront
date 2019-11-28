import { urlStore } from './store'
import { StorefrontModule } from '@vue-storefront/core/lib/modules'
import { beforeEachGuard } from './router/beforeEach'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
// 1. and 2. option
import merge from 'lodash-es/merge'
// 1. direct import
import { urlStoreExtend } from 'theme/modules/urlExtend'

export const cacheStorage = StorageManager.init('url')

export const UrlModule: StorefrontModule = function ({
  store,
  router,
  // 2. injected to module
  moduleConfig: { store: moduleExtendedStore }
}) {
  store.registerModule('url', urlStore)
  // 1. direct import
  // store.registerModule('url', merge(urlStore, urlStoreExtend))
  // 2. injected to module
  // store.registerModule('url', merge(urlStore, moduleExtendedStore))
  router.beforeEach(beforeEachGuard)
}
