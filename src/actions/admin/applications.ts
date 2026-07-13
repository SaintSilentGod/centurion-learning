"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function getApplicationsAction() {
  await requireAdmin();

  return prisma.siteApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadApplicationsCountAction() {
  await requireAdmin();

  return prisma.siteApplication.count({
    where: { readAt: null },
  });
}

export async function markApplicationReadAction(id: string) {
  await requireAdmin();

  await prisma.siteApplication.update({
    where: { id },
    data: { readAt: new Date() },
  });

  revalidatePath("/admin/applications");
}
