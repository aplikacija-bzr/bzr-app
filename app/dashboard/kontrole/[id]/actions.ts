"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function saveInspectionItem(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const inspectionId = String(formData.get("inspectionId") ?? "");
  const checklistItemId = String(formData.get("checklistItemId") ?? "");
  const answer = String(formData.get("answer") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!inspectionId || !checklistItemId) {
    return { error: "Nedostaju podaci." };
  }

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("status")
    .eq("id", inspectionId)
    .single();

  if (inspectionError) {
    return { error: inspectionError.message };
  }

  if (inspection?.status === "closed") {
    return { error: "Kontrola je zaključana." };
  }

  let finalAnswer = answer;

  if (!finalAnswer) {
    const { data: existingAnswer, error: existingError } = await supabase
      .from("inspection_answers")
      .select("answer")
      .eq("inspection_id", inspectionId)
      .eq("checklist_item_id", checklistItemId)
      .maybeSingle();

    if (existingError) {
      return { error: existingError.message };
    }

    finalAnswer = existingAnswer?.answer ?? "";
  }

  if (finalAnswer === "ne" && !comment) {
    return { error: "Komentar je obavezan kada je odgovor NE." };
  }

  const payload: {
    inspection_id: string;
    checklist_item_id: string;
    answer?: string;
    comment: string;
  } = {
    inspection_id: inspectionId,
    checklist_item_id: checklistItemId,
    comment,
  };

  if (finalAnswer) {
    payload.answer = finalAnswer;
  }

  const { error } = await supabase
    .from("inspection_answers")
    .upsert(payload, {
      onConflict: "inspection_id,checklist_item_id",
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/kontrole/${inspectionId}`);
  revalidatePath(`/dashboard/kontrole`);

  return { success: true };
}

export async function finishInspection(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const inspectionId = String(formData.get("inspectionId") ?? "");

  if (!inspectionId) {
    return { error: "Nedostaje inspectionId." };
  }

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("status")
    .eq("id", inspectionId)
    .single();

  if (inspectionError) {
    return { error: inspectionError.message };
  }

  if (inspection?.status === "closed") {
    return { error: "Kontrola je već završena." };
  }

  const { data: checklistItems, error: checklistError } = await supabase
    .from("checklist_items")
    .select("id");

  if (checklistError) {
    return { error: checklistError.message };
  }

  const { data: answers, error: answersError } = await supabase
    .from("inspection_answers")
    .select("checklist_item_id, answer")
    .eq("inspection_id", inspectionId);

  if (answersError) {
    return { error: answersError.message };
  }

  const totalItems = checklistItems?.length ?? 0;
  const answeredItems = answers?.filter((item) => !!item.answer).length ?? 0;

  if (totalItems === 0) {
    return { error: "Nema checklist stavki." };
  }

  if (answeredItems < totalItems) {
    return { error: "Nisu odgovorene sve stavke." };
  }

  const { error } = await supabase
    .from("inspections")
    .update({ status: "closed" })
    .eq("id", inspectionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/kontrole/${inspectionId}`);
  revalidatePath(`/dashboard/kontrole`);

  return { success: true };
}

export async function saveInspectionMeta(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const inspectionId = String(formData.get("inspectionId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const objectName = String(formData.get("objectName") ?? "").trim();

  if (!inspectionId) {
    return { error: "Nedostaje inspectionId." };
  }

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("status")
    .eq("id", inspectionId)
    .single();

  if (inspectionError) {
    return { error: inspectionError.message };
  }

  if (inspection?.status === "closed") {
    return { error: "Kontrola je zaključana." };
  }

  const { error } = await supabase
    .from("inspections")
    .update({
      client_name: clientName,
      object_name: objectName,
    })
    .eq("id", inspectionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/kontrole/${inspectionId}`);
  revalidatePath(`/dashboard/kontrole`);

  return { success: true };
}