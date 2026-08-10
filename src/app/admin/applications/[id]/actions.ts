"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { updateApplicationSchema } from "@/lib/validation";

export type UpdateState = { ok: boolean; message: string } | null;

/**
 * Update an application's status and internal notes.
 *
 * Server Actions are POST-only and origin-checked by Next.js, but the session
 * check below is what actually authorises the write — never assume the caller
 * came through the dashboard UI.
 */
export async function updateApplication(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: "Your session expired. Sign in again." };
  }

  const id = String(formData.get("id") ?? "");
  if (!/^[a-z0-9]{20,40}$/i.test(id)) {
    return { ok: false, message: "Invalid application reference." };
  }

  const parsed = updateApplicationSchema.safeParse({
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please choose a valid status." };
  }

  try {
    await prisma.application.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes.trim() || null,
      },
    });
  } catch (error) {
    console.error("[admin] failed to update application:", error);
    return { ok: false, message: "Could not save. Please try again." };
  }

  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");

  return { ok: true, message: "Saved." };
}
