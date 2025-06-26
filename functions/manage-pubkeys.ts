import { 
  authenticateNIP98, 
  ErrorResponse, 
  SuccessResponse, 
  CorsResponse, 
  addUserToRole, 
  removeUserFromRole, 
  getUsersByRole,
} from './utils';
import { Context, UserRole } from './types';

export async function onRequestPost(context: Context) {
  try {
    // Authenticate user - require admin role for user management
    const authResult = await authenticateNIP98(context.request, context, ['admin']);
    
    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const body = await context.request.json();
    const { action, pubkey, role } = body;

    if (!action || !pubkey) {
      return ErrorResponse(undefined, 'Missing action or pubkey', 400);
    }

    // Validate role parameter
    if (action === 'add' || action === 'remove') {
      if (!role || !['admin', 'editor'].includes(role)) {
        return ErrorResponse(undefined, 'Missing or invalid role. Must be "admin" or "editor"', 400);
      }
    }

    if (action === 'add') {
      const result = await addUserToRole(context, pubkey, role as UserRole);
      if (!result.success) {
        return ErrorResponse(undefined, result.error || 'Failed to add user to role', 500);
      }
      
      const updatedUsers = await getUsersByRole(context, role as UserRole);
      return SuccessResponse({
        message: `Pubkey added to ${role} role successfully`,
        pubkey,
        role,
        [role === 'admin' ? 'adminPubkeys' : 'editorPubkeys']: updatedUsers,
        managedBy: authResult.pubkey
      });
      
    } else if (action === 'remove') {
      const result = await removeUserFromRole(context, pubkey, role as UserRole);
      if (!result.success) {
        return ErrorResponse(undefined, result.error || 'Failed to remove user from role', 500);
      }
      
      const updatedUsers = await getUsersByRole(context, role as UserRole);
      return SuccessResponse({
        message: `Pubkey removed from ${role} role successfully`,
        pubkey,
        role,
        [role === 'admin' ? 'adminPubkeys' : 'editorPubkeys']: updatedUsers,
        managedBy: authResult.pubkey
      });
      
    } else {
      return ErrorResponse(undefined, 'Invalid action. Use "add" or "remove"', 400);
    }
  } catch (error) {
    return ErrorResponse(error, 'Error processing request', 500);
  }
}

// Get current users by role
export async function onRequestGet(context: Context) {
  try {
    // Authenticate user - require admin role to view user lists
    const authResult = await authenticateNIP98(context.request, context, ['admin']);
    
    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const url = new URL(context.request.url);
    const role = url.searchParams.get('role') as UserRole;

    if (role && !['admin', 'editor'].includes(role)) {
      return ErrorResponse(undefined, 'Invalid role parameter. Must be "admin" or "editor"', 400);
    }

    if (role) {
      // Get users for specific role
      const users = await getUsersByRole(context, role);
      return SuccessResponse({
        role,
        [role === 'admin' ? 'adminPubkeys' : 'editorPubkeys']: users
      });
    } else {
      // Get all users for both roles
      const [adminUsers, editorUsers] = await Promise.all([
        getUsersByRole(context, 'admin'),
        getUsersByRole(context, 'editor')
      ]);

      return SuccessResponse({
        adminPubkeys: adminUsers,
        editorPubkeys: editorUsers
      });
    }
  } catch (error) {
    return ErrorResponse(error, 'Error retrieving users', 500);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return CorsResponse();
} 