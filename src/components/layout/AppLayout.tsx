'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useClientStore } from '../../store/useClientStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    activeFirmData: firmData, 
    activeProfessionalData: professionalData 
  } = useClientStore();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <main className="flex-1 p-8">
          <div className="max-w-[1400px] w-full mx-auto">
            {children}
          </div>
        </main>
        
        {/* Global Footer */}
        <footer className="mt-auto px-8 pb-4">
          <div className="max-w-[1400px] w-full mx-auto flex justify-between items-end border-t border-gray-200 pt-6">
            <div className="text-left text-gray-500">
              <strong className="block text-[15px] text-gray-800">{firmData.nome || 'S&L Contabilidade Consultoria e Auditoria SS'}</strong>
              <div className="text-[13px] leading-relaxed">
                {firmData.endereco || 'CNPJ 12... | Conjunto J Casa 20'}<br/>
                {firmData.telefone || '6192887181'}<br/>
                {firmData.email || 'isaac.leo44@gmail.com'}
              </div>
            </div>
            
            <div className="text-right text-gray-500">
              <strong className="block text-[15px] text-gray-800">Profissional Responsável</strong>
              <div className="text-[13px] leading-relaxed">
                {professionalData.nome || 'Isaac Leonidas de Assunção Lopes'}<br/>
                {professionalData.cargo || 'Contador'}<br/>
                {professionalData.crc || 'CRC/DF 015889-05'}
              </div>
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto mt-4 text-[9px] text-gray-400 text-center px-4 leading-tight">
            Proteção de Dados (LGPD): Este sistema atua em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), não transmitindo ou armazenando dados em servidores externos (processamento 100% local no navegador).<br/>
            Aviso de Responsabilidade: As informações apresentadas possuem caráter consultivo e analítico. A decisão final pela opção do regime de recolhimento do IBS e CBS (Por Dentro ou Por Fora do Simples Nacional) cabe única e exclusivamente ao cliente administrador da empresa.
          </div>
        </footer>
      </div>
    </div>
  );
}
