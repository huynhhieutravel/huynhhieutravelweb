// 1. Role Matrix Type Definition
export type RoleMatrix = {
  version: number;
  roles: Record<string, {
    name: string;
    isSystem: boolean;
    permissions: Record<string, string[]>;
  }>;
};

// Default system roles (Fallback)
export const DEFAULT_ROLES: RoleMatrix = {
  version: 1,
  roles: {
    super_admin: {
      name: 'Super Admin',
      isSystem: true,
      permissions: {
        '*': ['*'] // Super Admin bypasses all
      }
    },
    admin: {
      name: 'Admin',
      isSystem: true,
      permissions: {
        post: ['view', 'create', 'edit', 'delete'],
        tour: ['view', 'create', 'edit', 'delete'],
        media: ['view', 'create', 'edit', 'delete'],
        user: ['view', 'create', 'edit', 'disable'], // Cannot delete
        system: ['manage_roles', 'manage_settings']
      }
    },
    editor: {
      name: 'Editor',
      isSystem: true,
      permissions: {
        post: ['view', 'create', 'edit'],
        tour: ['view', 'create', 'edit'],
        media: ['view', 'create', 'edit']
      }
    },
    author: {
      name: 'Author',
      isSystem: true,
      permissions: {
        post: ['view', 'create', 'edit_own'],
        media: ['view', 'create']
      }
    }
  }
};

/**
 * Authorize Contract
 * Central Engine for all permission checks.
 * @param user The user object containing injected permissions
 * @param action The action to perform (e.g. 'edit')
 * @param resource The resource module (e.g. 'post')
 * @param context Optional context object for ownership checks (e.g. { authorId: '123' })
 */
export function authorize(user: any, action: string, resource: string, context?: any): boolean {
  if (!user || !user.role) return false;

  // Root Authority Bypass
  if (user.role === 'super_admin') return true;

  const roleData = user.permissions;
  if (!roleData) return false;

  const resourcePerms = roleData[resource] || [];
  
  // Basic Action Check
  if (resourcePerms.includes(action)) return true;

  // Ownership Check (e.g. edit_own)
  if (action === 'edit' && resourcePerms.includes('edit_own')) {
    if (context && context.authorId === user.id) return true;
  }

  // Escalation Check for users: You cannot grant a role you don't possess
  // This logic is handled at the API level (users/[id].ts), but we can add helper here.

  return false;
}

/**
 * Helper to check if user can escalate role.
 * User can only assign roles if they are super_admin, or if they have system:manage_roles 
 * AND they are not assigning super_admin.
 */
export function canAssignRole(assigner: any, targetRole: string): boolean {
  if (assigner.role === 'super_admin') return true;
  if (targetRole === 'super_admin') return false; // Only super_admin can create super_admin
  
  return authorize(assigner, 'manage_roles', 'system');
}
