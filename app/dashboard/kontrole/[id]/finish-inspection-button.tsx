"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { finishInspection } from "./actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

type Props = {
  inspectionId: string;
  disabled: boolean;
};

export default function FinishInspectionButton({
  inspectionId,
  disabled,
}: Props) {
  const [state, formAction, pending] = useActionState(
    finishInspection,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Kontrola je završena");
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="inspectionId" value={inspectionId} />

      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-md border px-4 py-2 font-medium"
        style={{
          backgroundColor: disabled ? "#f3f4f6" : "#111827",
          color: disabled ? "#9ca3af" : "white",
          opacity: pending ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "Završavanje..." : "Završi kontrolu"}
      </button>
    </form>
  );
}