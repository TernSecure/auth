import { describe, it, expect, vi, beforeAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { geminiCreateTernSecureNextJsHandlerFn } from '../../examples/gemini_fnTernSecureNextHandler';
import { SessionEndpointHandler } from '../app-router/admin/handlers';

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
    requireCSRF: false, // Disable CSRF for this test to simplify requests
  },
  debug: false,
};

describe('Stress Test', () => {
  const handler = geminiCreateTernSecureNextJsHandlerFn(authHandlerOptions);

  beforeAll(() => {
    // Mock the session handler to return a simple success response
    (SessionEndpointHandler.handle as any).mockResolvedValue(new NextResponse(null, { status: 200 }));
  });

  it('should handle a high volume of concurrent requests', async () => {
    const concurrentRequests = 1000;
    const requests = Array.from({ length: concurrentRequests }, () => {
      const request = new NextRequest('http://localhost/api/auth/sessions/verify', {
        method: 'GET',
        headers: { origin: 'http://localhost:3000' },
      });
      return handler.GET(request);
    });

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    console.log(`Handled ${concurrentRequests} requests in ${endTime - startTime}ms`);

    let successCount = 0;
    responses.forEach(response => {
      if (response.status === 200) {
        successCount++;
      }
    });

    expect(successCount).toBe(concurrentRequests);
    expect(SessionEndpointHandler.handle).toHaveBeenCalledTimes(concurrentRequests);
  }, 30000); // Increase timeout for this test
});
