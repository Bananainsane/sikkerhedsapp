/**
 * Admin API Tests - /api/admin/promote
 *
 * PDF Requirements:
 * - Test that admin APIs only work for admin users
 * - Test authorization against web API
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/promote/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('@/auth');
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDb = db as jest.Mocked<typeof db>;

describe('API Route: /api/admin/promote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    test('should return 401 for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('logget ind');
    });
  });

  describe('Authorization Tests - Admin Only', () => {
    test('should return 403 for non-admin users', async () => {
      // Mock authenticated non-admin user
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: new Date().toISOString(),
      } as any);

      // Mock database lookup for current user
      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'user',
        password: 'hashed',
        name: 'Test User',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        cprNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('administratorer');
    });

    test('should allow admin users to promote others', async () => {
      // Mock authenticated admin user
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      // Mock database lookup for current user (admin)
      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        password: 'hashed',
        name: 'Admin User',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        cprNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock database update
      mockDb.user.update.mockResolvedValue({
        id: '2',
        email: 'user@example.com',
        role: 'admin',
        password: 'hashed',
        name: 'Test User',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        cprNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Input Validation', () => {
    test('should return 400 if userId is missing', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date().toISOString(),
      } as any);

      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        password: 'hashed',
        name: 'Admin User',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        cprNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({}), // No userId
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('userId');
    });
  });

  describe('Authorization Flow', () => {
    test('should check authentication before authorization', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      const response = await POST(request);

      // Should fail at authentication, not even check authorization
      expect(response.status).toBe(401);
      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });

    test('should check authorization after authentication', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: new Date().toISOString(),
      } as any);

      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'user',
        password: 'hashed',
        name: 'Test User',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        cprNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/promote', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      const response = await POST(request);

      // Should pass authentication but fail authorization
      expect(response.status).toBe(403);
      expect(mockDb.user.findUnique).toHaveBeenCalled();
    });
  });
});
