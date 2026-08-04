import { ParsedXmlExpense } from '../../domain/types/xml.types';
import { MonthlyExpenses } from '../../store/useDiagnosisStore';

export function consolidarXmlDespesas(xmls: ParsedXmlExpense[]): Record<number, Partial<MonthlyExpenses>> {
    const monthSums: Record<number, Partial<MonthlyExpenses>> = {};

    xmls.forEach(note => {
        if (!note.data) return;
        const parts = note.data.split('/');
        if (parts.length < 3) return;
        
        const monthNum = parseInt(parts[1], 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return;
        const monthIndex = monthNum - 1; // 0 to 11

        if (!monthSums[monthIndex]) {
            monthSums[monthIndex] = {
                despesaGeral: 0,
                despesaCreditoIntegral: 0,
                despesaAnexo1: 0,
                despesaAnexo15: 0,
                despesaAnexo7: 0,
                despesaAnexo8: 0,
                deducaoIcmsIss: 0,
                deducaoPisCofins: 0,
                deducaoDescontos: 0,
                despesaSimplesNacional: 0,
                despesaSimplesNacionalReduzido30: 0,
            };
        }

        const isCredit = note.tipoDespesa === "Gera crédito de IBS/CBS" || note.tipoDespesa === 'true' || note.tipoDespesa === 'Gera crédito';
        const valor = typeof note.valor === 'string' ? parseFloat(note.valor) : (note.valor || 0);
        const isService = note.xmlType === 'NFSe' || note.fileName === 'Lançamento Manual';
        const isSimplesNacional = note.regime === 'Simples Nacional';

        if (isCredit) {
            let valorLiquidoNota = valor;
            
            if (note.deducoes) {
                const isDeductible = !isSimplesNacional || isService;
                if (isDeductible) {
                    const issToDeduct = isService ? (note.deducoes.iss || 0) : 0;
                    valorLiquidoNota = valor - (note.deducoes.icms || 0) - (note.deducoes.pisCofins || 0) - (note.deducoes.desconto || 0) - issToDeduct;
                    if (valorLiquidoNota < 0) valorLiquidoNota = 0;
                }
            }

            if (isSimplesNacional && !isService) {
                // Para simples nacional (Mercadorias), vamos dividir se tiver produtos
                if (note.produtosDetalhados && note.produtosDetalhados.length > 0) {
                    note.produtosDetalhados.forEach(p => {
                        if (p.isAlimento60 || p.isHigiene60) {
                            monthSums[monthIndex].despesaSimplesNacionalReduzido30! += p.valorBruto;
                        } else {
                            monthSums[monthIndex].despesaSimplesNacional! += p.valorBruto;
                        }
                    });
                } else {
                    monthSums[monthIndex].despesaSimplesNacional! += valorLiquidoNota;
                }
            } else {
                if (isService) {
                    monthSums[monthIndex].despesaGeral! += valorLiquidoNota;
                } else {
                    if (note.produtosDetalhados && note.produtosDetalhados.length > 0) {
                        note.produtosDetalhados.forEach(p => {
                            if (p.isAnexo1) {
                                monthSums[monthIndex].despesaAnexo1! += p.valorBruto; // Redução a zero
                            } else if (p.isAnexo15) {
                                monthSums[monthIndex].despesaAnexo15! += p.valorBruto;
                            } else if (p.isAlimento60) {
                                monthSums[monthIndex].despesaAnexo7! += p.valorBruto;
                            } else if (p.isHigiene60) {
                                monthSums[monthIndex].despesaAnexo8! += p.valorBruto;
                            } else {
                                monthSums[monthIndex].despesaCreditoIntegral! += p.valorBruto;
                            }
                        });
                    } else {
                        monthSums[monthIndex].despesaCreditoIntegral! += valorLiquidoNota;
                    }
                }
            }
            
            if (note.deducoes) {
                const isDeductible = !isSimplesNacional || isService;
                if (isDeductible) {
                    monthSums[monthIndex].deducaoIcmsIss! += (note.deducoes.icms || 0) + (note.deducoes.iss || 0);
                    monthSums[monthIndex].deducaoPisCofins! += (note.deducoes.pisCofins || 0);
                    monthSums[monthIndex].deducaoDescontos! += (note.deducoes.desconto || 0);
                }
            }
        } else {
            // Not credit-generating but valid expense
            if (isService) {
                monthSums[monthIndex].despesaGeral! += valor;
            } else {
                monthSums[monthIndex].despesaCreditoIntegral! += valor;
            }
        }
    });

    return monthSums;
}
