import { useEffect, useState } from 'react'

export const ROUTES = {
  panorama: { href: '#/', label: 'Panorama', title: 'CID360 · Panorama de Gestión' },
  envios: { href: '#/envios', label: 'Envíos', title: 'CID360 · Monitoreo de envíos' },
} as const

export type Route = keyof typeof ROUTES

const current = (): Route => (window.location.hash.replace(/^#\/?/, '') === 'envios' ? 'envios' : 'panorama')

export function useRoute() {
  const [route, setRoute] = useState<Route>(current)

  useEffect(() => {
    const onChange = () => {
      setRoute(current())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    document.title = ROUTES[route].title
  }, [route])

  return route
}
