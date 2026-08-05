import { AppLayout } from '@/components/layout/AppLayout';

export default function LucroRealPage() {
  return (
    <AppLayout>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-[#005696] mb-4">Módulo Lucro Real</h2>
        <p className="text-gray-600">Este módulo está em desenvolvimento. Ele fará apuração complexa com base no lucro contábil, adições, exclusões e regime não cumulativo.</p>
      </div>
    </AppLayout>
  );
}
