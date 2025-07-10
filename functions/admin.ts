import { authenticateNIP98, getUserRoles, ErrorResponse, SuccessResponse, CorsResponse, getUsersByRole } from './utils';
import { Context } from './types';
import { SimplePool, finalizeEvent, nip19, NostrEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

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
      case 'add-article':
        return handleAddArticle(context, authResult, data);
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

type AddArticlePayload = 
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string };

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

async function handleAddArticle(context: Context, authResult: AuthResult, data: AddArticlePayload) {
  // Only editors and admins can add articles
  if (!authResult.roles.includes('editor') && !authResult.roles.includes('admin')) {
    return ErrorResponse(undefined, 'Only editors and admins can add articles', 403);
  }

  let aTag: string;

  // Parse article information from either naddr or individual components
  if (data.type === 'naddr') {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== 'naddr') {
        return ErrorResponse(undefined, 'Invalid naddr format', 400);
      }
      
      const { kind, pubkey, identifier } = decoded.data;
      aTag = `${kind}:${pubkey}:${identifier}`;
    } catch (error) {
      return ErrorResponse(undefined, 'Failed to decode naddr', 400);
    }
  } else if (data.type === 'a') {
    aTag = data.a;
  } else {
    return ErrorResponse(undefined, 'Either naddr or a tag is required', 400);
  }

  // Validate a tag format
  const aTagParts = aTag.split(':');
  if (aTagParts.length !== 3) {
    return ErrorResponse(undefined, 'Invalid a tag format. Must be kind:pubkey:identifier', 400);
  }

  try {
    // Get MASTER_ADMIN_PRIVATEKEY from environment
    const masterPrivateKey = context.env.MASTER_ADMIN_PRIVATEKEY;
    if (!masterPrivateKey) {
      return ErrorResponse(undefined, 'Master admin private key not configured', 500);
    }

    // Import from utils where ADMIN_RELAYS and MASTER_ADMIN_PUBKEY are defined
    const { ADMIN_RELAYS, MASTER_ADMIN_PUBKEY } = await import('./utils');
    
    // Fetch current articles set from Nostr relays
    const pool = new SimplePool();
    const currentArticleEvents: NostrEvent[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout fetching current articles'));
      }, 10000);

      pool.subscribeManyEose(ADMIN_RELAYS, [
        {
          authors: [MASTER_ADMIN_PUBKEY],
          kinds: [30004],
          "#d": ["articles"],
          limit: 1
        }
      ], {
        onevent(evt) {
          currentArticleEvents.push(evt);
        },
        onclose() {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    pool.close(ADMIN_RELAYS);

    // Get existing articles
    let existingArticles: string[] = [];
    if (currentArticleEvents.length > 0) {
      const latestEvent = currentArticleEvents.sort((a, b) => b.created_at - a.created_at)[0];
      existingArticles = latestEvent.tags
        .filter((tag: string[]) => tag[0] === 'a')
        .map((tag: string[]) => tag[1])
        .filter(Boolean);
    }

    // Check if article already exists
    if (existingArticles.includes(aTag)) {
      return ErrorResponse(undefined, 'Article already exists in the set', 400);
    }

    // Create new event with updated articles set
    const newArticles = [...existingArticles, aTag];
    const eventTemplate = {
      kind: 30004,
      pubkey: MASTER_ADMIN_PUBKEY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', 'articles'],
        ...newArticles.map(article => ['a', article])
      ],
      content: ''
    };

    // Sign the event using finalizeEvent
    const signedEvent = finalizeEvent(eventTemplate, hexToBytes(masterPrivateKey));

    // Publish to relays
    const publishPool = new SimplePool();
    const publishPromises = ADMIN_RELAYS.map(relay => 
      publishPool.publish([relay], signedEvent)
    );

    await Promise.allSettled(publishPromises);
    publishPool.close(ADMIN_RELAYS);

    return SuccessResponse({ 
      message: 'Article added successfully', 
      aTag,
      addedBy: authResult.pubkey,
      totalArticles: newArticles.length
    });

  } catch (error) {
    console.error('Error adding article:', error);
    return ErrorResponse(error, 'Failed to add article');
  }
} 