import { verifyEvent, Event } from 'nostr-tools/pure';
import { AuthContext, AuthResult, UserRole } from './types';

export function ErrorResponse(e?: Error, message?: string, status: number = 500) {
  return new Response(JSON.stringify({
    success: false,
    message: message || (e instanceof Error ? e.message : 'Error processing request'),
    error: e instanceof Error ? e.message : 'Unknown error'
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export function SuccessResponse(data: Record<string, unknown>, status: number = 200) {
  return new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export function CorsResponse() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

/**
 * Authenticate using NIP-98 Nostr auth scheme and check roles
 */
export async function authenticateNIP98(
  request: Request, 
  context: AuthContext, 
  requiredRoles?: UserRole[]
): Promise<AuthResult> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Nostr ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header',
        status: 401
      };
    }

    // Parse the Nostr event from the Authorization header
    let nostrEvent: Event;
    try {
      const eventBase64 = authHeader.slice(6); // Remove 'Nostr ' prefix
      const eventJson = atob(eventBase64);
      nostrEvent = JSON.parse(eventJson);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid Nostr event format',
        status: 401
      };
    }

    // Verify the event signature
    if (!verifyEvent(nostrEvent)) {
      return {
        success: false,
        error: 'Invalid event signature',
        status: 401
      };
    }

    // Verify the event is for the correct method (NIP-98)
    const urlTag = nostrEvent.tags.find(tag => tag[0] === 'u');
    const methodTag = nostrEvent.tags.find(tag => tag[0] === 'method');
    
    if (!urlTag || !methodTag) {
      return {
        success: false,
        error: 'Invalid NIP-98 auth event - missing required tags',
        status: 401
      };
    }

    // Check if the event is not too old (within 10 minutes)
    const eventTime = nostrEvent.created_at;
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 10 * 60; // 10 minutes

    if (currentTime - eventTime > maxAge) {
      return {
        success: false,
        error: 'Auth event is too old',
        status: 401
      };
    }

    // Get user roles
    const userRoles = await getUserRoles(context, nostrEvent.pubkey);
    
    if (userRoles.length === 0) {
      return {
        success: false,
        error: 'Unauthorized pubkey',
        status: 403
      };
    }

    // Check if user has required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        return {
          success: false,
          error: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
          status: 403
        };
      }
    }

    return {
      success: true,
      pubkey: nostrEvent.pubkey,
      roles: userRoles
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
      status: 500
    };
  }
}

/**
 * Get user roles from KV storage
 */
export async function getUserRoles(context: AuthContext, pubkey: string): Promise<UserRole[]> {
  const roles: UserRole[] = [];

  try {
    // Check admin role
    const adminPubkeys = await context.env.EDITOR_PUBKEYS.get('admin_pubkeys');
    if (adminPubkeys) {
      const adminArray: string[] = JSON.parse(adminPubkeys);
      if (adminArray.includes(pubkey)) {
        roles.push('admin');
      }
    }

    // Check editor role (legacy support for 'pubkeys' key)
    const editorPubkeys = await context.env.EDITOR_PUBKEYS.get('editor_pubkeys') || 
                          await context.env.EDITOR_PUBKEYS.get('pubkeys');
    if (editorPubkeys) {
      const editorArray: string[] = JSON.parse(editorPubkeys);
      if (editorArray.includes(pubkey)) {
        roles.push('editor');
      }
    }
  } catch (error) {
    console.error('Error getting user roles:', error);
  }

  return roles;
}

/**
 * Add a user to a specific role
 */
export async function addUserToRole(
  context: AuthContext, 
  pubkey: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = role === 'admin' ? 'admin_pubkeys' : 'editor_pubkeys';
    const currentUsers = await context.env.EDITOR_PUBKEYS.get(key);
    let usersArray: string[] = [];
    
    if (currentUsers) {
      usersArray = JSON.parse(currentUsers);
    }

    if (!usersArray.includes(pubkey)) {
      usersArray.push(pubkey);
      await context.env.EDITOR_PUBKEYS.put(key, JSON.stringify(usersArray));
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Remove a user from a specific role
 */
export async function removeUserFromRole(
  context: AuthContext, 
  pubkey: string, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = role === 'admin' ? 'admin_pubkeys' : 'editor_pubkeys';
    const currentUsers = await context.env.EDITOR_PUBKEYS.get(key);
    let usersArray: string[] = [];
    
    if (currentUsers) {
      usersArray = JSON.parse(currentUsers);
    }

    const index = usersArray.indexOf(pubkey);
    if (index > -1) {
      usersArray.splice(index, 1);
      await context.env.EDITOR_PUBKEYS.put(key, JSON.stringify(usersArray));
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all users by role
 */
export async function getUsersByRole(
  context: AuthContext, 
  role: UserRole
): Promise<string[]> {
  try {
    const key = role === 'admin' ? 'admin_pubkeys' : 'editor_pubkeys';
    const users = await context.env.EDITOR_PUBKEYS.get(key);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
}

const ADMIN_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nos.social"
];

const MASTER_ADMIN_PUBKEY = "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

