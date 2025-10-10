import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function sendEmailCampaign() {
  try {
    const frequency = process.argv[2] || "daily"; // daily or weekly
    const subject = process.argv[3] || "Bitcoin Son Dakika - Günlük Bülten";

    if (!frequency || (frequency !== "daily" && frequency !== "weekly")) {
      console.error("Usage: node send-email-campaign.mjs [daily|weekly] [subject]");
      process.exit(1);
    }

    // Example HTML content - you can customize this
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Bitcoin Son Dakika</h1>
        <h2 style="color: #1f2937;">${frequency === "daily" ? "Günlük" : "Haftalık"} Bitcoin Haberleri</h2>
        
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

    // Example text content
    const textContent = `
Bitcoin Son Dakika
${frequency === "daily" ? "Günlük" : "Haftalık"} Bitcoin Haberleri

Son Dakika Haberler
Bitcoin fiyatı ve piyasa gelişmeleri hakkında güncel bilgiler...

Analiz ve Yorumlar
Uzmanların Bitcoin piyasası hakkındaki görüşleri...

Tüm haberleri görüntülemek için: https://bitcoinsondakika.com
    `.trim();

    const response = await fetch("https://bitcoinsondakika.com/api/email-subscription", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Email campaigns completed successfully!");
      console.log(
        `📅 Day of week: ${result.dayOfWeek} (${result.isMonday ? "Monday" : "Not Monday"})`,
      );
      console.log(
        `📊 Summary - Sent: ${result.summary.totalSent}, Failed: ${result.summary.totalFailed}, Total: ${result.summary.totalSubscribers}`,
      );

      console.log("\n📧 Daily emails:");
      console.log(
        `  Sent: ${result.results.daily.sent}, Failed: ${result.results.daily.failed}, Total: ${result.results.daily.total}`,
      );

      console.log("\n📧 Weekly emails:");
      console.log(
        `  Sent: ${result.results.weekly.sent}, Failed: ${result.results.weekly.failed}, Total: ${result.results.weekly.total}`,
      );

      if (result.results.daily.errors && result.results.daily.errors.length > 0) {
        console.log("\n❌ Daily email errors:");
        result.results.daily.errors.forEach((error) => console.log(`  - ${error}`));
      }

      if (result.results.weekly.errors && result.results.weekly.errors.length > 0) {
        console.log("\n❌ Weekly email errors:");
        result.results.weekly.errors.forEach((error) => console.log(`  - ${error}`));
      }
    } else {
      console.error("❌ Email campaign failed:", result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error sending email campaign:", error);
    process.exit(1);
  }
}

sendEmailCampaign();
