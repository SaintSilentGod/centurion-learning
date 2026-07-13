"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SubmitApplicationState = {
  error?: string;
  ok?: boolean;
};

export async function submitApplicationAction(
  formData: FormData,
): Promise<SubmitApplicationState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const program = String(formData.get("program") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "home").trim() || "home";

  if (!name) {
    return { error: "Укажите имя" };
  }
  if (!phone) {
    return { error: "Укажите телефон" };
  }

  if (program && program !== "tb" && program !== "security") {
    return { error: "Некорректная программа" };
  }

  if (source !== "home" && source !== "contacts") {
    return { error: "Некорректный источник заявки" };
  }

  await prisma.siteApplication.create({
    data: {
      name,
      phone,
      program,
      comment,
      source,
    },
  });

  revalidatePath("/admin/applications");

  return { ok: true };
}
