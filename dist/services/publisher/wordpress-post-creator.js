"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/config/logger");
class WordpressPostCreator {
    constructor(apiUrl, username, appPassword, defaultStatus = "publish") {
        this.apiUrl = apiUrl;
        this.username = username;
        this.appPassword = appPassword;
        this.defaultStatus = defaultStatus;
        this.mediaUrl = apiUrl.replace("/posts", "/media");
    }
    /**
     * Upload an image to WordPress media library
     * @param imageUrl - URL of the image to upload
     * @returns The media object with ID or null if upload fails
     */
    async uploadFeaturedImage(imageUrl) {
        try {
            const imageResponse = await axios_1.default.get(imageUrl, {
                responseType: "arraybuffer",
            });
            const buffer = Buffer.from(imageResponse.data, "binary");
            const filename = imageUrl.split("/").pop() || "featured-image.jpg";
            const uploadResponse = await axios_1.default.post(this.mediaUrl, buffer, {
                headers: {
                    "Content-Type": imageResponse.headers["content-type"] || "image/jpeg",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    Authorization: "Basic " +
                        Buffer.from(`${this.username}:${this.appPassword}`).toString("base64"),
                },
            });
            return uploadResponse.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.loggerError.error(`Falha ao fazer upload da imagem destacada`, {
                imageUrl,
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
            });
            return null;
        }
    }
    /**
     * Create a new post with optional featured image
     * @param postData - The post data
     * @returns The created post data
     */
    async createPost(postData) {
        var _a;
        const { title, content, status = this.defaultStatus, categories = [], tags = [], featuredImageUrl } = postData, rest = __rest(postData, ["title", "content", "status", "categories", "tags", "featuredImageUrl"]);
        let featured_media;
        if (featuredImageUrl) {
            try {
                const mediaResponse = await this.uploadFeaturedImage(featuredImageUrl);
                if (mediaResponse) {
                    featured_media = mediaResponse.id;
                }
            }
            catch (error) {
                logger_1.loggerError.error(`Falha ao processar imagem destacada, continuando sem ela`, {
                    title,
                    imageUrl: featuredImageUrl,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        try {
            const response = await axios_1.default.post(this.apiUrl, Object.assign(Object.assign({ title,
                content,
                status,
                categories,
                tags }, (featured_media && { featured_media })), rest), {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " +
                        Buffer.from(`${this.username}:${this.appPassword}`).toString("base64"),
                },
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            const errorMessage = ((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) || axiosError.message;
            throw new Error(`Falha ao criar post no WordPress: ${errorMessage}`);
        }
    }
}
exports.default = WordpressPostCreator;
