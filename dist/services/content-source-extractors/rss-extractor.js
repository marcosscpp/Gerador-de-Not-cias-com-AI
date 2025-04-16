"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = __importDefault(require("xml2js"));
class RssExtractor {
    constructor() {
        this.parser = new xml2js_1.default.Parser({
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
    async extractNews(url) {
        try {
            let news = [];
            const response = await axios_1.default.get(url);
            const result = await this.parser.parseStringPromise(response.data);
            if (result.rss) {
                const channel = result.rss.channel;
                news = this.processRSS(channel);
                return news;
            }
            else {
                throw new Error("O formato do feed não foi reconhecido");
            }
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Processes feeds in RSS format
     * @param {RssChannel} channel - RSS Channel
     * @returns {NewsItem[]} - Array with extracted news
     */
    processRSS(channel) {
        const news = [];
        const items = Array.isArray(channel.item) ? channel.item : [channel.item];
        for (const item of items) {
            if (!item)
                continue;
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
    extractImageUrls(html) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        const matches = [];
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
}
exports.default = RssExtractor;
