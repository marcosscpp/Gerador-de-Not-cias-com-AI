import prismaDatabase from "@/config/database";
import { NotFoundError } from "@/utils/errors";

const AiConfigurationService = {
  async getAll() {
    const aiConfigurations = await prismaDatabase.aiConfiguration.findMany();

    return aiConfigurations;
  },

  async getById(id: number) {
    const aiConfiguration = await prismaDatabase.aiConfiguration.findUnique({
      where: { id },
    });

    if (!aiConfiguration) {
      throw new NotFoundError("Configuração de IA não encontrada");
    }

    return aiConfiguration;
  },

  async getByClientId(clientId: number) {
    const clientExists = await prismaDatabase.clients.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundError("Cliente não existente");
    }

    const aiConfigurations = await prismaDatabase.aiConfiguration.findFirst({
      where: { clientId },
    });

    if (!aiConfigurations) {
      throw new NotFoundError("Configuração de IA não encontrada");
    }

    return aiConfigurations;
  },
};

export default AiConfigurationService;
