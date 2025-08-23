import { createTernSecureNextJsHandler } from '@tern-secure/nextjs/admin'

export const runtime = 'nodejs'

const { GET, POST } = createTernSecureNextJsHandler()

export { GET, POST }