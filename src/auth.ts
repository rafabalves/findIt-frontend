import { BrowserCacheLocation, PublicClientApplication } from '@azure/msal-browser'

export const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || 'b260a802-31c8-4321-9f4e-4b41ab44581f'
export const authority = import.meta.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/common'
export const apiScope = import.meta.env.VITE_API_SCOPE || 'api://a66cb6cf-367c-4568-b267-8e9f475a99bb/access_as_user'

export const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
  },
})

export const loginRequest = { scopes: [apiScope] }
