import React, { useCallback, useState } from 'react';
import { UploadCloud, X, File, AlertCircle, CheckCircle2 } from 'lucide-react';

import { parsePgdasFile, PgdasData } from '../../../utils/pgdasParser';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const updateRevenueData = useDiagnosisStore(state => state.updateRevenueData);

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Lendo arquivo(s)... Aguarde.' });
    
    let processed = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extractedArray = await parsePgdasFile(file);
        
        for (const extracted of extractedArray) {
          if (extracted && extracted.competencia) {
            const [mesStr] = extracted.competencia.split('/');
            const monthIndex = parseInt(mesStr, 10) - 1;
            
            if (monthIndex >= 0 && monthIndex <= 11) {
              const anexosAtivos: any[] = [];
              const anexosData: any = {};
              
              if (extracted.anexos) {
                Object.entries(extracted.anexos).forEach(([anexoId, data]) => {
                  anexosAtivos.push(anexoId);
                  anexosData[anexoId] = {
                    mercadoInterno: data.interno || 0,
                    mercadoExterno: data.externo || 0,
                    hasSt: data.hasSt || false,
                    isIcmsStSegregado: data.hasSt || false, // Mapeia hasSt para isIcmsStSegregado no UI
                    receitaComIcmsSt: data.comSt || 0
                  };
                });
              }

              updateRevenueData(monthIndex, {
                competencia: extracted.competencia,
                rbt12: extracted.rbt12,
                rba: extracted.rba,
                rbaa: extracted.rbaa,
                anexosAtivos,
                anexosData: { ...useDiagnosisStore.getState().revenueData[monthIndex].anexosData, ...anexosData }
              });
              processed++;
            }
          }
        }
      }

      setIsProcessing(false);
      
      if (processed > 0) {
        setStatus({ 
          type: 'success', 
          message: `Importação concluída! ${processed} mês(es) extraído(s) com sucesso.` 
        });
        
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ 
          type: 'error', 
          message: 'Nenhum dado válido de PGDAS encontrado nos arquivos.' 
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setStatus({ 
        type: 'error', 
        message: `Erro ao processar: ${err.message}` 
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1f2937]">Importação Automática</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-500 text-center">
            Arraste os PDFs ou Planilhas Excel dos <strong>Extratos do Simples Nacional</strong> ou <strong>DRE</strong> para extrair os dados e criar os meses automaticamente.
          </p>
          
          <div 
            className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-[#005696] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('pgdasFileInput')?.click()}
          >
            <UploadCloud className="w-10 h-10 text-[#005696] mx-auto mb-3" />
            <span className="block text-gray-700 font-medium text-[15px] mb-1">
              Arraste os arquivos aqui ou <strong>clique para buscar</strong>
            </span>
            <span className="text-[13px] text-gray-400">
              Suporta: .pdf, .xls, .xlsx, .csv
            </span>
            <input 
              type="file" 
              id="pgdasFileInput" 
              accept=".pdf, .xls, .xlsx, .csv" 
              className="hidden" 
              multiple
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }} 
            />
          </div>

          {status && (
            <div className={`mt-2 p-3 rounded flex items-center gap-2 text-sm
              ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
              ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
              ${status.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
            `}>
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {status.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {status.type === 'info' && <File className="w-4 h-4 animate-pulse" />}
              {status.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            className="px-4 py-2 text-[15px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <div className="text-[13px] text-gray-400 text-right w-[60%] leading-tight">
            Ao importar, os dados preenchidos na tela correspondente serão <strong>substituídos</strong> pelos novos valores.
          </div>
        </div>
      </div>
    </div>
  );
}
