import React from 'react';
import { renderToString } from 'react-dom/server';
import { authenticateNIP98, getUserRoles, ErrorResponse, SuccessResponse, CorsResponse } from './utils';
import { Context } from './types';
import { AdminPanel, LoginPage, clientScript } from '../src/server/admin';

export async function onRequestGet(context: Context) {
  try {
    const authResult = await authenticateNIP98(context.request, context, ['admin', 'editor']);
    
    if (!authResult.success) {
      // Show login page if not authenticated
      const loginHtml = renderToString(React.createElement(LoginPage));
      
      return new Response(
        `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yönetim Paneli - Bitcoin Son Dakika</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="/build/client/assets/index.css" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
  <div id="root">${loginHtml}</div>
  <script>
    // Initialize Lucide icons
    lucide.createIcons();
    
    ${clientScript}
  </script>
  <script src="/window.nostr.js"></script>
</body>
</html>`,
        {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Get user roles and prepare user data
    const [adminUsers, editorUsers] = await Promise.all([
      getUserRoles(context, 'admin'),
      getUserRoles(context, 'editor')
    ]);

    const userData = {
      pubkey: authResult.pubkey,
      roles: authResult.roles,
      adminUsers,
      editorUsers
    };

    // Render admin panel with user data
    const adminHtml = renderToString(React.createElement(AdminPanel, { userData }));

    return new Response(
      `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yönetim Paneli - Bitcoin Son Dakika</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="/build/client/assets/index.css" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
  <div id="root">${adminHtml}</div>
  <script>
    // Initialize Lucide icons
    lucide.createIcons();
    
    ${clientScript}
  </script>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );

  } catch (error) {
    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return CorsResponse();
} 