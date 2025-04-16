import prismaDatabase from "@/config/database";
import { NotFoundError } from "@/utils/errors";

const ClientService = {
  async getAll() {
    const clients = await prismaDatabase.clients.findMany();

    return clients;
  },

  async getActives() {
    const clients = await prismaDatabase.clients.findMany({
      where: { active: true },
    });

    return clients;
  },

  async getById(id: number) {
    const client = await prismaDatabase.clients.findUnique({
      where: { id },
    });


    if (!client) {
      throw new NotFoundError("Cliente não encontrado");
    }

    return client;
  },
};

export default ClientService;
