import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActiveCategories } from "@/lib/catalog";
import { SubmitForm } from "@/components/SubmitForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aportar video" };

export default async function EnviarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/enviar");

  const categories = await getActiveCategories();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-8">
      <div className="mb-8 flex items-start gap-4">
        <span
          className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Aportar un video
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            ¿Un video que te ayudó a aprender? Compártelo con la comunidad. Aparece
            al instante y la gente lo hace subir con sus votos.
          </p>
        </div>
      </div>

      <SubmitForm categories={categories} />
    </main>
  );
}
