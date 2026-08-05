import { AppLayout } from '@/components/layout/AppLayout';

export default function ComparativoPage() {
  return (
    <AppLayout>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-[#005696] mb-4">Módulo Planejamento Comparativo</h2>
        <p className="text-gray-600">Este módulo cruzará os dados da empresa nos 3 regimes para encontrar o modelo mais vantajoso no ano fiscal.</p>
      </div>
    </AppLayout>
  );
}
