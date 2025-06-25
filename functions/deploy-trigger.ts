export async function onRequestPost() {
  try {
    const deployHookUrl = 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/b504e75c-7d2d-44e4-853e-d3c754a2a955';
    
    // Make the request to the deploy hook
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
        status: response.status
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to trigger deploy hook',
        status: response.status
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error triggering deploy hook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 