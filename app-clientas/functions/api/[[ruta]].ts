// Todas las rutas /api/* de la app (Cloudflare Pages Functions). La lógica está en api/salon.ts.
import { atender, type Env } from '../../api/salon'

export const onRequest: PagesFunction<Env> = ({ request, env, waitUntil }) =>
  atender(request, env, { waitUntil, passThroughOnException: () => {} } as unknown as ExecutionContext)
