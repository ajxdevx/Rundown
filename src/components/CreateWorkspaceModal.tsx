"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkspaceOptimistic,
  type WorkspaceFieldErrors,
  type WorkspaceType,
} from "@/lib/workspaceStore";
import { backgroundSync } from "@/lib/optimistic";
import Popup, { PopupCloseButton } from "./Popup";
import { useToast } from "./ToastProvider";
import { Button } from "./ui/Button";

const inputClass =
  "h-11 w-full rounded-[8px] border border-border bg-card px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink";

const TYPES: WorkspaceType[] = [
  "Freelancer",
  "Agency",
  "Studio",
  "Consultancy",
  "Other",
];

export default function CreateWorkspaceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("Studio");
  const [errors, setErrors] = useState<WorkspaceFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("Studio");
    setErrors({});
    setSubmitting(false);
    dirtyRef.current = false;
  }, [open]);

  const requestClose = () => {
    if (!dirtyRef.current) {
      onClose();
      return;
    }
    setUnsavedOpen(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const built = createWorkspaceOptimistic({ name, type });
    if (!built.ok) {
      setErrors(built.errors);
      return;
    }

    setSubmitting(true);
    dirtyRef.current = false;
    onClose();
    router.push("/");

    void backgroundSync().then((r) => {
      if (!r.ok) {
        toastError("Couldn't create the workspace. Try again.");
      }
    });
  };

  return (
    <>
      <Popup
        open={open}
        onClose={requestClose}
        labelledBy="create-workspace-title"
        align="center"
        panelClassName="w-[min(100vw-2rem,28rem)] bg-card"
      >
        <form onSubmit={onSubmit} noValidate>
          <div className="relative border-b border-border px-6 py-5">
            <div className="absolute right-4 top-4">
              <PopupCloseButton onClick={requestClose} />
            </div>
            <h2
              id="create-workspace-title"
              className="pr-10 text-lg font-semibold tracking-tight text-ink"
            >
              Create Workspace
            </h2>
            <p className="mt-1 text-sm text-muted">
              Set up a new business container for your work.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <label
                htmlFor="ws-name"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Workspace name
              </label>
              <input
                id="ws-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  dirtyRef.current = true;
                  setErrors((prev) => {
                    if (!prev.name) return prev;
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }}
                placeholder="e.g. Anass Studio"
                className={`${inputClass} ${
                  errors.name ? "border-danger" : ""
                }`}
                autoFocus
              />
              {errors.name ? (
                <p className="mt-1.5 text-xs text-danger" role="alert">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">
                Workspace type{" "}
                <span className="font-normal text-muted">optional</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={type === t}
                    onClick={() => {
                      setType(t);
                      dirtyRef.current = true;
                    }}
                    className={`h-9 cursor-pointer rounded-[8px] px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                      type === t
                        ? "bg-accent text-ink"
                        : "border border-border text-muted hover:bg-surface-hover hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {errors.form ? (
              <p className="text-sm text-danger" role="alert">
                {errors.form}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={submitting}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Popup>

      <Popup
        open={unsavedOpen}
        onClose={() => setUnsavedOpen(false)}
        labelledBy="ws-discard-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton onClick={() => setUnsavedOpen(false)} />
          </div>
          <h2
            id="ws-discard-title"
            className="pr-10 text-xl font-semibold tracking-tight text-ink"
          >
            Discard changes?
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your workspace information hasn&apos;t been saved.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUnsavedOpen(false)}
            >
              Continue Editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setUnsavedOpen(false);
                dirtyRef.current = false;
                onClose();
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}
