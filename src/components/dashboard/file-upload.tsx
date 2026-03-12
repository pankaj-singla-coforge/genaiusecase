"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a valid file." })
    .refine(
      (file) => {
        const lower = file.name.toLowerCase();
        return (
          lower.endsWith(".xlsx") ||
          lower.endsWith(".xls") ||
          lower.endsWith(".csv")
        );
      },
      { message: "Supported formats: .xlsx, .xls, .csv" },
    ),
});

type UploadFormValues = z.infer<typeof formSchema>;

type Props = {
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function FileUpload({ loading, onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
  });

  const validateAndUpload = async (file: File) => {
    setError(undefined);
    setValue("file", file, { shouldValidate: true });
    const valid = await trigger("file");

    if (!valid) {
      setError(errors.file?.message ?? "Invalid file.");
      return;
    }

    await onUpload(file);
  };

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await validateAndUpload(file);
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await validateAndUpload(file);
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div
        className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-10 text-center transition-all ${
          dragging
            ? "border-cyan-300 bg-cyan-500/10"
            : "border-border bg-background/30"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="rounded-full border border-cyan-300/40 bg-cyan-500/20 p-4">
          <FileSpreadsheet className="h-7 w-7 text-cyan-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Upload your spreadsheet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag and drop an Excel or CSV file, or browse manually.
          </p>
        </div>

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelection}
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Select file
              </>
            )}
          </Button>
        </div>

        {error || errors.file?.message ? (
          <p className="text-sm text-red-400">{error ?? errors.file?.message}</p>
        ) : null}
      </div>
    </section>
  );
}
