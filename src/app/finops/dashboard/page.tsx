import { PageHeader } from "@/components/finops/page-header";

export default function DashboardPage() {
  return (
    <main className="min-h-dvh bg-background pb-10">
      <PageHeader title="Dashboard" />
      <div className="mx-auto w-full max-w-md px-4 pt-10 text-center">
        <p className="text-sm text-muted-foreground">
          Deeper spending analytics are coming soon.
        </p>
      </div>
    </main>
  );
}
