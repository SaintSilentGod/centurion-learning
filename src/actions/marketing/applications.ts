"use server";

import { revalidatePath } from "next/cache";
import {
  APPLICATION_COMMENT_MAX,
  APPLICATION_NAME_MAX,
} from "@/lib/application-limits";
import { prisma } from "@/lib/prisma";

export type SubmitApplicationState = {
  error?: string;
  ok?: boolean;
};

/** Форма, отправленная быстрее этого, заполнена ботом. */
const MIN_FILL_MS = 3000;
/** Повторная заявка с того же телефона в этом окне не сохраняется. */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const LINK_RE =
  /(https?:\/\/|www\.|t\.me\/|@|\.рф|\b[a-z0-9-]+\.(ru|com|net|org|io|pro|online|site|su)\b)/i;

/** Приводит телефон к виду 7XXXXXXXXXX или возвращает null, если номер не российский. */
function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11 || !digits.startsWith("7")) return null;
  // 79999999999, 70000000000 и т. п.
  if (/^7(\d)\1{9}$/.test(digits)) return null;
  return digits;
}

export async function submitApplicationAction(
  formData: FormData,
): Promise<SubmitApplicationState> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const program = String(formData.get("program") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "home").trim() || "home";
  const honeypot = String(formData.get("website") ?? "").trim();
  const startedAt = Number(formData.get("startedAt") ?? 0);

  // Спам отбрасываем молча: бот видит «успех» и не пробует снова.
  if (honeypot || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { ok: true };
  }

  if (!name) {
    return { error: "Укажите имя" };
  }
  if (name.length > APPLICATION_NAME_MAX) {
    return { error: "Слишком длинное имя" };
  }
  if (!phoneRaw) {
    return { error: "Укажите телефон" };
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { error: "Укажите российский номер телефона, например +7 900 000-00-00" };
  }

  if (comment && comment.length > APPLICATION_COMMENT_MAX) {
    return { error: `Комментарий не длиннее ${APPLICATION_COMMENT_MAX} символов` };
  }
  if (LINK_RE.test(name) || (comment && LINK_RE.test(comment))) {
    return { error: "Ссылки и адреса в заявке не принимаются" };
  }

  if (program && program !== "tb" && program !== "security") {
    return { error: "Некорректная программа" };
  }

  if (source !== "home" && source !== "contacts") {
    return { error: "Некорректный источник заявки" };
  }

  const duplicate = await prisma.siteApplication.findFirst({
    where: {
      phone,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (duplicate) {
    return { ok: true };
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
