"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ChecklistItem = {
  id: string;
  title: string;
};

export default function ImageUpload({
  inspectionId,
  checklistItems = [],
}: {
  inspectionId: string;
  checklistItems?: ChecklistItem[];
}) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [checklistItemId, setChecklistItemId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const router = useRouter();

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Izaberi sliku.");
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      alert("Dozvoljeni formati su JPG, PNG i WEBP.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("Maksimalna veličina slike je 10MB.");
      return;
    }

    try {
      setUploading(true);

      const supabase = createClient();

      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeBaseName = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase();

      const fileName = `${Date.now()}-${safeBaseName}.${ext}`;
      const storagePath = `inspections/${inspectionId}/${fileName}`;

      console.log("UPLOAD PATH:", storagePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("inspection-images")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        throw uploadError;
      }

      console.log("UPLOAD OK:", uploadData);

      const { error: insertError } = await supabase
        .from("inspection_images")
        .insert({
          inspection_id: inspectionId,
          checklist_item_id: checklistItemId || null,
          storage_path: storagePath,
          file_name: selectedFile.name,
          content_type: selectedFile.type,
          file_size: selectedFile.size,
          note: note || null,
          created_by: null,
        });

      if (insertError) {
        console.error("INSERT ERROR:", insertError);
        throw insertError;
      }

      alert("Fotografija uspešno sačuvana.");

      setNote("");
      setChecklistItemId("");
      setSelectedFile(null);

      router.refresh();
    } catch (err: any) {
      console.error("FULL ERROR:", err);

      alert(
        JSON.stringify(
          {
            message: err?.message || "Greška pri upload-u.",
            statusCode: err?.statusCode || null,
            error: err?.error || null,
            name: err?.name || null,
          },
          null,
          2
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Dodaj fotografiju nepravilnosti</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Veži za stavku</label>
        <select
          value={checklistItemId}
          onChange={(e) => setChecklistItemId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 outline-none"
        >
          <option value="">Nije vezano za konkretnu stavku</option>
          {checklistItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Opis nepravilnosti</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Npr. Neobeležen PP aparat u hodniku."
          className="min-h-[120px] w-full rounded-lg border px-3 py-2 outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Fotografija</label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex w-fit cursor-pointer rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">
            Izaberi sliku
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />
          </label>

          <span className="text-sm text-gray-600">
            {selectedFile ? selectedFile.name : "Nijedna slika nije izabrana"}
          </span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Čuvanje..." : "Sačuvaj fotografiju"}
        </button>
      </div>
    </div>
  );
}