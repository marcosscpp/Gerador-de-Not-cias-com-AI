import prismaDatabase from "@/config/database";
import { NotFoundError } from "@/utils/errors";

const ContentSourceService = {
  async getAll() {
    const configurations =
        await prismaDatabase.contentSource.findMany();
    return configurations;
  },

  async getById(id: number) {
    const configuration =
      await prismaDatabase.contentSource.findUnique({
        where: { id },
      });

    if (!configuration) {
      throw new NotFoundError("Configuração de fonte de dados não encontrada");
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

    const configurations =
      await prismaDatabase.contentSource.findMany({
        where: { clientId },
      });

    return configurations;
  },
};

export default ContentSourceService;
