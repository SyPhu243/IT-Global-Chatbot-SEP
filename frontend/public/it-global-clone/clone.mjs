import scrape from "website-scraper";

console.log("⏳ Đang quét và tải toàn bộ website it-global.net...");

await scrape({
  urls: ["https://it-global.net/"],
  directory: "./site",
  recursive: true,
  maxRecursiveDepth: 3,
  urlFilter: (url) => url.startsWith("https://it-global.net"),
  request: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    }
  }
});

console.log("✅ Xong! Toàn bộ website đã nằm gọn trong thư mục C:\\it-global-clone\\site");
