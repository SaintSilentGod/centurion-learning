export type { UserRole, ClientStatus } from "@/generated/prisma/client";

export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  username: string;
  status: "ACTIVE" | "ARCHIVED";
  assignedTopicCount: number;
  completedTopicCount: number;
}
