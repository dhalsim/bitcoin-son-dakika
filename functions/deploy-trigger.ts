import { verifyEvent, Event } from 'nostr-tools/pure';
import { ErrorResponse } from './utils';

interface Context {
  request: Request;
  env: {
    EDITOR_PUBKEYS: { get: (key: string) => Promise<string | null> };
  };
}

export async function onRequestPost(context: Context) {
  try {
    // Get the Authorization header
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Nostr ')) {
      return ErrorResponse(undefined, 'Missing or invalid Authorization header', 401);
    }

    // Parse the Nostr event from the Authorization header
    let nostrEvent: Event;
    try {
      const eventBase64 = authHeader.slice(6); // Remove 'Nostr ' prefix
      const eventJson = atob(eventBase64);
      nostrEvent = JSON.parse(eventJson);
    } catch (error) {
      return ErrorResponse(error, 'Invalid Nostr event format', 401);
    }

    // Verify the event signature
    if (!verifyEvent(nostrEvent)) {
      return ErrorResponse(undefined, 'Invalid event signature', 401);
    }

    // Check if the pubkey is authorized in KV store
    const authorizedPubkeys = await context.env.EDITOR_PUBKEYS.get('pubkeys');
    let pubkeysArray: string[] = [];
    
    if (authorizedPubkeys) {
      try {
        pubkeysArray = JSON.parse(authorizedPubkeys);
      } catch (error) {
        return ErrorResponse(error, 'Error parsing authorized pubkeys');
      }
    }

    if (!pubkeysArray.includes(nostrEvent.pubkey)) {
      return ErrorResponse(undefined, 'Unauthorized pubkey', 403);
    }

    // Verify the event is for the correct URL and method (NIP-98)
    const urlTag = nostrEvent.tags.find(tag => tag[0] === 'u');
    const methodTag = nostrEvent.tags.find(tag => tag[0] === 'method');
    
    if (!urlTag || !methodTag || methodTag[1] !== 'POST') {
      return ErrorResponse(undefined, 'Invalid NIP-98 auth event', 401);
    }

    // Check if the event is not too old (within 10 minutes)
    const eventTime = nostrEvent.created_at;
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 10 * 60; // 10 minutes

    if (currentTime - eventTime > maxAge) {
      return ErrorResponse(undefined, 'Auth event is too old', 401);
    }

    // All checks passed, trigger the deployment
    const deployHookUrl = 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/b504e75c-7d2d-44e4-853e-d3c754a2a955';
    
    const response = await fetch(deployHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Deploy hook triggered successfully',
        status: response.status,
        authorizedBy: nostrEvent.pubkey
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      return ErrorResponse(undefined, 'Failed to trigger deploy hook', response.status);
    }
  } catch (error) {
    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
} 
