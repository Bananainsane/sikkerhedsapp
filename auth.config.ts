import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import { HashingService } from "./lib/hashing";

// Schema for credentials - now accepts userId OR email
const LoginSchema = z.object({
  userId: z.string().optional(),  // For hashed email login
  email: z.string().optional(),   // For backward compatibility
  password: z.string().min(1, "Password is required"),
});

export default {
  providers: [
    Credentials({
      credentials: {
        userId: { label: "User ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate credentials
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { userId, email, password } = validatedFields.data;

        let user = null;

        if (userId) {
          // Find user by ID (already authenticated via login action)
          user = await db.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              emailSalt: true,
              username: true,
              name: true,
              password: true,
              role: true,
              twoFactorEnabled: true,
            },
          });
        } else if (email) {
          // Legacy: find by hashed email comparison (for backward compatibility)
          const allUsers = await db.user.findMany({
            select: {
              id: true,
              email: true,
              emailSalt: true,
              username: true,
              name: true,
              password: true,
              role: true,
              twoFactorEnabled: true,
            },
          });

          for (const u of allUsers) {
            if (u.emailSalt && HashingService.verifyEmail(email, u.email, u.emailSalt)) {
              user = u;
              break;
            }
          }
        }

        if (!user || !user.password) {
          return null;
        }

        // Verify password (unless already verified in login action)
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
          // Return a special object indicating 2FA is required
          return {
            id: user.id,
            email: user.username || user.id,  // Use username as display, or ID
            name: user.name || user.username,
            role: user.role,
            twoFactorRequired: true,
          } as any;
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.username || user.id,  // Use username as display
          name: user.name || user.username,
          role: user.role,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
