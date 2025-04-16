import RssExtractor from "@/services/content-source-extractors/rss-extractor";
import NewsGenerator, {
  NewsItem,
  GeneratedNewsItem,
  GeneratedNewsResponse,
} from "@/services/content-generator/news-generator";

import ClientService from "@/services/database/clients";
import DataSourceService from "@/services/database/content-source";
import AiConfigurationService from "@/services/database/ai-config";
import WordpressConfigurationService from "@/services/database/wp-config";
import WordpressPostCreator from "./services/publisher/wordpress-post-creator";
import { loggerInfo, loggerError } from "@/config/logger";

interface ClientStats {
  totalNews: number;
  successfulNews: number;
  failedNews: number;
  processedSources: number;
  failedSources: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      loggerError.error(`[Tentativa ${attempt}/${maxRetries}] Erro:`, {
        error: lastError.message,
        stack: lastError.stack,
      });

      if (attempt < maxRetries) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error("Operação falhou após todas as tentativas");
}

async function processNewsItem(
  newsItem: GeneratedNewsItem,
  wpCreator: WordpressPostCreator,
  dataSource: any,
  clientStats: ClientStats
): Promise<boolean> {
  try {
    await retryOperation(() =>
      wpCreator.createPost({
        title: newsItem.title,
        content: newsItem.content,
        featuredImageUrl: newsItem.image,
        categories: [dataSource.category],
      })
    );
    clientStats.successfulNews++;
    loggerInfo.info(`Notícia publicada com sucesso`, {
      title: newsItem.title,
      sourceName: dataSource.name,
    });
    return true;
  } catch (error) {
    clientStats.failedNews++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerError.error(`Falha ao publicar notícia individual`, {
      title: newsItem.title,
      sourceName: dataSource.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

async function processDataSource(
  dataSource: any,
  rssExtractor: RssExtractor,
  aiGenerator: NewsGenerator,
  wpCreator: WordpressPostCreator,
  clientStats: ClientStats
): Promise<boolean> {
  try {
    loggerInfo.info(`Processando fonte: ${dataSource.name}`, {
      sourceName: dataSource.name,
      sourceUrl: dataSource.url,
    });

    const news = (await retryOperation(() =>
      rssExtractor.extractNews(dataSource.url)
    )) as NewsItem[];
    loggerInfo.info(`Extraídas ${news.length} notícias da fonte`, {
      sourceName: dataSource.name,
      newsCount: news.length,
    });

    if (dataSource.newsAmount) {
      aiGenerator.setNewsAmount(dataSource.newsAmount);
    }

    const rewriteNews = (await retryOperation(() =>
      aiGenerator.generateNews(news)
    )) as GeneratedNewsResponse;
    loggerInfo.info(`Geradas ${rewriteNews.news.length} notícias reescritas`, {
      sourceName: dataSource.name,
      rewrittenCount: rewriteNews.news.length,
    });

    clientStats.totalNews += rewriteNews.news.length;

    const processResults = await Promise.allSettled(
      rewriteNews.news.map((newsItem: GeneratedNewsItem) =>
        processNewsItem(newsItem, wpCreator, dataSource, clientStats)
      )
    );

    clientStats.processedSources++;

    const failedCount = processResults.filter(
      (result: PromiseSettledResult<boolean>) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && !result.value)
    ).length;

    if (failedCount > 0) {
      loggerError.error(`Algumas notícias falharam ao processar`, {
        sourceName: dataSource.name,
        totalNews: rewriteNews.news.length,
        failedNews: failedCount,
      });
    }

    return true;
  } catch (error) {
    clientStats.failedSources++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerError.error(`Falha ao processar fonte de dados`, {
      sourceName: dataSource.name,
      sourceUrl: dataSource.url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

async function processClient(client: any): Promise<boolean> {
  const clientStats: ClientStats = {
    totalNews: 0,
    successfulNews: 0,
    failedNews: 0,
    processedSources: 0,
    failedSources: 0,
  };

  try {
    loggerInfo.info(`Iniciando processo para cliente: ${client.name}`, {
      clientId: client.id,
      clientName: client.name,
    });

    const dataSources = await DataSourceService.getByClientId(client.id);
    loggerInfo.info(
      `Encontradas ${dataSources.length} fontes de dados para processar`,
      {
        clientId: client.id,
        sourcesCount: dataSources.length,
      }
    );

    const aiConfiguration = await AiConfigurationService.getByClientId(
      client.id
    );
    const aiGenerator = new NewsGenerator({
      apiKey: aiConfiguration.apiKey,
      model: aiConfiguration.model,
      temperature: aiConfiguration.temperature,
      maxTokens: aiConfiguration.maxTokens,
      basePrompt: aiConfiguration.basePrompt || undefined,
      maxCharacters: aiConfiguration.maxCharacters || 1500,
      batchSize: 3,
    });

    const wordpressConfiguration =
      await WordpressConfigurationService.getByClientId(client.id);

    if (!wordpressConfiguration) {
      throw new Error("Configuração do WordPress não encontrada");
    }

    const wpCreator = new WordpressPostCreator(
      wordpressConfiguration.siteUrl,
      wordpressConfiguration.username,
      wordpressConfiguration.appPassword,
      wordpressConfiguration.defaultPostStatus as
        | "publish"
        | "draft"
        | "pending"
        | "private"
    );

    const rssExtractor = new RssExtractor();

    await Promise.allSettled(
      dataSources.map((dataSource) =>
        processDataSource(
          dataSource,
          rssExtractor,
          aiGenerator,
          wpCreator,
          clientStats
        )
      )
    );

    loggerInfo.info(`Resumo do processamento do cliente`, {
      clientId: client.id,
      clientName: client.name,
      stats: {
        totalProcessado: clientStats.totalNews,
        publicadasComSucesso: clientStats.successfulNews,
        falhasAoPublicar: clientStats.failedNews,
        fontesProcessadas: clientStats.processedSources,
        fontesComFalha: clientStats.failedSources,
        totalFontes: dataSources.length,
      },
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerError.error(`Falha ao processar cliente`, {
      clientId: client.id,
      clientName: client.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

async function run() {
  try {
    const clients = await ClientService.getActives();
    loggerInfo.info(
      `Iniciando processamento de ${clients.length} clientes ativos`
    );

    const results = await Promise.allSettled(clients.map(processClient));

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length;
    const failed = clients.length - successful;

    loggerInfo.info("Finalizado o processamento de todos os clientes", {
      totalClients: clients.length,
      successfulClients: successful,
      failedClients: failed,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerError.error(`Erro fatal no processamento`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

run();
