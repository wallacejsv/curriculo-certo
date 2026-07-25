"use client";

import { useState } from "react";

interface JobFormProps {
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

type Mode = "paste" | "upload";

export function JobForm({ onSubmit, isPending }: JobFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState<Mode>("paste");
  const [linkedinText, setLinkedinText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const canSubmit =
    jobTitle.trim() !== "" &&
    jobDescription.trim() !== "" &&
    (mode === "paste" ? linkedinText.trim() !== "" : file !== null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isPending) return;

    const fd = new FormData();
    fd.set("jobTitle", jobTitle);
    fd.set("jobDescription", jobDescription);
    if (mode === "paste") {
      fd.set("linkedinText", linkedinText);
    } else if (file) {
      fd.set("linkedinPdf", file);
    }
    onSubmit(fd);
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Título da vaga
        </label>
        <input
          className={inputClass}
          placeholder="Ex.: Product Manager Sênior"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descrição da vaga
        </label>
        <textarea
          className={`${inputClass} min-h-40 resize-y`}
          placeholder="Cole aqui a descrição completa da vaga..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Seu LinkedIn
          </label>
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-xs">
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`px-3 py-1 ${
                mode === "paste"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Colar texto
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`px-3 py-1 ${
                mode === "upload"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Upload PDF
            </button>
          </div>
        </div>

        {mode === "paste" ? (
          <textarea
            className={`${inputClass} min-h-40 resize-y`}
            placeholder="Abra seu perfil no LinkedIn, selecione tudo (Ctrl+A) e cole aqui..."
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
          />
        ) : (
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-gray-800"
            />
            <p className="mt-2 text-xs text-gray-500">
              No LinkedIn: seu perfil → <strong>Mais</strong> →{" "}
              <strong>Salvar como PDF</strong>, depois envie o arquivo aqui.
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isPending}
        className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Gerando currículo e carta..." : "Gerar currículo + carta"}
      </button>
    </form>
  );
}
