'use client';

import React, { useState } from 'react';
import { useClientStore } from '../../../store/useClientStore';
import { User, Folder } from 'lucide-react';

interface Step1CompanyDataProps {
  onNext: () => void;
  onSave: () => void;
  onClear: () => void;
}

export function Step1CompanyData({ onNext, onSave, onClear }: Step1CompanyDataProps) {
  const { activeCompanyData: companyData, updateActiveCompanyData: updateCompanyData } = useClientStore();
  const [isFetching, setIsFetching] = useState(false);

  const handleSave = () => {
    if (!companyData.cnpj) {
      alert('Por favor, cadastre a empresa (CNPJ) antes de salvar.');
      return;
    }
    onSave();
    const name = companyData.razaoSocial || `Cliente ${companyData.cnpj}`;
    alert('Dados salvos com sucesso no cliente: ' + name);
  };

  const handleClear = () => {
    if (confirm('Deseja realmente excluir/limpar todos os dados não salvos?')) {
      onClear();
    }
  };

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const fetchCNPJ = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return;
    
    setIsFetching(true);
    try {
      let data = null;
      let fromBrasilApi = false;
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
      if (response.ok) {
        data = await response.json();
      } else {
        const resp2 = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        if (resp2.ok) {
          data = await resp2.json();
          fromBrasilApi = true;
        }
      }

      if (data) {
        if (!fromBrasilApi) {
          let responsavel = '';
          if (data.socios && data.socios.length > 0) responsavel = data.socios[0].nome;
          
          let ie = '';
          if (data.estabelecimento?.inscricoes_estaduais?.length > 0) {
            const ativas = data.estabelecimento.inscricoes_estaduais.filter((i: any) => i.ativo);
            ie = ativas.length > 0 ? ativas[0].inscricao_estadual : data.estabelecimento.inscricoes_estaduais[0].inscricao_estadual;
          }

          const secundarias = data.estabelecimento?.atividades_secundarias || [];
          const cnaesArray = secundarias.slice(0, 14).map((c: any) => c.id || '');
          const paddedCnaes = [...cnaesArray, ...Array(14 - cnaesArray.length).fill('')];

          updateCompanyData({ 
            razaoSocial: data.razao_social || data.estabelecimento?.nome_fantasia || '',
            responsavelReceita: responsavel,
            inscricaoEstadual: ie,
            cnaePrincipal: data.estabelecimento?.atividade_principal?.id || '',
            cnaesSecundarios: paddedCnaes,
            cep: data.estabelecimento?.cep || '',
            endereco: data.estabelecimento ? `${data.estabelecimento.tipo_logradouro} ${data.estabelecimento.logradouro}, ${data.estabelecimento.numero} - ${data.estabelecimento.bairro}, ${data.estabelecimento.cidade?.nome} - ${data.estabelecimento.estado?.sigla}` : ''
          });
        } else {
          // Brasil API mapping
          const cnaesArray = (data.cnaes_secundarios || []).slice(0, 14).map((c: any) => c.codigo || '');
          const paddedCnaes = [...cnaesArray, ...Array(14 - cnaesArray.length).fill('')];
          let responsavel = '';
          if (data.qsa && data.qsa.length > 0) responsavel = data.qsa[0].nome_socio;

          updateCompanyData({
            razaoSocial: data.razao_social || data.nome_fantasia || '',
            responsavelReceita: responsavel,
            inscricaoEstadual: '',
            cnaePrincipal: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
            cnaesSecundarios: paddedCnaes,
            cep: data.cep || '',
            endereco: data.logradouro ? `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}` : ''
          });
        }
      } else {
        alert('Atenção: Não foi possível buscar os dados do CNPJ automaticamente. Por favor, preencha manualmente.');
      }
    } catch (err) {
      console.error(err);
      alert('Atenção: Erro ao buscar os dados do CNPJ. Verifique sua conexão ou tente novamente.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCNPJ(e.target.value);
    updateCompanyData({ cnpj: masked });
    if (masked.length === 18) {
      fetchCNPJ(masked);
    }
  };

  const updateCnaeSecundario = (index: number, value: string) => {
    const newCnaes = [...(companyData.cnaesSecundarios || Array(14).fill(''))];
    newCnaes[index] = value;
    updateCompanyData({ cnaesSecundarios: newCnaes });
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] uppercase tracking-wide">DADOS CADASTRAIS</h1>
        <p className="text-[#6b7280] text-[15px]">Informe os dados cadastrais da empresa.</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Card 1: Identificação da Empresa */}
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-none p-8">
          <h3 className="flex items-center gap-2 text-[#005696] font-bold text-[16px] border-b-[3px] border-[#005696] pb-2 mb-6 w-fit pr-4">
            <User className="w-5 h-5" />
            Identificação da Empresa
          </h3>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-gray-700">Razão Social / Nome</label>
              <input 
                type="text" 
                value={companyData.razaoSocial || ''}
                onChange={(e) => updateCompanyData({ razaoSocial: e.target.value })}
                className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                placeholder="" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-gray-700">Responsável perante a Receita Federal</label>
              <input 
                type="text" 
                value={companyData.responsavelReceita || ''}
                onChange={(e) => updateCompanyData({ responsavelReceita: e.target.value })}
                className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                placeholder="" 
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-gray-700">CNPJ {isFetching && <span className="text-[#005696] font-normal animate-pulse">Buscando...</span>}</label>
                <input 
                  type="text" 
                  value={companyData.cnpj || ''}
                  onChange={handleCnpjChange}
                  className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                  placeholder="" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-gray-700">Inscrição Estadual/Municipal</label>
                <input 
                  type="text" 
                  value={companyData.inscricaoEstadual || ''}
                  onChange={(e) => updateCompanyData({ inscricaoEstadual: e.target.value })}
                  className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                  placeholder="" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-gray-700">CEP</label>
                <input 
                  type="text" 
                  value={companyData.cep || ''}
                  onChange={(e) => updateCompanyData({ cep: e.target.value })}
                  className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                  placeholder="" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-gray-700">Endereço</label>
              <input 
                type="text" 
                value={companyData.endereco || ''}
                onChange={(e) => updateCompanyData({ endereco: e.target.value })}
                className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                placeholder="" 
              />
            </div>
          </div>
        </div>

        {/* Card 2: Atividades (CNAEs) */}
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-none p-8">
          <h3 className="flex items-center gap-2 text-[#005696] font-bold text-[16px] border-b-[3px] border-[#005696] pb-2 mb-6 w-fit pr-4">
            <Folder className="w-5 h-5" />
            Atividades (CNAEs)
          </h3>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-gray-700">CNAE Principal</label>
              <input 
                type="text" 
                value={companyData.cnaePrincipal || ''}
                onChange={(e) => updateCompanyData({ cnaePrincipal: e.target.value })}
                className="border border-gray-200 rounded-md px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696] w-full" 
                placeholder="" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-gray-700">CNAEs Secundários (Até 14)</label>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <input 
                    key={idx}
                    type="text" 
                    value={(companyData.cnaesSecundarios || [])[idx] || ''}
                    onChange={(e) => updateCnaeSecundario(idx, e.target.value)}
                    className="border border-gray-200 rounded-md px-2 py-1.5 text-[14px] text-center focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                    placeholder={idx === 0 ? "0000-0/00" : `${idx + 1}º CNAE Secundário`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div className="mt-12 flex justify-end gap-3 pb-8">
        <button className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2.5 px-6 rounded-md transition-colors shadow-sm" onClick={() => window.print()}>
          Imprimir
        </button>
        <button 
          onClick={handleSave}
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2.5 px-6 rounded-md transition-colors shadow-sm"
        >
          Salvar Diagnóstico
        </button>
        <button 
          onClick={handleClear}
          className="bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-[15px] py-2.5 px-6 rounded-md transition-colors shadow-sm"
        >
          Excluir Dados
        </button>
        <button 
          onClick={onNext}
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2.5 px-6 rounded-md transition-colors shadow-sm"
        >
          Avançar
        </button>
      </div>
    </div>
  );
}
