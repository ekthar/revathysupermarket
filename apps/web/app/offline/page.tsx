import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl font-black">You are offline</h1>
      <p className="mt-3 text-muted-foreground">Some saved pages may still work. Reconnect to place or update orders.</p>
      <Button asChild className="mt-6">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
