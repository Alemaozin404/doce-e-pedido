"use client";

/** Boundary de erro global (runtime). */
import Button from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span aria-hidden="true" className="text-7xl">🫢</span>
      <h1 className="mt-6 font-display text-3xl text-chocolate-dark sm:text-4xl">Algo deu errado</h1>
      <p className="mt-3 max-w-md text-sm text-chocolate-light">
        Encontramos um erro inesperado. Tente novamente em alguns instantes.
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-4 max-w-md rounded-2xl bg-red-50 p-3 text-xs text-red-700">{error.message}</p>
      )}
      <div className="mt-8">
        <Button onClick={reset} variant="primary">Tentar novamente</Button>
      </div>
    </div>
  );
}
