'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useLucroPresumidoStore } from '@/store/useLucroPresumidoStore';
import { Step1Config } from '@/components/features/lucro-presumido/Step1Config';
import { Step2Receitas } from '@/components/features/lucro-presumido/Step2Receitas';
import { Step3Despesas } from '@/components/features/lucro-presumido/Step3Despesas';
import { Step4Resultados } from '@/components/features/lucro-presumido/Step4Resultados';

export default function LucroPresumidoPage() {
  const currentStep = useLucroPresumidoStore((state) => state.currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Config />;
      case 2:
        return <Step2Receitas />;
      case 3:
        return <Step3Despesas />;
      case 4:
        return <Step4Resultados />;
      default:
        return <Step1Config />;
    }
  };

  return (
    <AppLayout>
      {renderStep()}
    </AppLayout>
  );
}
