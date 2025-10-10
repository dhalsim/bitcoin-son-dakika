import { randomBytes } from "crypto";

import { createClient } from "@libsql/client";
import nodemailer from "nodemailer";

import { ErrorResponseCreator, SuccessResponse } from "../api-helpers/common_with_client.js";
import { generateUnsubscribeLink } from "../api-helpers/email-utils.js";

// Initialize Turso client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface EmailSubscriptionRequest {
  email: string;
  daily: boolean;
  weekly: boolean;
}

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

// Initialize nodemailer transporter for Resend SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 2465,
  secure: true, // Use TLS
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

// Helper function to send email campaign
async function sendEmailCampaign(frequency: "daily" | "weekly", subject: string) {
  try {
    // Get subscribers based on frequency
    const frequencyColumn = frequency === "daily" ? "daily_notifications" : "weekly_notifications";

    const subscribers = await turso.execute({
      sql: `
        SELECT id, email, unsubscribe_token 
        FROM email_subscriptions 
        WHERE active = 1 AND ${frequencyColumn} = 1
      `,
    });

    if (subscribers.rows.length === 0) {
      return {
        message: `No subscribers found for ${frequency} frequency`,
        sent: 0,
        failed: 0,
        total: 0,
      };
    }

    // Generate email content based on frequency
    const { htmlContent, textContent } = generateEmailContent(frequency);

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send emails to each subscriber
    for (const subscriber of subscribers.rows) {
      try {
        const unsubscribeLink = generateUnsubscribeLink(subscriber.unsubscribe_token as string);

        // Add unsubscribe link to content
        const htmlWithUnsubscribe =
          htmlContent +
          `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>Bu e-postayı ${subscriber.email} adresine gönderdik çünkü Bitcoin Son Dakika bültenimize abone oldunuz.</p>
            <p style="margin-top: 10px;">
              <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">
                Abonelikten çıkmak için tıklayın
              </a>
            </p>
          </div>
        `;

        const textWithUnsubscribe =
          textContent +
          `
---
Bu e-postayı ${subscriber.email} adresine gönderdik çünkü Bitcoin Son Dakika bültenimize abone oldunuz.

Abonelikten çıkmak için: ${unsubscribeLink}
        `.trim();

        await transporter.sendMail({
          from: `"Bitcoin Son Dakika" <noreply@bitcoinsondakika.com>`,
          to: subscriber.email as string,
          subject: subject,
          html: htmlWithUnsubscribe,
          text: textWithUnsubscribe,
        });

        sentCount++;
      } catch (error) {
        failedCount++;
        errors.push(
          `Failed to send to ${subscriber.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        console.error(`Failed to send email to ${subscriber.email}:`, error);
      }
    }

    return {
      message: `${frequency} email campaign completed`,
      sent: sentCount,
      failed: failedCount,
      total: subscribers.rows.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error(`Error in ${frequency} email campaign:`, error);

    return {
      message: `Error in ${frequency} email campaign`,
      sent: 0,
      failed: 0,
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Generate email content based on frequency
function generateEmailContent(frequency: "daily" | "weekly") {
  const isWeekly = frequency === "weekly";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Bitcoin Son Dakika</h1>
      <h2 style="color: #1f2937;">${isWeekly ? "Haftalık" : "Günlük"} Bitcoin Haberleri</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Son Dakika Haberler</h3>
        <p style="color: #6b7280;">Bitcoin fiyatı ve piyasa gelişmeleri hakkında güncel bilgiler...</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">Analiz ve Yorumlar</h3>
        <p style="color: #78350f;">Uzmanların Bitcoin piyasası hakkındaki görüşleri...</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://bitcoinsondakika.com" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Tüm Haberleri Görüntüle
        </a>
      </div>
    </div>
  `;

  const textContent = `
Bitcoin Son Dakika
${isWeekly ? "Haftalık" : "Günlük"} Bitcoin Haberleri

Son Dakika Haberler
Bitcoin fiyatı ve piyasa gelişmeleri hakkında güncel bilgiler...

Analiz ve Yorumlar
Uzmanların Bitcoin piyasası hakkındaki görüşleri...

Tüm haberleri görüntülemek için: https://bitcoinsondakika.com
  `.trim();

  return { htmlContent, textContent };
}

// Vercel Edge Function handler for GET requests (for unsubscribe links and email campaigns)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // If no token, check if this is a cron job for sending emails
    if (!token) {
      // Authenticate cron job
      if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return ErrorResponseCreator("Unauthorized", 401);
      }

      // Send both daily and weekly emails based on day of week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const results = {
        daily: null as any,
        weekly: null as any,
        summary: {
          totalSent: 0,
          totalFailed: 0,
          totalSubscribers: 0,
        },
      };

      // Always send daily emails
      console.log("Sending daily emails...");
      const dailyResult = await sendEmailCampaign("daily", "Bitcoin Son Dakika - Günlük Bülten");
      results.daily = dailyResult;

      // Send weekly emails only on Mondays (day 1)
      if (dayOfWeek === 1) {
        console.log("Sending weekly emails (Monday)...");
        const weeklyResult = await sendEmailCampaign(
          "weekly",
          "Bitcoin Son Dakika - Haftalık Bülten",
        );
        results.weekly = weeklyResult;
      } else {
        console.log(`Skipping weekly emails (not Monday, today is day ${dayOfWeek})`);
        results.weekly = {
          message: "Weekly emails not sent - not Monday",
          sent: 0,
          failed: 0,
          total: 0,
        };
      }

      // Calculate summary
      results.summary.totalSent = (results.daily?.sent || 0) + (results.weekly?.sent || 0);
      results.summary.totalFailed = (results.daily?.failed || 0) + (results.weekly?.failed || 0);
      results.summary.totalSubscribers = (results.daily?.total || 0) + (results.weekly?.total || 0);

      return SuccessResponse({
        message: "Email campaigns completed",
        dayOfWeek: dayOfWeek,
        isMonday: dayOfWeek === 1,
        results: results,
        summary: results.summary,
      });
    }

    // Original unsubscribe logic

    // Find subscription by token
    const subscription = await turso.execute({
      sql: "SELECT id, email, active FROM email_subscriptions WHERE unsubscribe_token = ?",
      args: [token],
    });

    if (subscription.rows.length === 0) {
      return ErrorResponseCreator("Geçersiz unsubscribe token", 404);
    }

    const subscriptionData = subscription.rows[0];

    // Check if already unsubscribed
    if (subscriptionData.active === 0) {
      return SuccessResponse({
        message: "Bu e-posta adresi zaten abonelikten çıkarılmış",
        email: subscriptionData.email,
        alreadyUnsubscribed: true,
      });
    }

    // Deactivate subscription
    const result = await turso.execute({
      sql: "UPDATE email_subscriptions SET active = 0, updated_at = ? WHERE unsubscribe_token = ?",
      args: [new Date().toISOString(), token],
    });

    if (result.rowsAffected === 0) {
      return ErrorResponseCreator("Abonelikten çıkma işlemi başarısız", 500);
    }

    return SuccessResponse({
      message: "Başarıyla abonelikten çıkarıldınız",
      email: subscriptionData.email,
      unsubscribed: true,
    });
  } catch (error) {
    console.error("Unsubscribe API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";

    return ErrorResponseCreator(errorMessage, 500);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  try {
    const body: EmailSubscriptionRequest = await request.json();
    const { email, daily, weekly } = body;

    // Validation
    if (!email || typeof email !== "string") {
      return ErrorResponseCreator("E-posta adresi gerekli", 400);
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ErrorResponseCreator("Geçerli bir e-posta adresi giriniz", 400);
    }

    // Check if at least one frequency is selected
    if (!daily && !weekly) {
      return ErrorResponseCreator("En az bir bildirim sıklığı seçmelisiniz", 400);
    }

    // Check if email already exists
    const existingSubscription = await turso.execute({
      sql: "SELECT id, active FROM email_subscriptions WHERE email = ?",
      args: [email.toLowerCase()],
    });

    let result;
    let isReactivated = false;

    if (existingSubscription.rows.length > 0) {
      const subscription = existingSubscription.rows[0];

      // If subscription is active, return error
      if (subscription.active === 1) {
        return ErrorResponseCreator("Bu e-posta adresi zaten abone", 409);
      }

      // If subscription is inactive, reactivate it with new settings
      isReactivated = true;
      result = await turso.execute({
        sql: `
          UPDATE email_subscriptions 
          SET daily_notifications = ?, weekly_notifications = ?, active = 1, updated_at = ?
          WHERE email = ?
        `,
        args: [daily ? 1 : 0, weekly ? 1 : 0, new Date().toISOString(), email.toLowerCase()],
      });
    } else {
      // Generate unique unsubscribe token for new subscription
      const unsubscribeToken = generateUnsubscribeToken();

      // Insert new subscription
      result = await turso.execute({
        sql: `
          INSERT INTO email_subscriptions (email, daily_notifications, weekly_notifications, unsubscribe_token, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          email.toLowerCase(),
          daily ? 1 : 0,
          weekly ? 1 : 0,
          unsubscribeToken,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      });
    }

    if (result.rowsAffected === 0) {
      return ErrorResponseCreator("Abonelik işlemi başarısız", 500);
    }

    return SuccessResponse({
      message: isReactivated
        ? "Aboneliğiniz yeniden etkinleştirildi ve ayarlarınız güncellendi"
        : "Başarıyla abone oldunuz",
      subscriptionId: isReactivated
        ? existingSubscription.rows[0].id?.toString()
        : result.lastInsertRowid?.toString(),
      reactivated: isReactivated,
    });
  } catch (error) {
    console.error("Email subscription API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";

    return ErrorResponseCreator(errorMessage, 500);
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
