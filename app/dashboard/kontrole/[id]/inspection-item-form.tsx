"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveInspectionItem } from "./actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

type Props = {
  inspectionId: string;
  itemId: string;
  title: string;
  currentAnswer: string;
  currentComment: string;
  locked: boolean;
};

const initialState: ActionState = {};

export default function InspectionItemForm({
  inspectionId,
  itemId,
  title,
  currentAnswer,
  currentComment,
  locked,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveInspectionItem,
    initialState
  );

  const [localAnswer, setLocalAnswer] = useState(currentAnswer);
  const [localComment, setLocalComment] = useState(currentComment);
  const [savedAnswer, setSavedAnswer] = useState(currentAnswer);
  const [savedComment, setSavedComment] = useState(currentComment);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      setSavedAnswer(localAnswer);
      setSavedComment(localComment);
      toast.success("Sačuvano");
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, localAnswer, localComment]);

  const hasUnsavedChanges =
    localAnswer !== savedAnswer || localComment !== savedComment;

  let statusText = "";
  let statusColor = "#6b7280";

  if (locked) {
    statusText = "Kontrola je zaključana.";
    statusColor = "#6b7280";
  } else if (pending) {
    statusText = "Čuvanje...";
    statusColor = "#2563eb";
  } else if (hasUnsavedChanges) {
    statusText = "Nesačuvane izmene...";
    statusColor = "#d97706";
  } else if (state?.success) {
    statusText = "Sačuvano";
    statusColor = "#16a34a";
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border p-4"
      style={{
        opacity: locked ? 0.75 : 1,
      }}
    >
      <input type="hidden" name="inspectionId" value={inspectionId} />
      <input type="hidden" name="checklistItemId" value={itemId} />
      <input type="hidden" name="answer" value={localAnswer} />

      <h2 className="font-medium">{title}</h2>

      <textarea
        name="comment"
        value={localComment}
        onChange={(e) => setLocalComment(e.target.value)}
        onBlur={() => {
          if (!locked && hasUnsavedChanges) {
            formRef.current?.requestSubmit();
          }
        }}
        rows={3}
        disabled={locked || pending}
        className="w-full rounded-md border p-2"
        placeholder="Unesi komentar..."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          onClick={() => setLocalAnswer("da")}
          className="rounded-md border px-3 py-2"
          disabled={locked || pending}
          style={{
            backgroundColor: localAnswer === "da" ? "#bbf7d0" : "white",
            fontWeight: localAnswer === "da" ? "700" : "400",
            opacity: locked || pending ? 0.7 : 1,
          }}
        >
          Da
        </button>

        <button
          type="submit"
          onClick={() => setLocalAnswer("ne")}
          className="rounded-md border px-3 py-2"
          disabled={locked || pending}
          style={{
            backgroundColor: localAnswer === "ne" ? "#fecaca" : "white",
            fontWeight: localAnswer === "ne" ? "700" : "400",
            opacity: locked || pending ? 0.7 : 1,
          }}
        >
          Ne
        </button>

        <button
          type="submit"
          onClick={() => setLocalAnswer("nije_primenljivo")}
          className="rounded-md border px-3 py-2"
          disabled={locked || pending}
          style={{
            backgroundColor:
              localAnswer === "nije_primenljivo" ? "#fde68a" : "white",
            fontWeight:
              localAnswer === "nije_primenljivo" ? "700" : "400",
            opacity: locked || pending ? 0.7 : 1,
          }}
        >
          Nije primenljivo
        </button>
      </div>

      <div
        className="text-sm"
        style={{
          color: statusColor,
          minHeight: "20px",
        }}
      >
        {statusText}
      </div>
    </form>
  );
}