"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveInspectionMeta } from "./actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

type Props = {
  inspectionId: string;
  clientName: string;
  objectName: string;
  locked: boolean;
};

const initialState: ActionState = {};

export default function InspectionMetaForm({
  inspectionId,
  clientName,
  objectName,
  locked,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveInspectionMeta,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Podaci su sačuvani");
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="rounded-lg border p-4 space-y-3">
      <input type="hidden" name="inspectionId" value={inspectionId} />

      <div>
        <label className="mb-1 block text-sm font-medium">Klijent</label>
        <input
          type="text"
          name="clientName"
          defaultValue={clientName}
          disabled={locked || pending}
          className="w-full rounded-md border p-2"
          placeholder="Unesi naziv klijenta"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Objekat</label>
        <input
          type="text"
          name="objectName"
          defaultValue={objectName}
          disabled={locked || pending}
          className="w-full rounded-md border p-2"
          placeholder="Unesi naziv objekta"
        />
      </div>

      <button
        type="submit"
        disabled={locked || pending}
        className="rounded-md border px-4 py-2 font-medium"
      >
        {pending ? "Čuvanje..." : "Sačuvaj podatke"}
      </button>
    </form>
  );
}