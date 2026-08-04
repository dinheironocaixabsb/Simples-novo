'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useDiagnosisStore } from '@/store/useDiagnosisStore';
import { Step1CompanyData } from '@/components/features/simples-nacional/Step1CompanyData';
import { Step2RevenueData } from '@/components/features/simples-nacional/Step2RevenueData';
import { Step3Config } from '@/components/features/simples-nacional/Step3Config';
import { Step4Expenses } from '@/components/features/simples-nacional/Step4Expenses';
import { Step5Dashboard } from '@/components/features/simples-nacional/Step5Dashboard';
import { Step6Excel } from '@/components/features/simples-nacional/Step6Excel';
import { Step7Report } from '@/components/features/simples-nacional/Step7Report';

export default function SimplesNacionalPage() {
  const currentStep = useDiagnosisStore((state) => state.currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CompanyData />;
      case 2:
        return <Step2RevenueData />;
      case 3:
        return <Step3Config />;
      case 4:
        return <Step4Expenses />;
      case 5:
        return <Step5Dashboard />;
      case 6:
        return <Step6Excel />;
      case 7:
        return <Step7Report />;
      default:
        return <Step1CompanyData />;
    }
  };

  return (
    <AppLayout>
      {renderStep()}
    </AppLayout>
  );
}
