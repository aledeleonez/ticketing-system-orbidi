"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/lib/hooks";
import type { Attachment } from "@/lib/types";

interface Props {
  ticketId: number;
}

const MAX_MB = 10;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachments({ ticketId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments = [] } = useAttachments(ticketId);
  const upload = useUploadAttachment(ticketId);
  const remove = useDeleteAttachment(ticketId);

  const handleFile = (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El fichero excede ${MAX_MB} MB`);
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success("Adjunto subido"),
      onError: (err: unknown) => {
        const e = err as { response?: { status?: number; data?: { detail?: string } } };
        if (e.response?.status === 415) {
          toast.error("Tipo de fichero no permitido");
        } else if (e.response?.status === 413) {
          toast.error("Fichero demasiado grande");
        } else {
          toast.error("Error al subir el fichero");
        }
      },
    });
  };

  const handleDownload = (att: Attachment) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    import("@/lib/api").then(({ api }) => {
      api
        .get(`/api/v1/attachments/${att.id}/download`, { responseType: "blob" })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          const a = document.createElement("a");
          a.href = url;
          a.download = att.filename;
          a.click();
          URL.revokeObjectURL(url);
        });
    });
    void apiUrl;
  };

  const handleDelete = (att: Attachment) => {
    if (!confirm(`¿Eliminar "${att.filename}"?`)) return;
    remove.mutate(att.id, {
      onSuccess: () => toast.success("Adjunto eliminado"),
      onError: () => toast.error("Error al eliminar"),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Adjuntos ({attachments.length})</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? "Subiendo..." : "Subir fichero"}
        </Button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-slate-500">Sin adjuntos.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => handleDownload(a)}
                  className="text-sm font-medium text-blue-600 hover:underline text-left"
                >
                  {a.filename}
                </button>
                <span className="text-xs text-slate-500">
                  {formatSize(a.size_bytes)} · {a.mime_type}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(a)}
                className="text-red-600 hover:text-red-700"
              >
                Eliminar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}