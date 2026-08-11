import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type AttachmentSlotValue = { file: File; previewUrl: string | null } | null;

/**
 * A real, clickable upload slot used on the trade log form. Images get a live
 * preview; other file types show their name so the user knows it attached.
 */
export function AttachmentSlot({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept: string;
  value: AttachmentSlotValue;
  onChange: (v: AttachmentSlotValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function take(file: File | undefined | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    onChange({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  }

  if (value) {
    return (
      <div className="relative h-28 overflow-hidden rounded-xl border border-border bg-background/40">
        {value.previewUrl ? (
          <img src={value.previewUrl} alt={label} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-muted-foreground">
            <Paperclip className="size-4" />
            <span className="line-clamp-2 break-all">{value.file.name}</span>
          </div>
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-1.5 top-1.5 size-6"
          onClick={() => {
            if (value.previewUrl) URL.revokeObjectURL(value.previewUrl);
            onChange(null);
          }}
          aria-label={`Remove ${label}`}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        take(e.dataTransfer.files?.[0]);
      }}
      className={`flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/40 px-3 text-center text-xs transition-colors ${
        dragging ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary"
      }`}
    >
      <Paperclip className="size-4" />
      {label}
      <span className="text-[10px] opacity-70">Click or drop · max 10MB</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => take(e.target.files?.[0])}
      />
    </button>
  );
}
