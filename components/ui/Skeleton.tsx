/** Skeleton de carregamento com efeito shimmer. */

export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-gradient-to-r from-cream-dark via-white to-cream-dark bg-[length:400px_100%] ${className}`}
    />
  );
}
