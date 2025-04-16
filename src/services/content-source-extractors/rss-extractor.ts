import axios from "axios";
// @ts-ignore
import xml2js from "xml2js";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  publicationDate: string;
  author: string;
  content: string;
  imageUrl?: string[];
}

interface RssChannelItem {
  title?: string;
  link?: string;
  description?: string;
  summary?: string;
  pubdate?: string;
  pubDate?: string;
  author?: string;
  "dc:creator"?: string;
  "content:encoded"?: string;
}

interface RssChannel {
  item: RssChannelItem | RssChannelItem[];
}

interface RssResponse {
  rss?: {
    channel: RssChannel;
  };
}

class RssExtractor {
  parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      normalize: true,
      normalizeTags: true,
    });
  }

  /**
   * Extracts News from an RSS Feed
   * @param {string} url - RSS Feed URL
   * @returns {Promise<NewsItem[]>} - Array of News Items
   */
  async extractNews(url: string): Promise<NewsItem[]> {
    try {
      let news: NewsItem[] = [];

      const response = await axios.get(url);
      const result: RssResponse = await this.parser.parseStringPromise(
        response.data
      );
      if (result.rss) {
        const channel = result.rss.channel;
        news = this.processRSS(channel);
        return news;
      } else {
        throw new Error("O formato do feed não foi reconhecido");
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Processes feeds in RSS format
   * @param {RssChannel} channel - RSS Channel
   * @returns {NewsItem[]} - Array with extracted news
   */
  processRSS(channel: RssChannel): NewsItem[] {
    const news: NewsItem[] = [];
    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    for (const item of items) {
      if (!item) continue;

      const description = item.description || item.summary || "";
      const imageUrl = this.extractImageUrls(description);

      news.push({
        title: item.title || "Sem Titulo",
        link: item.link || "",
        description: description,
        imageUrl: imageUrl,
        publicationDate: item.pubdate || item.pubDate || "",
        author: item.author || (item["dc:creator"] ? item["dc:creator"] : ""),
        content: item["content:encoded"] || "",
      });
    }
    return news;
  }

  /**
   * Extracts all image URLs from an HTML string containing <img> tags
   * @param {string} html - HTML string that may contain img tags
   * @returns {string[]} - Array of extracted image URLs, or empty array if none found
   */
  extractImageUrls(html: string): string[] {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const matches = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }
}

export default RssExtractor;
