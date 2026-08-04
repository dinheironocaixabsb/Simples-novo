import Link from 'next/link';

export default function HomeDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center font-sans text-gray-900">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#005696] mb-4">Sistema de Planejamento Tributário</h1>
          <p className="text-gray-600 text-lg">Selecione o módulo que deseja acessar para iniciar ou continuar um diagnóstico.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Módulo Simples Nacional */}
          <Link href="/simples-nacional" className="block group">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-[#005696] hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                SN
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Simples Nacional</h2>
              <p className="text-gray-500 text-sm">
                Diagnóstico completo, importação de PGDAS-D, análise de fator R e cenários tributários para empresas do Simples.
              </p>
            </div>
          </Link>

          {/* Módulo Lucro Presumido */}
          <Link href="/lucro-presumido" className="block group">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-[#005696] hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                LP
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Lucro Presumido</h2>
              <p className="text-gray-500 text-sm">
                Cálculo de presunção, IRPJ, CSLL, PIS e COFINS com base na receita bruta e regime cumulativo. (Em desenvolvimento)
              </p>
            </div>
          </Link>

          {/* Módulo Lucro Real */}
          <Link href="/lucro-real" className="block group">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-[#005696] hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                LR
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Lucro Real</h2>
              <p className="text-gray-500 text-sm">
                Apuração complexa com base no lucro contábil, adições, exclusões e regime não cumulativo. (Em desenvolvimento)
              </p>
            </div>
          </Link>

          {/* Módulo Comparativo */}
          <Link href="/comparativo" className="block group">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Planejamento Comparativo</h2>
              <p className="text-gray-500 text-sm">
                Cruze os dados da empresa nos 3 regimes para encontrar o modelo mais vantajoso no ano fiscal. (Em desenvolvimento)
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
