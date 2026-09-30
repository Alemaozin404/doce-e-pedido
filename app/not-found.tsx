import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span aria-hidden="true" className="text-7xl">🍪</span>
      <h1 className="mt-6 font-display text-4xl text-chocolate-dark sm:text-5xl">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-chocolate-light">
        Parece que este doce saiu do menu. Volte ao cardápio para encontrar algo delicioso.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/cardapio" variant="primary">Ver cardápio</Button>
        <Link href="/" className="rounded-full px-7 py-3.5 text-sm text-chocolate underline-offset-4 hover:underline sm:text-base">
          Ir para a página inicial
        </Link>
      </div>
    </div>
  );
}
