export interface ExpenseNote {
    id?: string;
    data?: string; // Formato DD/MM/YYYY
    valor?: number | string;
    tipoDespesa?: string | boolean;
    regime?: string;
    xmlType?: string;
    fileName?: string;
    category?: string;
    descricao?: string;
    fornecedor?: string;
}

export interface CustomCategory {
    value: string;
    base: string;
}

export interface ExpenseValues {
    despesaGeral: number;           // Normal
    despesaCreditoIntegral: number; // Produtos Tribut. Normal (Crédito 100%)
    despesaAnexo1: number;          // Anexo I: Alimentos (Zero - 0%)
    despesaAnexo15: number;         // Anexo XV: Hortifruti (100%)
    despesaAnexo7: number;          // Anexo VII: Alimentos (60%)
    despesaAnexo8: number;          // Anexo VIII: Higiene (60%)
}

export interface ExtractedSimplesResult {
    ajustadoTotalBruto: number;
    totalSimples: number;
    totalSimplesReduzido30: number; // Redução aplicável a 30% ou categorias reduzidas
}

export interface ExpenseCalculationResult {
    totalGeral: number;
    totalCreditoBruto: number;
    totalCreditoReduzido30: number;
    totalCreditoSimplesNacional: number;
    totalCreditoSimplesNacionalReduzido30: number;
    breakdownItems: Array<{ name: string; value: number }>;
}

/**
 * Helper para normalizar strings para comparações
 */
export function normalizeStr(str?: string): string {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Função responsável por mapear uma nota para uma categoria correta
 * (usada para determinar a elegibilidade do crédito para Simples Nacional)
 */
export function getCorrectCategory(note: ExpenseNote, customCategories?: CustomCategory[]): string {
    if (!note) return 'outros_servicos';
    
    const cat = note.category;
    
    if (customCategories && customCategories.length > 0) {
        const customCat = customCategories.find(c => c.value === cat);
        if (customCat) {
            return customCat.base || 'outros_servicos';
        }
    }

    let resultCat = 'outros_servicos';

    if (cat === 'contabilidade' || cat === 'advogados' || cat === 'seguranca' || 
        cat === 'limpeza' || cat === 'frete' || cat === 'vale_transporte' || 
        cat === 'vale_refeicao' || cat === 'taxas_cartoriais') {
        resultCat = cat;
    } else {
        const desc = normalizeStr(note.descricao);
        const fornecedor = normalizeStr(note.fornecedor);

        // 1. Description checks
        if (desc.includes('contab') || desc.includes('audito')) resultCat = 'contabilidade';
        else if (desc.includes('advog') || desc.includes('jurid') || desc.includes('honorarios')) resultCat = 'advogados';
        else if (desc.includes('seguran') || desc.includes('vigil')) resultCat = 'seguranca';
        else if (desc.includes('limpez') || desc.includes('higien') || desc.includes('conservacao')) resultCat = 'limpeza';
        else if (desc.includes('vale transporte') || desc.includes(' vt ')) resultCat = 'vale_transporte';
        else if (desc.includes('vale refeicao') || desc.includes(' vr ') || desc.includes('ticket refeicao') || desc.includes('vale refeicao')) resultCat = 'vale_refeicao';
        else if (desc.includes('cartorio') || desc.includes('emolumento') || desc.includes('tabeliao') || desc.includes('cartoriais')) resultCat = 'taxas_cartoriais';
        else if (desc.includes('frete') || desc.includes('logistica') || desc.includes('transportes')) resultCat = 'frete';
        
        // 2. Supplier name checks
        else if (fornecedor.includes('contab') || fornecedor.includes('audito')) resultCat = 'contabilidade';
        else if (fornecedor.includes('advog') || fornecedor.includes('jurid') || fornecedor.includes('advocacia')) resultCat = 'advogados';
        else if (fornecedor.includes('seguran') || fornecedor.includes('vigil')) resultCat = 'seguranca';
        else if (fornecedor.includes('limpez') || fornecedor.includes('higien') || fornecedor.includes('conservacao')) resultCat = 'limpeza';
        else if (fornecedor.includes('vale transporte') || fornecedor.includes(' vt ')) resultCat = 'vale_transporte';
        else if (fornecedor.includes('pluxee') || fornecedor.includes('sodexo') || fornecedor.includes('ticket') || fornecedor.includes('refeicao') || fornecedor.includes('alimentacao')) resultCat = 'vale_refeicao';
        else if (fornecedor.includes('cartorio') || fornecedor.includes('tabelia') || fornecedor.includes('notari')) resultCat = 'taxas_cartoriais';
        else if (fornecedor.includes('transportes') || fornecedor.includes('logistica') || fornecedor.includes('frete')) resultCat = 'frete';

        // 3. Fallbacks
        else if (cat === 'insumos') resultCat = 'insumos';
        else if (cat === 'frete') resultCat = 'frete';
        else if (cat === 'vale_transporte') resultCat = 'vale_transporte';
        else if (cat === 'vale_refeicao') resultCat = 'vale_refeicao';
        else if (cat === 'taxas_cartoriais') resultCat = 'taxas_cartoriais';
    }

    // Se for contabilidade ou advogados MAS do Simples Nacional, joga para as novas categorias
    if (resultCat === 'contabilidade' && note.regime === "Simples Nacional") {
        return 'contabilidade_simples';
    }
    if (resultCat === 'advogados' && note.regime === "Simples Nacional") {
        return 'advogados_simples';
    }

    return resultCat;
}

/**
 * Extrai os valores do Simples Nacional da base bruta de crédito.
 */
export function extractSimplesNacionalFromGrossCredit(
    activeNotes: ExpenseNote[],
    rawTotalBruto: number,
    customCategories?: CustomCategory[]
): ExtractedSimplesResult {
    let totalSimples = 0;
    let totalSimplesReduzido30 = 0;
    let ajustadoTotalBruto = rawTotalBruto;

    if (activeNotes && activeNotes.length > 0) {
        activeNotes.forEach(note => {
            const isCredit = note.tipoDespesa === "Gera crédito de IBS/CBS" || 
                             note.tipoDespesa === true || 
                             note.tipoDespesa === 'true' || 
                             note.tipoDespesa === 'Gera crédito';
                             
            if (isCredit && note.regime === 'Simples Nacional') {
                const valor = typeof note.valor === 'string' ? parseFloat(note.valor) : (note.valor || 0);
                const valorLiquido = valor;
                
                // Por instrução, deduções (ISS/ICMS/PIS/COFINS) NÃO DEVEM ser descontadas 
                // para notas do Simples Nacional. O valor do crédito é baseado no cheio.
                if (valorLiquido > 0) {
                    let isReduzida = false;
                    const cat = getCorrectCategory(note, customCategories);
                    
                    if (cat === 'contabilidade' || cat === 'contabilidade_simples' || 
                        cat === 'advogados' || cat === 'advogados_simples' || 
                        cat === 'taxas_cartoriais') {
                        isReduzida = true;
                    }
                    
                    if (isReduzida) {
                        totalSimplesReduzido30 += valorLiquido;
                    } else {
                        totalSimples += valorLiquido;
                    }
                    ajustadoTotalBruto -= valorLiquido;
                }
            }
        });
    }
    
    if (ajustadoTotalBruto < 0) ajustadoTotalBruto = 0;
    
    return { ajustadoTotalBruto, totalSimples, totalSimplesReduzido30 };
}

/**
 * Categoriza e calcula os totais de despesas pelas regras de elegibilidade (100%, 60%, 30%, 0%)
 */
export function calcularTotaisDespesas(
    values: ExpenseValues,
    activeNotes: ExpenseNote[],
    customCategories?: CustomCategory[]
): ExpenseCalculationResult {
    const vGeral = values.despesaGeral || 0;
    const vCreditoIntegral = values.despesaCreditoIntegral || 0;
    const vAnexo1 = values.despesaAnexo1 || 0;
    const vAnexo15 = values.despesaAnexo15 || 0;
    const vAnexo7 = values.despesaAnexo7 || 0;
    const vAnexo8 = values.despesaAnexo8 || 0;
    
    const totalGeral = vGeral + vCreditoIntegral + vAnexo1 + vAnexo15 + vAnexo7 + vAnexo8;
    
    // 100% de crédito
    let totalCreditoBruto = vGeral + vCreditoIntegral + vAnexo15;
    
    // 60% de crédito (ou redutor aplicável)
    const totalCreditoReduzido30 = vAnexo7 + vAnexo8;
    
    // Extrai as despesas do Simples Nacional que foram agrupadas no totalCreditoBruto
    const extracao = extractSimplesNacionalFromGrossCredit(activeNotes, totalCreditoBruto, customCategories);
    totalCreditoBruto = extracao.ajustadoTotalBruto;
    const totalCreditoSimplesNacional = extracao.totalSimples;
    const totalCreditoSimplesNacionalReduzido30 = extracao.totalSimplesReduzido30;
    
    const breakdownItems: Array<{name: string; value: number}> = [];
    
    if (vGeral > 0) breakdownItems.push({ name: 'Despesa Geral (Normal)', value: vGeral });
    if (vCreditoIntegral > 0) breakdownItems.push({ name: 'Produtos Tribut. Normal (Crédito 100%)', value: vCreditoIntegral });
    if (vAnexo1 > 0) breakdownItems.push({ name: 'Anexo I: Alimentos (Zero)', value: vAnexo1 });
    if (vAnexo15 > 0) breakdownItems.push({ name: 'Anexo XV: Hortifruti (100%)', value: vAnexo15 });
    if (vAnexo7 > 0) breakdownItems.push({ name: 'Anexo VII: Alimentos (60%)', value: vAnexo7 });
    if (vAnexo8 > 0) breakdownItems.push({ name: 'Anexo VIII: Higiene (60%)', value: vAnexo8 });
    
    return {
        totalGeral,
        totalCreditoBruto,
        totalCreditoReduzido30,
        totalCreditoSimplesNacional,
        totalCreditoSimplesNacionalReduzido30,
        breakdownItems
    };
}
