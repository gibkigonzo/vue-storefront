import { Logger } from '@vue-storefront/core/lib/logger'
import { AsyncDataLoader } from '@vue-storefront/core/lib/async-data-loader'

// This function will be fired both on server and client side context after registering other parts of the module
export function afterRegistration ({ Vue, config, store, isServer }) {
  if (isServer) Logger.info('This will be called after extension registration and only on client side')()
  AsyncDataLoader.push({ // this is an example showing how to call data loader from another module
    execute: ({ route, store, context }) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          store.state.example.users = true
          resolve(null)
        }, 10000)
      })
    }
  })
}
