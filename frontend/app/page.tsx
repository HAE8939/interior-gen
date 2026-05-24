import { FormShell } from "@/components/form/FormShell";
import { ConfigBar } from "@/components/layout/ConfigBar";
import { Header } from "@/components/layout/Header";
import { ErrorLog } from "@/components/preview/ErrorLog";
import { FormStateJson } from "@/components/preview/FormStateJson";
import { ImageStudio } from "@/components/preview/ImageStudio";
import { PromptPreview } from "@/components/preview/PromptPreview";
import { ErrorLogProvider } from "@/lib/error-log-context";
import { FormProvider } from "@/lib/form-context";
import { SettingsProvider } from "@/lib/settings-context";

export default function Home() {
  return (
    <ErrorLogProvider>
      <SettingsProvider>
        <FormProvider>
          {/* ── Top config bar (always visible) ── */}
          <ConfigBar />

          <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
            <Header />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ── Left: form (≈60%) ── */}
              <section className="lg:col-span-7 space-y-4">
                <FormShell />
              </section>

              {/* ── Right: preview (≈40%, sticky) ── */}
              <aside className="lg:col-span-5">
                <div className="lg:sticky lg:top-6 space-y-4">
                  <PromptPreview />
                  <ImageStudio />
                  <FormStateJson />
                  <ErrorLog />
                </div>
              </aside>
            </div>
          </div>
        </FormProvider>
      </SettingsProvider>
    </ErrorLogProvider>
  );
}
