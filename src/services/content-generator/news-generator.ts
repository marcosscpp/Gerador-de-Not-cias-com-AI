import OpenAI from "openai";

import {
  ApiKeyError,
  ApiLimitError,
  ContentGenerationError,
  InvalidInputError,
  ModelUnavailableError,
} from "@/utils/errors";
import { loggerError } from "@/config/logger";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  publicationDate: string;
  author: string;
  content: string;
  imageUrl?: string[];
}

export interface NewsGeneratorOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxCharacters?: number;
  basePrompt?: string;
  newsAmount?: number;
  providerUrl?: string;
  batchSize?: number;
}

export interface GeneratedNewsItem {
  title: string;
  content: string;
  image: string;
}

export interface GeneratedNewsResponse {
  news: GeneratedNewsItem[];
}

class NewsGenerator {
  private openai: OpenAI;
  private model: string;
  private temperature: number;
  private providerUrl: string;
  private maxTokens: number;
  private basePrompt: string =
    "Você é um jornalista profissional. Reescreva a seguinte notícias em um formato jornalístico profissional, adicionando um título atrativo, subtítulo e organizando o texto em parágrafos coesos. Mantenha todas as informações importantes mas melhore a estrutura e a apresentação:";
  private maxCharacters: number;
  private newsAmount: number;
  private batchSize: number;

  constructor(options: NewsGeneratorOptions = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY || "";

    if (!apiKey) {
      throw new ApiKeyError();
    }

    this.model = options.model || "gpt-4o-mini";
    this.providerUrl = options.providerUrl || "https://api.openai.com/v1";
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 1500;
    this.basePrompt = options.basePrompt || this.basePrompt;
    this.newsAmount = options.newsAmount || 1;
    this.maxCharacters = options.maxCharacters || 1000;
    this.batchSize = options.batchSize || 4;

    this.openai = new OpenAI({
      baseURL: this.providerUrl,
      apiKey: apiKey,
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Gera uma notícia formatada a partir da descrição fornecida
   * @param newsList Lista de notícias para processar
   * @returns Uma promise que resolve para um objeto JSON com as notícias geradas
   */
  async generateNews(newsList: NewsItem[]): Promise<GeneratedNewsResponse> {
    if (!newsList || newsList.length === 0) {
      throw new InvalidInputError("Lista de notícias vazia ou inválida");
    }

    try {
      const totalNewsRequested = Math.min(this.newsAmount, newsList.length);
      const newsToProcess = newsList.slice(0, totalNewsRequested);
      const batchSize = Math.min(this.batchSize, totalNewsRequested);

      const batches = this.chunkArray(newsToProcess, batchSize);
      const allGeneratedNews: GeneratedNewsItem[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const originalNewsAmount = this.newsAmount;

        try {
          this.newsAmount = batch.length;

          const prompt = this.createPrompt(batch);
          const responseContent = await this.callApiWithPrompt(prompt);
          const batchResult = await this.processApiResponse(responseContent);

          allGeneratedNews.push(...batchResult.news);
        } catch (error) {
          loggerError.error(`Erro ao processar lote ${i + 1}`, {
            batchNumber: i + 1,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        } finally {
          this.newsAmount = originalNewsAmount;
        }
      }

      return { news: allGeneratedNews };
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Cria um prompt formatado para o modelo de linguagem com base na lista de notícias
   * @param newsList Lista de notícias para incluir no prompt
   * @returns String formatada com o prompt completo
   */
  private createPrompt(newsList: NewsItem[]): string {
    let prompt = `\nVocê deve criar ${this.newsAmount} notícias com no máximo ${
      this.maxCharacters
    } caracteres cada uma.
      
      Você DEVE retornar apenas e exclusivamente um objeto JSON válido com o seguinte formato:
      {
        "news": [
          {
            "title": "Título da notícia 1",
            "content": "Conteúdo em HTML da notícia 1",
            "image": "URL da imagem 1" ,
            },
            {
              "title": "Título da notícia 2",
              "content": "Conteúdo em HTML da notícia 2",
              "image": "URL da imagem 2",
              }
              ]
              }
              
              Para escrever as notícias, use os seguintes dados:
              ${newsList
                .map((news, index) => {
                  return `Notícia ${index + 1}:
                - Título: ${news.title}
                - Descrição: ${news.description}
                - Imagem: ${
                  news.imageUrl && news.imageUrl.length > 0
                    ? news.imageUrl[0]
                    : "Não possui"
                }
                  - Data de publicação: ${news.publicationDate}
                  - Autor: ${news.author}`;
                })
                .join("\n\n")}

                Escolha as notícias mais importantes e que tenham mais impacto na internet. Se existirem temas e notícias que se conectam entre si, gere uma notícia com o tema e as notícias relacionadas. Mas SEMPRE respeite o número de notícias que você deve gerar.
                
                Certifique-se de que:
                1. Para múltiplas notícias, cada objeto no array "news" deve estar separado por vírgula
                2. O último item NÃO deve ter vírgula após o fechamento
                3. Todas as chaves devem estar corretamente fechadas
                4. Todos os valores devem estar entre aspas duplas
                5. O JSON deve ser 100% válido para ser processado por JSON.parse()
                
                IMPORTANTE:
                1. Não adicione comentários ou explicações fora do JSON
                2. O retorno deve ser um JSON válido e analisável (parseable)
                3. Mantenha o formato exato da estrutura do JSON conforme especificado acima
                4. Você deve retornar exatamente ${
                  this.newsAmount
                } notícias no array "news"
5. Dentro do conteúdo da notícia não adicione imagens, nem links, apenas o texto formatado como um HTML
 `;

    return prompt;
  }

  /**
   * Realiza a chamada à API com o prompt formatado
   * @param prompt O prompt formatado para enviar à API
   * @returns O conteúdo da resposta da API como string
   * @throws ContentGenerationError se a resposta da API for inválida
   */
  private async callApiWithPrompt(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.basePrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new ContentGenerationError("Resposta da API vazia ou inválida");
      }

      return response.choices[0].message.content || "";
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Processa e valida a resposta da API, convertendo-a para um objeto estruturado
   * @param responseContent O conteúdo da resposta da API como string
   * @returns Um objeto GeneratedNewsResponse validado
   * @throws ContentGenerationError se a resposta não for um JSON válido ou não atender aos requisitos
   */
  private processApiResponse(responseContent: string): GeneratedNewsResponse {
    try {
      const parsedResponse = JSON.parse(
        responseContent
      ) as GeneratedNewsResponse;
      this.validateParsedResponse(parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      throw new ContentGenerationError(
        `A resposta não é um JSON válido: ${(parseError as Error).message}`
      );
    }
  }

  /**
   * Valida se a resposta parseada atende aos requisitos necessários
   * @param parsedResponse O objeto JSON parseado da resposta
   * @throws ContentGenerationError se a resposta não atender aos requisitos
   */
  private validateParsedResponse(parsedResponse: GeneratedNewsResponse): void {
    if (!parsedResponse.news || !Array.isArray(parsedResponse.news)) {
      throw new ContentGenerationError(
        "A resposta não contém um array de notícias válido"
      );
    }

    parsedResponse.news.forEach((item, index) => {
      if (!item.title || !item.content) {
        console.warn(
          `Notícia ${index + 1} não contém todos os campos obrigatórios`
        );
      }
    });
  }

  /**
   * Trata erros específicos da API e converte-os em exceções tipadas
   * @param error O erro capturado
   * @throws Exceção tipada de acordo com o tipo de erro
   */
  private handleApiError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      const message = error.message;

      if (status === 401) {
        throw new ApiKeyError(`Erro de autenticação: ${message}`);
      } else if (status === 429) {
        throw new ApiLimitError(`Limite de requisições excedido: ${message}`);
      } else if (status === 404 || status === 503) {
        throw new ModelUnavailableError(`Modelo não disponível: ${message}`);
      }

      throw new ContentGenerationError(`Erro na API do OpenAI: ${message}`);
    }

    throw new ContentGenerationError(
      `Erro ao gerar notícia: ${(error as Error).message}`
    );
  }

  /**
   * Define o número de notícias a serem geradas
   * @param newsAmount Número de notícias
   */
  setNewsAmount(newsAmount: number) {
    this.newsAmount = newsAmount;
  }

  /**
   * Define o tamanho do lote para processamento
   * @param batchSize Tamanho do lote
   */
  setBatchSize(batchSize: number) {
    this.batchSize = batchSize;
  }
}

export default NewsGenerator;
