import { StorefrontModule } from '@vue-storefront/core/lib/modules'

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const FancyModule: StorefrontModule = async function ({ store, router }) {
  await sleep(2000)
  await store.dispatch('url/registerMapping', {
    url: '/fancy/world',
    routeData: {
      name: 'category',
      params: {
        slug: 'women-20'
      }
    }
  }, { root: true })
}
