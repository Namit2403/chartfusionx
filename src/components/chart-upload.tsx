import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const MAX_BYTES = 10 * 1024 * 1024;

export type UploadedChart = {
  file: File;
  url: string;
};

export function ChartUpload({
  value,
  onChange,
  height = "h-56",
  hint = "Drop a screenshot or click to browse",
}: {
  value: UploadedChart | null;
  onChange: (chart: UploadedChart | null) => void;
  height?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Revoke the object URL when the preview is replaced or unmounted.
  useEffect(() => {
    return () => {
      if (value) URL.revokeObjectURL(value.url);
    };
  }, [value]);

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("That file isn't an image — upload a PNG or JPG screenshot.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("That image is over 10MB. Try a smaller screenshot.");
        return;
      }
      onChange({ file, url: URL.createObjectURL(file) });
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-background/40">
          <img src={value.url} alt="Uploaded trading chart screenshot" className="max-h-72 w-full object-contain" />
          <button
            type="button"
            aria-label="Remove uploaded chart"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full border border-border bg-background/90 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" />
          <span className="truncate">{value.file.name}</span>
          <span className="num shrink-0">{(value.file.size / 1024).toFixed(0)} KB</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`flex ${height} cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center transition-colors ${
        dragging ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50"
      }`}
    >
      <Upload className="size-5 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">{hint}</div>
      <div className="text-xs text-muted-foreground/70">PNG or JPG, up to 10MB</div>
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </div>
  );
}
