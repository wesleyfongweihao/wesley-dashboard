import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <Link href="/finops">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>FinOps</CardTitle>
              <CardDescription>Finance Operations</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* More modules go here */}
      </div>
    </main>
  );
}
