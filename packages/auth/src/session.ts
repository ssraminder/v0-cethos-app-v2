import type { User } from "@supabase/supabase-js"
import { db } from "@cethos/db"
import { users } from "@cethos/db"
import { eq } from "drizzle-orm"
import { logger } from "@cethos/utils"

export interface SessionUser extends User {
  role?: string
  name?: string
  businessApproved?: boolean
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<SessionUser | null> {
  try {
    const userProfile = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (userProfile.length === 0) {
      return null
    }

    const profile = userProfile[0]

    return {
      id: userId,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      businessApproved: profile.businessApproved,
    } as SessionUser
  } catch (error) {
    logger.error("Error fetching user profile:", error)
    return null
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const userProfile = await getUserProfile(userId)
    if (!userProfile?.role) return false

    // Query role permissions
    const rolePermissions = await db.query.rolePermissions.findMany({
      where: (rp, { eq }) => eq(rp.role, userProfile.role!),
    })

    return rolePermissions.some((rp) => rp.permission === permission)
  } catch (error) {
    logger.error("Error checking permission:", error)
    return false
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userProfile = await getUserProfile(userId)
    if (!userProfile?.role) return []

    const rolePermissions = await db.query.rolePermissions.findMany({
      where: (rp, { eq }) => eq(rp.role, userProfile.role!),
    })

    return rolePermissions.map((rp) => rp.permission)
  } catch (error) {
    logger.error("Error fetching user permissions:", error)
    return []
  }
}
