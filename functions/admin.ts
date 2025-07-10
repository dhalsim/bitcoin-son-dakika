import { authenticateNIP98, getUserRoles, ErrorResponse, SuccessResponse, CorsResponse, getUsersByRole } from './utils';
import { Context } from './types';

export async function onRequestGet(context: Context) {
  try {
    // For GET requests, return public admin data (authentication happens at action level)
    const [adminUsers, editorUsers] = await Promise.all([
      getUsersByRole(context, 'admin'),
      getUsersByRole(context, 'editor')
    ]);

    // Return basic admin data without requiring authentication for the page view
    return SuccessResponse({
      adminUsers,
      editorUsers,
      totalAdmins: adminUsers.length,
      totalEditors: editorUsers.length
    });

  } catch (error) {
    console.error('Admin GET error:', error);
    return ErrorResponse(error);
  }
}

export async function onRequestPost(context: Context) {
  try {
    // MANDATORY AUTHENTICATION for all POST actions
    const authResult = await authenticateNIP98(context.request, context, ['admin', 'editor']);
    
    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const { action, ...data } = await context.request.json();
    
    switch(action) {
      case 'add-editor-pubkey':
        return handleAddEditor(context, authResult, data);
      case 'remove-editor-pubkey':
        return handleRemoveEditor(context, authResult, data);
      case 'add-admin-pubkey':
        return handleAddAdmin(context, authResult, data);
      case 'remove-admin-pubkey':
        return handleRemoveAdmin(context, authResult, data);
      default:
        return ErrorResponse(undefined, 'Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return CorsResponse();
}

// Helper functions for admin actions
interface AuthResult {
  success: boolean;
  pubkey: string;
  roles: string[];
  error?: string;
  status?: number;
}

interface AdminActionData {
  pubkey?: string;
}

async function handleAddEditor(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Only admins can add editors
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can add editors', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  const { getUsersByRole } = await import('./utils');
  const currentEditors = await getUsersByRole(context, 'editor');
  if (!currentEditors.includes(pubkey)) {
    const updatedEditors = [...currentEditors, pubkey];
    await context.env.EDITOR_PUBKEYS.put('editor_pubkeys', JSON.stringify(updatedEditors));
  }

  return SuccessResponse({ message: 'Editor added successfully', pubkey });
}

async function handleRemoveEditor(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Only admins can remove editors
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can remove editors', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  const { getUsersByRole } = await import('./utils');
  const currentEditors = await getUsersByRole(context, 'editor');
  const updatedEditors = currentEditors.filter(p => p !== pubkey);
  await context.env.EDITOR_PUBKEYS.put('editor_pubkeys', JSON.stringify(updatedEditors));

  return SuccessResponse({ message: 'Editor removed successfully', pubkey });
}

async function handleAddAdmin(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Only admins can add other admins
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can add other admins', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  const { getUsersByRole } = await import('./utils');
  const currentAdmins = await getUsersByRole(context, 'admin');
  if (!currentAdmins.includes(pubkey)) {
    const updatedAdmins = [...currentAdmins, pubkey];
    await context.env.EDITOR_PUBKEYS.put('admin_pubkeys', JSON.stringify(updatedAdmins));
  }

  return SuccessResponse({ message: 'Admin added successfully', pubkey });
}

async function handleRemoveAdmin(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Only admins can remove other admins
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can remove other admins', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  // Prevent removing yourself if you're the last admin
  const { getUsersByRole } = await import('./utils');
  const currentAdmins = await getUsersByRole(context, 'admin');
  if (currentAdmins.length === 1 && currentAdmins.includes(authResult.pubkey)) {
    return ErrorResponse(undefined, 'Cannot remove the last admin', 400);
  }

  const updatedAdmins = currentAdmins.filter(p => p !== pubkey);
  await context.env.EDITOR_PUBKEYS.put('admin_pubkeys', JSON.stringify(updatedAdmins));

  return SuccessResponse({ message: 'Admin removed successfully', pubkey });
} 