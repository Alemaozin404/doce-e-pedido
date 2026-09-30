import Skeleton from "@/components/ui/Skeleton";

export default function LoadingCardapio() {
  return (
    <div className="container-site py-10 sm:py-14">
      <Skeleton className="mx-auto h-12 w-64" />
      <Skeleton className="mx-auto mt-4 h-5 w-96 max-w-full" />
      <div className="mx-auto mt-8 max-w-md">
        <Skeleton className="h-12 rounded-full" />
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-soft">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
