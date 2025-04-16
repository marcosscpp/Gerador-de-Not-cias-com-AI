"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rss_extractor_1 = __importDefault(require("@/services/content-source-extractors/rss-extractor"));
const news_generator_1 = __importDefault(require("@/services/content-generator/news-generator"));
const clients_1 = __importDefault(require("@/services/database/clients"));
const content_source_1 = __importDefault(require("@/services/database/content-source"));
const ai_config_1 = __importDefault(require("@/services/database/ai-config"));
const wp_config_1 = __importDefault(require("@/services/database/wp-config"));
const wordpress_post_creator_1 = __importDefault(require("./services/publisher/wordpress-post-creator"));
const logger_1 = require("@/config/logger");
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryOperation(operation, maxRetries = MAX_RETRIES, delayMs = RETRY_DELAY) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger_1.loggerError.error(`[Tentativa ${attempt}/${maxRetries}] Erro:`, {
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
async function processNewsItem(newsItem, wpCreator, dataSource, clientStats) {
    try {
        await retryOperation(() => wpCreator.createPost({
            title: newsItem.title,
            content: newsItem.content,
            featuredImageUrl: newsItem.image,
            categories: [dataSource.category],
        }));
        clientStats.successfulNews++;
        logger_1.loggerInfo.info(`Notícia publicada com sucesso`, {
            title: newsItem.title,
            sourceName: dataSource.name,
        });
        return true;
    }
    catch (error) {
        clientStats.failedNews++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.loggerError.error(`Falha ao publicar notícia individual`, {
            title: newsItem.title,
            sourceName: dataSource.name,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
    }
}
async function processDataSource(dataSource, rssExtractor, aiGenerator, wpCreator, clientStats) {
    try {
        logger_1.loggerInfo.info(`Processando fonte: ${dataSource.name}`, {
            sourceName: dataSource.name,
            sourceUrl: dataSource.url,
        });
        const news = (await retryOperation(() => rssExtractor.extractNews(dataSource.url)));
        logger_1.loggerInfo.info(`Extraídas ${news.length} notícias da fonte`, {
            sourceName: dataSource.name,
            newsCount: news.length,
        });
        if (dataSource.newsAmount) {
            aiGenerator.setNewsAmount(dataSource.newsAmount);
        }
        const rewriteNews = (await retryOperation(() => aiGenerator.generateNews(news)));
        logger_1.loggerInfo.info(`Geradas ${rewriteNews.news.length} notícias reescritas`, {
            sourceName: dataSource.name,
            rewrittenCount: rewriteNews.news.length,
        });
        clientStats.totalNews += rewriteNews.news.length;
        const processResults = await Promise.allSettled(rewriteNews.news.map((newsItem) => processNewsItem(newsItem, wpCreator, dataSource, clientStats)));
        clientStats.processedSources++;
        const failedCount = processResults.filter((result) => result.status === "rejected" ||
            (result.status === "fulfilled" && !result.value)).length;
        if (failedCount > 0) {
            logger_1.loggerError.error(`Algumas notícias falharam ao processar`, {
                sourceName: dataSource.name,
                totalNews: rewriteNews.news.length,
                failedNews: failedCount,
            });
        }
        return true;
    }
    catch (error) {
        clientStats.failedSources++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.loggerError.error(`Falha ao processar fonte de dados`, {
            sourceName: dataSource.name,
            sourceUrl: dataSource.url,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
    }
}
async function processClient(client) {
    const clientStats = {
        totalNews: 0,
        successfulNews: 0,
        failedNews: 0,
        processedSources: 0,
        failedSources: 0,
    };
    try {
        logger_1.loggerInfo.info(`Iniciando processo para cliente: ${client.name}`, {
            clientId: client.id,
            clientName: client.name,
        });
        const dataSources = await content_source_1.default.getByClientId(client.id);
        logger_1.loggerInfo.info(`Encontradas ${dataSources.length} fontes de dados para processar`, {
            clientId: client.id,
            sourcesCount: dataSources.length,
        });
        const aiConfiguration = await ai_config_1.default.getByClientId(client.id);
        const aiGenerator = new news_generator_1.default({
            apiKey: aiConfiguration.apiKey,
            model: aiConfiguration.model,
            temperature: aiConfiguration.temperature,
            maxTokens: aiConfiguration.maxTokens,
            basePrompt: aiConfiguration.basePrompt || undefined,
            maxCharacters: aiConfiguration.maxCharacters || 1500,
            batchSize: 3,
        });
        const wordpressConfiguration = await wp_config_1.default.getByClientId(client.id);
        if (!wordpressConfiguration) {
            throw new Error("Configuração do WordPress não encontrada");
        }
        const wpCreator = new wordpress_post_creator_1.default(wordpressConfiguration.siteUrl, wordpressConfiguration.username, wordpressConfiguration.appPassword, wordpressConfiguration.defaultPostStatus);
        const rssExtractor = new rss_extractor_1.default();
        await Promise.allSettled(dataSources.map((dataSource) => processDataSource(dataSource, rssExtractor, aiGenerator, wpCreator, clientStats)));
        logger_1.loggerInfo.info(`Resumo do processamento do cliente`, {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.loggerError.error(`Falha ao processar cliente`, {
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
        const clients = await clients_1.default.getActives();
        logger_1.loggerInfo.info(`Iniciando processamento de ${clients.length} clientes ativos`);
        const results = await Promise.allSettled(clients.map(processClient));
        const successful = results.filter((r) => r.status === "fulfilled" && r.value).length;
        const failed = clients.length - successful;
        logger_1.loggerInfo.info("Finalizado o processamento de todos os clientes", {
            totalClients: clients.length,
            successfulClients: successful,
            failedClients: failed,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.loggerError.error(`Erro fatal no processamento`, {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
}
run();
