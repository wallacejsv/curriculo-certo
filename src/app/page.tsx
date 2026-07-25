"use client";

import dynamic from "next/dynamic";
import { useMutation } from "@tanstack/react-query";
import { JobForm } from "@/components/JobForm";
import type { Application } from "@/lib/schema";

// @react-pdf/renderer só funciona no browser — carregado sem SSR.
const ResultView = dynamic(
  () => import("@/components/ResultView").then((m) => m.ResultView),
  { ssr: false },
);

export default function Home() {
  const mutation = useMutation<Application, Error, FormData>({
    mutationFn: async (formData) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Falha ao gerar. Tente novamente.");
      }
      return (await res.json()) as Application;
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Currículo Certo
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Cole a vaga e seu LinkedIn. A gente monta um currículo em PDF e uma
          carta de apresentação sob medida — no idioma da vaga.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <JobForm
          onSubmit={(fd) => mutation.mutate(fd)}
          isPending={mutation.isPending}
        />
      </div>

      {mutation.isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {mutation.error.message}
        </div>
      )}

      {mutation.isPending && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Analisando a vaga e ajustando seu perfil...
        </div>
      )}

      {mutation.isSuccess && (
        <div className="mt-8">
          <ResultView data={mutation.data} />
        </div>
      )}
    </main>
  );
}
