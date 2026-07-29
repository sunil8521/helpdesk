/**
 * Scrape.do web scraper client.
 * Proxies requests through Scrape.do to bypass WAF/anti-bot protections.
 * Returns clean markdown text directly.
 */
export async function scrapeUrlWithScrapeDo(
  targetUrl: string
): Promise<{ text: string; title: string }> {
  const token = process.env.SCRAPE_DO_TOKEN;
  if (!token) {
    throw new Error("Missing SCRAPE_DO_TOKEN environment variable");
  }

  const encodedTargetUrl = encodeURIComponent(targetUrl);

  // render=true: handles JS-rendered SPAs
  // output=markdown: returns clean markdown instead of raw HTML
  const apiUrl = `https://api.scrape.do?token=${token}&url=${encodedTargetUrl}&render=true&output=markdown`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "text/plain" },
  });

  if (!response.ok) {
    throw new Error(
      `Scrape.do failed with status ${response.status}: ${response.statusText}`
    );
  }

  const cleanMarkdownText = await response.text();

  // Derive a title from the URL
  const parsedUrl = new URL(targetUrl);
  const derivedTitle = `${parsedUrl.hostname}${parsedUrl.pathname.replace(/\/$/, "")}`;

  return {
    text: cleanMarkdownText,
    title: derivedTitle,
  };
}
