import { TrendingUp, PenTool, Info, Mic } from "lucide-react";
import { Link } from "react-router";

import type { ArticleItem, NewsItem, PodcastItem } from "@/lib/ssg-data";
import { formatNostrDate } from "@/lib/utils";

import { createTitleSlug } from "../../api-helpers/utils";

import { useBitcoinStats } from "../hooks/useBitcoinStats";

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type SidebarProps = {
  news: NewsItem[];
  articles: ArticleItem[];
  podcasts: PodcastItem[];
};

const Sidebar = ({ news, articles, podcasts }: SidebarProps) => {
  const { stats, loading, error } = useBitcoinStats();

  return (
    <aside className="w-full lg:w-80 space-y-6">
      {/* Recent Columns */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center mb-4">
          <PenTool className="h-5 w-5 text-main-accent mr-2" />
          <h3 className="text-lg font-bold text-foreground">Köşe Yazıları</h3>
        </div>

        <div className="space-y-4">
          {articles.map((article, index) => (
            <div key={index} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <h4 className="font-medium text-foreground hover:text-main-accent text-sm leading-snug mb-1">
                <Link to={`/article/${createTitleSlug(article.title)}`}>{article.title}</Link>
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{article.author.display_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatNostrDate(article.publishedAt)}
                </span>
              </div>
            </div>
          ))}
          <a
            href="/articles"
            className="flex items-center text-foreground hover:text-main-accent transition-colors"
          >
            <span className="text-sm font-medium">Tüm Makaleler →</span>
          </a>
        </div>
      </div>

      {/* Trending News */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-main-accent mr-2" />
          <h3 className="text-lg font-bold text-foreground">Gündem</h3>
        </div>

        <div className="space-y-4">
          {news.map((n, index) => (
            <div key={index} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <h4 className="font-medium text-foreground hover:text-main-accent text-sm leading-snug mb-1">
                <Link to={`/news/${createTitleSlug(n.title)}`}>{n.title}</Link>
              </h4>
              <span className="text-xs text-muted-foreground">
                {formatNostrDate(n.publishedAt)}
              </span>
            </div>
          ))}
          <a
            href="/news"
            className="flex items-center text-foreground hover:text-main-accent transition-colors"
          >
            <span className="text-sm font-medium">Tüm Haberler →</span>
          </a>
        </div>
      </div>

      {/* Podcasts */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center mb-4">
          <Mic className="h-5 w-5 text-main-accent mr-2" />
          <h3 className="text-lg font-bold text-foreground">Podcastler</h3>
        </div>

        <div className="space-y-4">
          {podcasts.map((p, index) => (
            <div key={index} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <h4 className="font-medium text-foreground hover:text-main-accent text-sm leading-snug mb-1">
                <Link to={`/podcast/${createTitleSlug(p.title)}`}>{p.title}</Link>
              </h4>
              <span className="text-xs text-muted-foreground">
                {formatNostrDate(p.publishedAt)}
              </span>
            </div>
          ))}
          <a
            href="/podcasts"
            className="flex items-center text-foreground hover:text-main-accent transition-colors"
          >
            <span className="text-sm font-medium">Tüm Podcastler →</span>
          </a>
        </div>
      </div>

      {/* Bitcoin Stats */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
          Bitcoin İstatistikleri
          <span className="text-xs text-muted-foreground font-normal">
            {stats?.lastUpdated
              ? (() => {
                  const secondsAgo = Math.floor(
                    (Date.now() - new Date(stats.lastUpdated).getTime()) / 1000,
                  );

                  return `${secondsAgo} saniye önce`;
                })()
              : "Yükleniyor..."}
          </span>
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">
            Bitcoin istatistikleri yüklenirken hata oluştu.
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Bitcoin Halving Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-foreground">Bitcoin Yarılanması</div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-foreground">
                              🌓 Bitcoin Yarılanması (Halving)
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-2">
                              <p>
                                Bitcoin halving, her 210,000 blokta bir gerçekleşen ve madencilere
                                ödenen Bitcoin miktarını yarıya indiren bir olaydır.
                              </p>
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>Son halving: 2024 Nisan (blok 840,000)</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>Sonraki halving: 2028 Nisan (blok 1,050,000)</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>
                                  Halving sonrası madencilere ödenen miktar 1.5625 BTC'ye düşecek.
                                </span>
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="text-xs text-muted-foreground">Sonraki halving'e kalan</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">{stats.halving.remainingDays}</div>
                  <div className="text-xs text-muted-foreground">gün</div>
                </div>
              </div>

              {/* Halving Progress Bar */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Halving'e Kalan</span>
                  <span>{stats.halving.remainingBlocks.toLocaleString()} blok</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border-1">
                  <div
                    className="bg-green-600 h-full transition-all duration-300"
                    style={{ width: `${stats.halving.progressPercent}%` }}
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  % {stats.halving.progressPercent.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-foreground">Hash Oranı</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">
                            ⚡ Hashrate (Ağ İşlem Gücü)
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                              Hashrate, Bitcoin madencilik ağının saniyede gerçekleştirdiği toplam
                              işlem (hash) sayısını gösterir.
                            </p>
                            <p>Ne kadar yüksekse, ağ o kadar güvenli ve rekabet yoğundur.</p>
                            <div className="space-y-1">
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>
                                  Genellikle EH/s (saniyede exahash) ile ölçülür — yani saniyede
                                  trilyonlarca işlem yapılır.
                                </span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>
                                  Hashrate yükselirse, blok bulmak zorlaşır ve zorluk (difficulty)
                                  artar.
                                </span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span>🔹</span>
                                <span>Düşerse, bloklar daha yavaş bulunur ve zorluk azalır.</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-xs text-muted-foreground">{stats.hashrate.unit}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">{stats.hashrate.value}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-foreground">Zorluk</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">⚒️ Bitcoin Zorluk Ayarı</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                              Bitcoin, her 2.016 blokta bir (~2 hafta), ortalama blok süresini 10
                              dakika civarında tutmak için madencilik zorluğunu otomatik olarak
                              ayarlar.
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>Bloklar çok hızlı kazılıyorsa, zorluk artar.</span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>Bloklar çok yavaş kazılıyorsa, zorluk azalır.</span>
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <div className="font-medium text-foreground">Beklenen Ayar</div>
                  <span className="text-base font-medium text-foreground">
                    <span className="text-xs text-muted-foreground">
                      {new Date(stats.difficulty.estimatedRetargetDate).toLocaleDateString(
                        "tr-TR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}{" "}
                      tarihinde{" "}
                    </span>
                    <span
                      className={`${stats.difficulty.estimatedChange >= 0 ? "text-green-600" : "text-red-600"} font-semibold`}
                    >
                      {stats.difficulty.estimatedChange >= 0 ? "+" : "-"}
                      {Math.abs(stats.difficulty.estimatedChange).toFixed(2)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-foreground">Mempool</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">🚰 Mempool Durumu</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                              Mempool, henüz bloklara eklenmemiş ve onay bekleyen Bitcoin
                              işlemlerinin geçici olarak tutulduğu yerdir.
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Şu anda mempool'da onay bekleyen{" "}
                                <strong>{stats.mempool.count.toLocaleString()}</strong> işlem var.
                              </span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Bu işlemler toplam <strong>{stats.mempool.size} vB</strong> yer
                                kaplıyor ve madencilere ödenecek toplam ücret{" "}
                                <strong>{stats.mempool.totalFee}</strong>.
                              </span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Mempool durumu: <strong>{stats.mempool.status}</strong>. Ücretler
                                yüksek olabilir.
                              </span>
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-xs text-muted-foreground">{stats.mempool.status}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {stats.mempool.count.toLocaleString()} Txs
                </div>
                <div className="text-xs text-muted-foreground">{stats.mempool.size} vB</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-foreground">Önerilen Ücret</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">İşlem Ücreti Tahminleri</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                              Bu tahminler, işleminizin ne kadar sürede onaylanmasını istediğinize
                              göre önerilen işlem ücretleridir (satoshi/vB cinsinden).
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                En hızlı onay (bir sonraki blokta):{" "}
                                <strong>{stats.fees.fastestFee} sat/vB</strong>
                              </span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Yaklaşık 30 dakika içinde onay:{" "}
                                <strong>{stats.fees.halfHourFee} sat/vB</strong>
                              </span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Yaklaşık 1 saat içinde onay:{" "}
                                <strong>{stats.fees.hourFee} sat/vB</strong>
                              </span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span>🔹</span>
                              <span>
                                Ekonomik seviye (uzun bekleme süresi):{" "}
                                <strong>{stats.fees.economyFee} sat/vB</strong>
                              </span>
                            </p>
                            <p>
                              Uygun ücreti seçerken mempool yoğunluğunu ve işleminizin ne kadar acil
                              olduğunu göz önünde bulundurun.
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-xs text-muted-foreground">sat/vB</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">{stats.fees.halfHourFee}</div>
                <div className="text-xs text-muted-foreground">30 dk</div>
              </div>
            </div>

            {/* Enhanced Fee Estimation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-foreground text-sm">Hızlı Onay</div>
                    <div className="text-xs text-muted-foreground">~10 dakika</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground text-sm">
                    {stats.fees.fastestFee} sat/vB
                  </div>
                  <div className="text-xs text-muted-foreground">En yüksek</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-foreground text-sm">30 Dakika</div>
                    <div className="text-xs text-muted-foreground">Önerilen</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground text-sm">
                    {stats.fees.halfHourFee} sat/vB
                  </div>
                  <div className="text-xs text-muted-foreground">Dengeli</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-foreground text-sm">1 Saat</div>
                    <div className="text-xs text-muted-foreground">~60 dakika</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground text-sm">
                    {stats.fees.hourFee} sat/vB
                  </div>
                  <div className="text-xs text-muted-foreground">Düşük</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-foreground text-sm">Ekonomi</div>
                    <div className="text-xs text-muted-foreground">~24 saat</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground text-sm">
                    {stats.fees.economyFee} sat/vB
                  </div>
                  <div className="text-xs text-muted-foreground">En düşük</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Advertisement Placeholder */}
      <div className="bg-muted rounded-lg p-8 text-center border border-border">
        <div className="text-muted-foreground text-sm">REKLAM ALANI</div>
      </div>
    </aside>
  );
};

export default Sidebar;
