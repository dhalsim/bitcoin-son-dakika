import { ErrorResponse, SuccessResponse, CorsResponse, ADMIN_RELAYS, MASTER_ADMIN_PUBKEY } from './utils';
import { Context } from './types';
import { SimplePool, finalizeEvent, nip19, NostrEvent, verifyEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

const pool = new SimplePool();

export async function onRequestGet(context: Context) {
  try {
    // For GET requests, return public admin data (no authentication required for viewing)
    const { adminUsers, editorUsers } = await fetchNostrUserSets(context);

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
    const authResult = await authenticateNIP98Request(context);
    
    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const requestBody = await context.request.json();
    const { action } = requestBody;
    
    switch(action) {
      case 'add-editor-pubkey':
        return handleAddEditor(context, authResult, requestBody);
      case 'remove-editor-pubkey':
        return handleRemoveEditor(context, authResult, requestBody);
      case 'add-admin-pubkey':
        return handleAddAdmin(context, authResult, requestBody);
      case 'remove-admin-pubkey':
        return handleRemoveAdmin(context, authResult, requestBody);
      case 'add-article':
        return handleAddArticle(context, authResult, requestBody);
      case 'add-news':
        return handleAddNews(context, authResult, requestBody);
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

// Helper functions for authentication and user management
type AuthResult = {
  success: true;
  pubkey: string;
  roles: string[];
} | {
  success: false;
  error: string;
  status: number;
}

/**
 * Authenticate NIP-98 request and check user roles from Nostr events
 */
async function authenticateNIP98Request(context: Context): Promise<AuthResult> {
  try {
    // Get the Authorization header
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Nostr ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header',
        status: 401
      };
    }

    // Parse the Nostr event from the Authorization header
    let nostrEvent: NostrEvent;
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

    // Get user roles from Nostr sets
    const userRoles = await getUserRolesFromNostr(context, nostrEvent.pubkey);
    
    if (userRoles.length === 0) {
      return {
        success: false,
        error: 'Unauthorized pubkey - not in any permission set',
        status: 403
      };
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
 * Fetch admin and editor user sets from Nostr relays
 */
async function fetchNostrUserSets(context: Context): Promise<{adminUsers: string[], editorUsers: string[]}> {
  const pool = new SimplePool();
  const events: NostrEvent[] = [];

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout fetching user sets'));
    }, 10000);

    pool.subscribeManyEose(ADMIN_RELAYS, [
      {
        authors: [MASTER_ADMIN_PUBKEY],
        kinds: [30000],
        "#d": ["admin-users"],
        limit: 1
      },
      {
        authors: [MASTER_ADMIN_PUBKEY],
        kinds: [30000], 
        "#d": ["editor-users"],
        limit: 1
      }
    ], {
      onevent(evt) {
        events.push(evt);
      },
      onclose() {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  let adminUsers: string[] = [];
  let editorUsers: string[] = [];
  
  // Parse the events to extract pubkeys from sets
  events.forEach(event => {
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    
    if (dTag === 'admin-users') {
      // Extract pubkeys from 'p' tags
      adminUsers = event.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1])
        .filter(Boolean);
    } else if (dTag === 'editor-users') {
      // Extract pubkeys from 'p' tags  
      editorUsers = event.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1])
        .filter(Boolean);
    }
  });

  return { adminUsers, editorUsers };
}

/**
 * Get user roles from Nostr events
 */
async function getUserRolesFromNostr(context: Context, pubkey: string): Promise<string[]> {
  const roles: string[] = [];

  try {
    const { adminUsers, editorUsers } = await fetchNostrUserSets(context);

    if (adminUsers.includes(pubkey)) {
      roles.push('admin');
    }

    if (editorUsers.includes(pubkey)) {
      roles.push('editor');
    }
  } catch (error) {
    console.error('Error getting user roles from Nostr:', error);
  }

  return roles;
}

// Action handlers
interface AdminActionData {
  pubkey?: string;
}

type AddArticlePayload = 
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string, relay: string };

type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
}

async function handleAddEditor(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only admins can add editors
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can add editors', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  return await updateNostrUserSet(context, 'editor-users', pubkey, 'add');
}

async function handleRemoveEditor(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only admins can remove editors
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can remove editors', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  return await updateNostrUserSet(context, 'editor-users', pubkey, 'remove');
}

async function handleAddAdmin(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only admins can add other admins
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can add other admins', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  return await updateNostrUserSet(context, 'admin-users', pubkey, 'add');
}

async function handleRemoveAdmin(context: Context, authResult: AuthResult, data: AdminActionData) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only admins can remove other admins
  if (!authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only admins can remove other admins', 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, 'Pubkey is required', 400);
  }

  // Prevent removing yourself if you're the last admin
  const { adminUsers } = await fetchNostrUserSets(context);
  if (adminUsers.length === 1 && adminUsers.includes(authResult.pubkey)) {
    return ErrorResponse(undefined, 'Cannot remove the last admin', 400);
  }

  return await updateNostrUserSet(context, 'admin-users', pubkey, 'remove');
}

async function handleAddNews(context: Context, authResult: AuthResult, data: AddNewsPayload) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only editors and admins can add news
  if (!authResult.roles.includes('editor') && !authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only editors and admins can add news', 403);
  }

  const { eventId, relay } = data;
  if (!eventId) {
    return ErrorResponse(undefined, 'Event ID is required', 400);
  }

  if (!relay) {
    return ErrorResponse(undefined, 'Relay is required', 400);
  }

  return await addNews(context, data);
}

async function handleAddArticle(context: Context, authResult: AuthResult, data: AddArticlePayload) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, 'Authentication failed', 401);
  }

  // Only editors and admins can add articles
  if (!authResult.roles.includes('editor') && !authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only editors and admins can add articles', 403);
  }

  let aTag: string;
  let relayTag: string;
  // Parse article information from either naddr or individual components
  if (data.type === 'naddr') {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== 'naddr') {
        return ErrorResponse(undefined, 'Invalid naddr format', 400);
      }
      
      const { kind, pubkey, identifier, relays } = decoded.data;
      aTag = `${kind}:${pubkey}:${identifier}`;

      if (!relays || relays.length === 0) {
        return ErrorResponse(undefined, 'relay is empty for naddr', 400);
      }

      relayTag = relays[0];
    } catch (error) {
      return ErrorResponse(undefined, 'Failed to decode naddr', 400);
    }
  } else if (data.type === 'a') {
    aTag = data.a;
    relayTag = data.relay;
  } else {
    return ErrorResponse(undefined, 'Either naddr or a tag is required', 400);
  }

  // Validate a tag format
  const aTagParts = aTag.split(':');
  if (aTagParts.length !== 3) {
    return ErrorResponse(undefined, 'Invalid a tag format. Must be kind:pubkey:identifier', 400);
  }

  return await addArticle(context, data);
}

/**
 * Update Nostr user set (admin-users or editor-users)
 */
async function updateNostrUserSet(
  context: Context, 
  setType: 'admin-users' | 'editor-users', 
  pubkey: string, 
  operation: 'add' | 'remove'
): Promise<Response> {
  try {
    const masterPrivateKey = context.env.MASTER_ADMIN_PRIVATEKEY;
    if (!masterPrivateKey) {
      return ErrorResponse(undefined, 'Master admin private key not configured', 500);
    }

    // Fetch current user set
    const pool = new SimplePool();
    const currentEvents: NostrEvent[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout fetching ${setType} set`));
      }, 10000);

      pool.subscribeManyEose(ADMIN_RELAYS, [
        {
          authors: [MASTER_ADMIN_PUBKEY],
          kinds: [30000],
          "#d": [setType],
          limit: 1
        }
      ], {
        onevent(evt) {
          currentEvents.push(evt);
        },
        onclose() {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    pool.close(ADMIN_RELAYS);

    // Get existing users
    let existingUsers: string[] = [];
    if (currentEvents.length > 0) {
      const latestEvent = currentEvents.sort((a, b) => b.created_at - a.created_at)[0];
      existingUsers = latestEvent.tags
        .filter((tag: string[]) => tag[0] === 'p')
        .map((tag: string[]) => tag[1])
        .filter(Boolean);
    }

    // Update user list
    let updatedUsers: string[];
    if (operation === 'add') {
      if (existingUsers.includes(pubkey)) {
        return ErrorResponse(undefined, `User already exists in ${setType}`, 400);
      }
      updatedUsers = [...existingUsers, pubkey];
    } else {
      updatedUsers = existingUsers.filter(p => p !== pubkey);
    }

    // Create new event
    const eventTemplate = {
      kind: 30000,
      pubkey: MASTER_ADMIN_PUBKEY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', setType],
        ...updatedUsers.map(user => ['p', user])
      ],
      content: ''
    };

    // Sign and publish
    const signedEvent = finalizeEvent(eventTemplate, hexToBytes(masterPrivateKey));
    
    const publishPool = new SimplePool();
    const publishPromises = ADMIN_RELAYS.map(relay => 
      publishPool.publish([relay], signedEvent)
    );

    await Promise.allSettled(publishPromises);
    publishPool.close(ADMIN_RELAYS);

    const actionText = operation === 'add' ? 'added to' : 'removed from';
    return SuccessResponse({ 
      message: `User ${actionText} ${setType} successfully`, 
      pubkey,
      setType,
      operation,
      totalUsers: updatedUsers.length
    });

  } catch (error) {
    console.error(`Error updating ${setType}:`, error);
    return ErrorResponse(error, `Failed to update ${setType}`);
  }
}

async function addNews(context: Context, data: AddNewsPayload) {
  const masterPrivateKey = context.env.MASTER_ADMIN_PRIVATEKEY;
  
  if (!masterPrivateKey) {
    return ErrorResponse(undefined, 'Master admin private key not configured', 500);
  }

  const currentEvent: NostrEvent | null = await pool.get(ADMIN_RELAYS, {
    authors: [MASTER_ADMIN_PUBKEY],
    kinds: [30004],
    "#d": ["news"],
    limit: 1
  });
  
  if (!currentEvent) {
    return ErrorResponse(undefined, 'News set not found', 404);
  }

  const eventTemplate = {
    kind: 30004,
    pubkey: MASTER_ADMIN_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ...currentEvent.tags,
      ['e', data.eventId, data.relay]
    ],
    content: ''
  };

  const signedEvent = finalizeEvent(eventTemplate, hexToBytes(masterPrivateKey));

  pool.publish(ADMIN_RELAYS, signedEvent);

  return SuccessResponse({
    message: 'News added successfully',
    eventId: signedEvent.id
  });
}

async function addArticle(context: Context, data: AddArticlePayload) {
  const masterPrivateKey = context.env.MASTER_ADMIN_PRIVATEKEY;
  
  if (!masterPrivateKey) {
    return ErrorResponse(undefined, 'Master admin private key not configured', 500);
  }

  let aTag: string;
  let relayTag: string;

  if (data.type === 'naddr') {
    const decoded = nip19.decode(data.naddr);
    
    if (decoded.type !== 'naddr') {
      return ErrorResponse(undefined, 'Invalid naddr format', 400);
    }

    const { kind, pubkey, identifier, relays } = decoded.data;
    
    aTag = `${kind}:${pubkey}:${identifier}`;

    if (!relays || relays.length === 0) {
      return ErrorResponse(undefined, 'relay is empty for naddr', 400);
    }

    relayTag = relays[0];
  } else if (data.type === 'a') {
    aTag = data.a;
    relayTag = data.relay;
  } else {
    return ErrorResponse(undefined, 'Either naddr or a tag is required', 400);
  }

  const currentEvent: NostrEvent | null = await pool.get(ADMIN_RELAYS, {
    authors: [MASTER_ADMIN_PUBKEY],
    kinds: [30004],
    "#d": ["articles"],
    limit: 1
  });

  if (!currentEvent) {
    return ErrorResponse(undefined, 'Article set not found', 404);
  }

  const eventTemplate = {
    kind: 30004,
    pubkey: MASTER_ADMIN_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ...currentEvent.tags,
      ['a', aTag, relayTag]
    ],
    content: ''
  };

  const signedEvent = finalizeEvent(eventTemplate, hexToBytes(masterPrivateKey));

  pool.publish(ADMIN_RELAYS, signedEvent);

  return SuccessResponse({
    message: 'Article added successfully',
    aTag,
    relayTag,
    eventId: signedEvent.id
  });
}