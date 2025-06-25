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