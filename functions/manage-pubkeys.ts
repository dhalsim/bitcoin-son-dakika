import { Context } from "./types";
import { ErrorResponse } from "./utils";

export async function onRequestPost(context: Context) {
  try {
    const body = await context.request.json();
    const { action, pubkey } = body;

    if (!action || !pubkey) {
      return ErrorResponse(undefined, 'Missing action or pubkey', 400);
    }

    // Get current pubkeys
    const currentPubkeys = await context.env.EDITOR_PUBKEYS.get('pubkeys');
    let pubkeysArray: string[] = [];
    
    if (currentPubkeys) {
      try {
        pubkeysArray = JSON.parse(currentPubkeys);
      } catch (error) {
        return ErrorResponse(error, 'Error parsing current pubkeys', 500);
      }
    }

    if (action === 'add') {
      if (!pubkeysArray.includes(pubkey)) {
        pubkeysArray.push(pubkey);
        await context.env.EDITOR_PUBKEYS.put('pubkeys', JSON.stringify(pubkeysArray));
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Pubkey added successfully',
        pubkeys: pubkeysArray
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else if (action === 'remove') {
      const index = pubkeysArray.indexOf(pubkey);
      if (index > -1) {
        pubkeysArray.splice(index, 1);
        await context.env.EDITOR_PUBKEYS.put('pubkeys', JSON.stringify(pubkeysArray));
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Pubkey removed successfully',
        pubkeys: pubkeysArray
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else {
      return ErrorResponse(undefined, 'Invalid action. Use "add" or "remove"', 400);
    }
  } catch (error) {
    return ErrorResponse(error, 'Error processing request', 500);
  }
}

// Get current pubkeys
export async function onRequestGet(context: Context) {
  try {
    const currentPubkeys = await context.env.EDITOR_PUBKEYS.get('pubkeys');
    let pubkeysArray: string[] = [];
    
    if (currentPubkeys) {
      try {
        pubkeysArray = JSON.parse(currentPubkeys);
      } catch (error) {
        return ErrorResponse(error, 'Error parsing current pubkeys', 500);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      pubkeys: pubkeysArray
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return ErrorResponse(error, 'Error retrieving pubkeys', 500);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 