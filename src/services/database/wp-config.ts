import prismaDatabase from "@/config/database";
import { NotFoundError } from "@/utils/errors";

const WordpressConfigurationService = {
  async getAll() {
    const configurations =
      await prismaDatabase.wordpressConfiguration.findMany();
    return configurations;
  },

  async getById(id: number) {
    const configuration =
      await prismaDatabase.wordpressConfiguration.findUnique({
        where: { id },
      });

    if (!configuration) {
      throw new NotFoundError("Configuração do WordPress não encontrada");
    }

    return configuration;
  },

  async getByClientId(clientId: number) {
    const clientExists = await prismaDatabase.clients.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundError("Cliente não existente");
    }

    const configurations = await prismaDatabase.wordpressConfiguration.findFirst(
      {
        where: { clientId },
      }
    );

    return configurations;
  },
};

export default WordpressConfigurationService;
