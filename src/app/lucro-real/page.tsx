"use client";

import { Sidebar } from "@/components/features/lucro-real/Sidebar";
import { useLucroRealStore } from "@/store/useLucroRealStore";
import { Step1Cadastro } from "@/components/features/lucro-real/Step1Cadastro";
import { Step2Faturamento } from "@/components/features/lucro-real/Step2Faturamento";
import { Step3ImpostosRenda } from "@/components/features/lucro-real/Step3ImpostosRenda";
import { Step3Aliquotas } from "@/components/features/lucro-real/Step3Aliquotas";
import { Step4Xml } from "@/components/features/lucro-real/Step4Xml";
import { Step5Dashboard } from "@/components/features/lucro-real/Step5Dashboard";
import { Step6Relatorio } from "@/components/features/lucro-real/Step6Relatorio";

export default function LucroRealPage() {
  const currentStep = useLucroRealStore((state) => state.currentStep);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 pb-36 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          {currentStep === 1 && <Step1Cadastro />}
          {currentStep === 2 && <Step2Faturamento />}
          {currentStep === 3 && <Step3ImpostosRenda />}
          {currentStep === 4 && <Step3Aliquotas />}
          {currentStep === 5 && <Step4Xml />}
          {currentStep === 6 && <Step5Dashboard />}
          {currentStep === 7 && <Step6Relatorio />}
        </div>
      </main>
    </div>
  );
}
