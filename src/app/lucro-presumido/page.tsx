'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useLucroPresumidoStore } from '@/store/useLucroPresumidoStore';
import { Step1CompanyData } from '@/components/features/shared/Step1CompanyData';
import { Step3Receitas } from '@/components/features/lucro-presumido/Step3Receitas';
import { Step3ConfigAliquotas } from '@/components/features/lucro-presumido/Step3ConfigAliquotas';
import { Step4Despesas } from '@/components/features/lucro-presumido/Step4Despesas';
import { Step5Resultados } from '@/components/features/lucro-presumido/Step5Resultados';

export default function LucroPresumidoPage() {
  const currentStep = useLucroPresumidoStore((state) => state.currentStep);
  const setStep = useLucroPresumidoStore((state) => state.setStep);
  const saveClient = useLucroPresumidoStore((state) => state.saveClient);
  const newClient = useLucroPresumidoStore((state) => state.newClient);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CompanyData 
            onNext={() => setStep(2)}
            onSave={saveClient}
            onClear={newClient}
          />
        );
      case 2:
        return <Step3Receitas />;
      case 3:
        return <Step4Despesas />;
      case 4:
        return <Step3ConfigAliquotas />;
      case 5:
        return <Step5Resultados />;
      default:
        return (
          <Step1CompanyData 
            onNext={() => setStep(2)}
            onSave={saveClient}
            onClear={newClient}
          />
        );
    }
  };

  return (
    <AppLayout>
      {renderStep()}
    </AppLayout>
  );
}
