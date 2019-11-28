import { removeStoreCodeFromRoute, currentStoreView, localizedDispatcherRouteName } from '@vue-storefront/core/lib/multistore'
import SearchQuery from '@vue-storefront/core/lib/search/searchQuery'
import { StorefrontModule } from '@vue-storefront/core/lib/modules'
import merge from 'lodash-es/merge'
import { urlStore } from '@vue-storefront/core/modules/url/store'
import { createModule } from '@vue-storefront/core/lib/module'
import { beforeEachGuard } from '@vue-storefront/core/modules/url//router/beforeEach'

// extension
export const urlStoreExtend = {
  actions: {
    async mappingFallback ({ dispatch }, { url, params }: { url: string, params: any}) {
      console.log('extended')
      const { storeCode, appendStoreCode } = currentStoreView()
      const productQuery = new SearchQuery()
      url = (removeStoreCodeFromRoute(url.startsWith('/') ? url.slice(1) : url) as string)
      productQuery.applyFilter({key: 'url_path', value: {'eq': url}}) // Tees category
      const products = await dispatch('product/list', { query: productQuery }, { root: true })
      if (products && products.items && products.items.length) {
        const product = products.items[0]
        return {
          name: localizedDispatcherRouteName(product.type_id + '-product', storeCode, appendStoreCode),
          params: {
            slug: product.slug,
            parentSku: product.sku,
            childSku: params['childSku'] ? params['childSku'] : product.sku
          }
        }
      } else {
        const category = await dispatch('category/single', { key: 'url_path', value: url }, { root: true })
        if (category !== null) {
          return {
            name: localizedDispatcherRouteName('category', storeCode, appendStoreCode),
            params: {
              slug: category.slug
            }
          }
        }
      }
    }
  }
}

// 3. unregister store module and create new one
export const UrlModuleExtend: StorefrontModule = function ({store}) {
  store.unregisterModule('url')
  store.registerModule('url', merge(urlStore, urlStoreExtend))
}

// 4. 1.10v module registration
export const OldUrlModule = createModule({
  key: 'url',
  store: { modules: [{ key: 'url', module: merge(urlStore, urlStoreExtend) }] }, // `merge` it's same as `extendModule` for vuex module
  router: { beforeEach: beforeEachGuard }
})
