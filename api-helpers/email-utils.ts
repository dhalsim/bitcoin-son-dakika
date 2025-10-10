/**
 * Utility functions for email subscription management
 */

import { WEBSITE_URL } from "../src/lib/constants.js";

/**
 * Generate an unsubscribe link for an email
 * @param unsubscribeToken - The unique token for the subscription
 * @param baseUrl - The base URL of the website (defaults to current domain)
 * @returns The unsubscribe URL
 */
export function generateUnsubscribeLink(
  unsubscribeToken: string,
  baseUrl: string = WEBSITE_URL,
): string {
  return `${baseUrl}/api/email-subscription?token=${encodeURIComponent(unsubscribeToken)}`;
}

/**
 * Generate unsubscribe HTML for email templates
 * @param unsubscribeToken - The unique token for the subscription
 * @param baseUrl - The base URL of the website
 * @param email - The subscriber's email address
 * @returns HTML string with unsubscribe link
 */
export function generateUnsubscribeHtml(
  unsubscribeToken: string,
  baseUrl: string = WEBSITE_URL,
  email: string,
): string {
  const unsubscribeUrl = generateUnsubscribeLink(unsubscribeToken, baseUrl);

  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      <p>
        Bu e-postayı ${email} adresine gönderdik çünkü Bitcoin Son Dakika bültenimize abone oldunuz.
      </p>
      <p style="margin-top: 10px;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
          Abonelikten çıkmak için tıklayın
        </a>
      </p>
    </div>
  `;
}

/**
 * Generate unsubscribe text for plain text emails
 * @param unsubscribeToken - The unique token for the subscription
 * @param baseUrl - The base URL of the website
 * @param email - The subscriber's email address
 * @returns Plain text unsubscribe information
 */
export function generateUnsubscribeText(
  unsubscribeToken: string,
  baseUrl: string = WEBSITE_URL,
  email: string,
): string {
  const unsubscribeUrl = generateUnsubscribeLink(unsubscribeToken, baseUrl);

  return `
---
Bu e-postayı ${email} adresine gönderdik çünkü Bitcoin Son Dakika bültenimize abone oldunuz.

Abonelikten çıkmak için: ${unsubscribeUrl}
  `.trim();
}
