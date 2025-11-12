/**
 * API Endpoint Tests - /api/hello
 *
 * PDF Requirements:
 * - Test authentication (authenticated vs not authenticated) against web API
 * - Test authorization (admin vs non-admin) against web API
 * - Admin users should receive "Hello, World! From api"
 * - Non-admin users should receive "Adgang nægtet, du er ikke admin"
 * - Unauthenticated users should receive 401 error
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/hello/route';
import { auth } from '@/auth';

// Mock the auth function
jest.mock('@/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('API Route: /api/hello', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests (Against API)', () => {
    test('should return 401 for unauthenticated users', async () => {
      // Mock no session (not authenticated)
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Adgang nægtet, du skal være logget ind');
    });

    test('should return 401 when session exists but user is null', async () => {
      // Mock session with null user
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Adgang nægtet');
    });

    test('should allow authenticated users to call the endpoint', async () => {
      // Mock authenticated user (but not admin)
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);

      // Should not return 401 (authentication passed)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Authorization Tests (Against API)', () => {
    test('should return 403 for authenticated non-admin users', async () => {
      // Mock authenticated user with "user" role (not admin)
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Adgang nægtet, du er ikke admin');
    });

    test('should return success message for admin users', async () => {
      // Mock authenticated admin user
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello, World! From api');
    });

    test('should only accept admin role (case-sensitive)', async () => {
      // Test with uppercase "ADMIN" (should fail)
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'ADMIN', // Wrong case
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe('HTTP Status Codes', () => {
    test('should use correct HTTP status code for unauthenticated (401)', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(401); // Unauthorized
    });

    test('should use correct HTTP status code for unauthorized (403)', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(403); // Forbidden
    });

    test('should use correct HTTP status code for success (200)', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(200); // OK
    });
  });

  describe('Response Format', () => {
    test('should return JSON response for errors', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    test('should return JSON response for success', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/hello', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    });
  });
});
