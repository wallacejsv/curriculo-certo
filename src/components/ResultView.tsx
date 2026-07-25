"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Application } from "@/lib/schema";
import { ResumeDocument } from "@/pdf/ResumeDocument";
import { CoverLetterDocument } from "@/pdf/CoverLetterDocument";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ResultView({ data }: { data: Application }) {
  const { resume, coverLetter } = data;
  const [busy, setBusy] = useState<null | "resume" | "cover">(null);
  const base = slugify(`${resume.contact.name}-${resume.headline}`) || "curriculo";

  async function downloadResume() {
    setBusy("resume");
    try {
      const blob = await pdf(<ResumeDocument resume={resume} />).toBlob();
      await downloadBlob(blob, `curriculo-${base}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  async function downloadCover() {
    setBusy("cover");
    try {
      const blob = await pdf(
        <CoverLetterDocument
          coverLetter={coverLetter}
          contact={resume.contact}
          language={resume.language}
        />,
      ).toBlob();
      await downloadBlob(blob, `carta-${base}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={downloadResume}
          disabled={busy !== null}
          className={`${btn} bg-gray-900 text-white hover:bg-gray-800`}
        >
          {busy === "resume" ? "Gerando PDF..." : "⬇ Baixar Currículo (PDF)"}
        </button>
        <button
          onClick={downloadCover}
          disabled={busy !== null}
          className={`${btn} border border-gray-900 bg-white text-gray-900 hover:bg-gray-50`}
        >
          {busy === "cover" ? "Gerando PDF..." : "⬇ Baixar Carta (PDF)"}
        </button>
      </div>

      {resume.keywordsMatched.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Requisitos da vaga cobertos ({resume.keywordsMatched.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resume.keywordsMatched.map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-white px-2.5 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preview do currículo */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">{resume.contact.name}</h2>
        <p className="text-sm text-gray-600">{resume.headline}</p>

        <Preview title="Resumo">
          <p className="text-sm text-gray-700">{resume.summary}</p>
        </Preview>

        <Preview title="Experiência">
          <div className="space-y-3">
            {resume.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {exp.role}{" "}
                    <span className="font-normal text-gray-600">
                      — {exp.company}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{exp.period}</p>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-gray-700">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Preview>

        <Preview title="Competências">
          <p className="text-sm text-gray-700">{resume.skills.join(" • ")}</p>
        </Preview>

        {resume.education.length > 0 && (
          <Preview title="Formação">
            <ul className="space-y-1">
              {resume.education.map((ed, i) => (
                <li key={i} className="text-sm text-gray-700">
                  <span className="font-medium">{ed.degree}</span> —{" "}
                  {ed.institution}
                  {ed.year ? ` (${ed.year})` : ""}
                </li>
              ))}
            </ul>
          </Preview>
        )}
      </section>

      {/* Preview da carta */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Carta de apresentação
        </h3>
        <p className="mb-3 text-sm text-gray-700">{coverLetter.greeting}</p>
        {coverLetter.paragraphs.map((p, i) => (
          <p key={i} className="mb-3 text-sm text-gray-700">
            {p}
          </p>
        ))}
        <p className="text-sm text-gray-700">{coverLetter.closing}</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          {resume.contact.name}
        </p>
      </section>
    </div>
  );
}

function Preview({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}
