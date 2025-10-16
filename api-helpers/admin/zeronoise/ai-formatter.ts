import type { RedisClient } from "../../common.js";

import type { ZeronoiseNewsItem, FormattedNewsItem } from "./types.js";

const AI_CACHE_PREFIX = "zeronoise:ai:";
const AI_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days

export async function formatNewsItem(
  redis: RedisClient,
  item: ZeronoiseNewsItem,
  messageId: string,
): Promise<FormattedNewsItem> {
  // Check cache first
  const cacheKey = `${AI_CACHE_PREFIX}${messageId}:${item.index}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // If parsing fails, continue with fresh formatting
    }
  }

  // Build prompt from .cursor/rules/zeronoise-haber-yazma.mdc
  const prompt = buildFormattingPrompt(item);

  // Call AI service (using Google Cloud Translate for now)
  const formatted = await callAIService(prompt, item);

  // Cache result
  try {
    await redis.set(cacheKey, JSON.stringify(formatted), {
      expiration: { type: "EX", value: AI_CACHE_TTL },
    });
  } catch {
    // Ignore cache errors
  }

  return formatted;
}

function buildFormattingPrompt(item: ZeronoiseNewsItem): string {
  return `Bu dokümanı aşağıdaki kuralları uygulayarak bitcoinsondakika.com'da yayınlanacak bir yazı formatında yeniden yaz.

KURALLAR:
- Markdown formatında değil, düz yazı formatında yaz.
- Kaynaklara girerek yazının doğruluğunu kontrol et. İçerikte linkler varsa web araması yaparak bu linklerin içeriğini kontrol et ve doğruluğunu teyit et.
- Etiketleri gözden geçir. Bize verilen etiketleri kullan, eğer yoksa eklenmesi gereken etiketleri belirt: "abd, afrika, altcoin, analiz, asya, avusturya, banka, benimsenme, bitcoin, blogging, ekonomi, enerji, finans, geliştirme, girisimcilik, haber, haber, hiperenflasyon, kagit-para, lightning, madencilik, mining, mulkiyet-haklari, nostr, odeme, para-tarihi, piyasa, podcast, politika, regülasyon, regulasyon, savas, savas-finansmani, tarih, teknoloji, tether, guney-amerika"

- İlk başlık özel. Sitede zaten koyu ve büyük bir biçimde gösteriyoruz o yüzden tüm harflerin büyük olmasına gerek yok. Örnek: "ABD Senatöründen Bitcoin Önerisi" ✓, "ABD SENATÖRÜNDEN BİTCOİN ÖNERİSİ" ✗

- Sonraki başlıkları BÜYÜK HARF yapmamız, emoji eklememiz gerekiyor çünkü bu sayede düz yazı içinde orta başlıklarda ayırt etme sağlayabiliriz. Örnek: "💰 TASARININ DETAYLARI" veya "⚡ LIGHTNING NETWORK"

- 2-3 cümlelik bir özete ihtiyacımız var. Bu özet bilgi vermekten daha çok merak uyandırıp kullanıcıyı habere tıklamaya teşvik etmeli. Bu özet haberin kendisinden ayrı olarak tutuluyor ve [Devamını Oku] gibi bir butonla kalan haber metni görünür oluyor.

- Citation'ları yazının kendisinden çıkar, ama onun yerine "A kişisine göre böyle" gibi cümlelerin içine yedirebilirsin.
- Kaynaklarda olup da eklenebilecek şeyleri ekle.
- Terimlerle ilgili eksik bilgi varsa, eğer tek cümlede açıklanabilirse açıkla. Eğer daha uzunsa yeni bir paragrafta açıkla, konuya devam et.
- En sonda KAYNAKLAR: yazıp, bir boş satır ekleyip, altına kaynakları düz URL olarak alt alta ekle.

HAM İÇERİK:
${item.content}

ÇIKTI FORMATI: JSON
{
  "title": "...",
  "summary": "...",
  "content": "...",
  "tags": ["bitcoin", "abd", ...]
}`;
}

async function callAIService(prompt: string, item: ZeronoiseNewsItem): Promise<FormattedNewsItem> {
  const apiKey = process.env.PPQ_API_KEY;

  if (!apiKey) {
    throw new Error("PPQ_API_KEY is not set");
  }

  const response = await fetch("https://api.ppq.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash-001",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Başlık: " + item.title + "\n\nHam içerik: " + item.content },
      ],
      tools: [
        {
          type: "web_search",
          web_search: {
            search_depth: "basic",
          },
        },
      ],
      tool_choice: "auto",
    }),
  });

  const data = await response.json();

  console.log(data);

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response from AI service");
  }

  const content = data.choices[0].message.content;

  return {
    title: item.title,
    summary: "",
    content,
    image: "",
    tags: [],
  };
}
