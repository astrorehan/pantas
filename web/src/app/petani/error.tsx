"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function PetaniError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorScreen
      error={error}
      retry={unstable_retry}
      homeHref="/petani"
    />
  );
}
