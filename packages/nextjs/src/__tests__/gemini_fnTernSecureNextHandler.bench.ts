import { bench, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { geminiCreateTernSecureNextJsHandlerFn } from '../../examples/gemini_fnTernSecureNextHandler';
import { SessionEndpointHandler } from '../app-router/admin/sessionHandlers';

vi.mock('../sessionHandlers', () => ({
  SessionEndpointHandler: {
    handle: vi.fn(),
  },
}));

const authHandlerOptions = {
  cors: {
    allowedOrigins: ['http://localhost:3000', 'https://ternsecure.com'],
    allowedMethods: ['GET', 'POST'],
  },
  security: {
    requireCSRF: true,
    allowedReferers: ['http://localhost:3000', 'https://ternsecure.com'],
  },
  debug: false,
};

bench('handler performance for a valid request', async () => {
  const handler = geminiCreateTernSecureNextJsHandlerFn(authHandlerOptions);
  const request = new NextRequest('http://localhost/api/auth/sessions/verify', {
    method: 'GET',
    headers: { origin: 'http://localhost:3000' },
  });
  (SessionEndpointHandler.handle as any).mockResolvedValue(new NextResponse(null, { status: 200 }));

  await handler.GET(request);
});
