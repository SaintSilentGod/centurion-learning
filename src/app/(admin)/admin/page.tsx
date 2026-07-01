import {
  getAllTopics,
  getClientsByStatus,
} from "@/actions/admin/clients";
import { ClientList } from "@/components/features/admin/client-list";
import { CreateClientForm } from "@/components/features/admin/create-client-form";

export default async function AdminPage() {
  const [activeClients, archivedClients, topics] = await Promise.all([
    getClientsByStatus("ACTIVE"),
    getClientsByStatus("ARCHIVED"),
    getAllTopics(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <CreateClientForm topics={topics} />
      <ClientList
        activeClients={activeClients}
        archivedClients={archivedClients}
      />
    </div>
  );
}
