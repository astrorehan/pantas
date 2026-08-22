import { Container } from "@/components/container";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="flex flex-1 flex-col py-6">
      <Skeleton className="h-12 w-full max-w-xs" />
      <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Container>
  );
}
