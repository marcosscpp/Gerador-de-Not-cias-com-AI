import axios, { AxiosError } from "axios";
import { loggerError } from "@/config/logger";

interface PostData {
  title: string;
  content: string;
  status?: "publish" | "draft" | "pending" | "private";
  categories?: number[];
  tags?: number[];
  featuredImageUrl?: string;
  [key: string]: any;
}

type DefaultStatus = "publish" | "draft" | "pending" | "private";

class WordpressPostCreator {
  private apiUrl: string;
  private username: string;
  private appPassword: string;
  private mediaUrl: string;
  private defaultStatus: "publish" | "draft" | "pending" | "private";

  constructor(
    apiUrl: string,
    username: string,
    appPassword: string,
    defaultStatus: DefaultStatus = "publish"
  ) {
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
  private async uploadFeaturedImage(imageUrl: string): Promise<any | null> {
    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(imageResponse.data, "binary");

      const filename = imageUrl.split("/").pop() || "featured-image.jpg";

      const uploadResponse = await axios.post(this.mediaUrl, buffer, {
        headers: {
          "Content-Type": imageResponse.headers["content-type"] || "image/jpeg",
          "Content-Disposition": `attachment; filename="${filename}"`,
          Authorization:
            "Basic " +
            Buffer.from(`${this.username}:${this.appPassword}`).toString(
              "base64"
            ),
        },
      });

      return uploadResponse.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      loggerError.error(`Falha ao fazer upload da imagem destacada`, {
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
  async createPost(postData: PostData): Promise<any> {
    const {
      title,
      content,
      status = this.defaultStatus,
      categories = [],
      tags = [],
      featuredImageUrl,
      ...rest
    } = postData;

    let featured_media: number | undefined;

    if (featuredImageUrl) {
      try {
        const mediaResponse = await this.uploadFeaturedImage(featuredImageUrl);
        if (mediaResponse) {
          featured_media = mediaResponse.id;
        }
      } catch (error) {
        loggerError.error(
          `Falha ao processar imagem destacada, continuando sem ela`,
          {
            title,
            imageUrl: featuredImageUrl,
            error: error instanceof Error ? error.message : String(error),
          }
        );
      }
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          title,
          content,
          status,
          categories,
          tags,
          ...(featured_media && { featured_media }),
          ...rest,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic " +
              Buffer.from(`${this.username}:${this.appPassword}`).toString(
                "base64"
              ),
          },
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data || axiosError.message;
      throw new Error(`Falha ao criar post no WordPress: ${errorMessage}`);
    }
  }
}

export default WordpressPostCreator;
