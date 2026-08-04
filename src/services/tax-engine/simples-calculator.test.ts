import { describe, it, expect } from 'vitest';
import { calculateAnexo } from './simples-calculator';

describe('Simples Nacional Calculator Engine', () => {
    it('deve calcular corretamente o Anexo I, Faixa 1 (sem ultrapassar sublimite e sem ST)', () => {
        // Mock de SIMPLES_PARTILHA
        const mockPartilha = {
            1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.1533, CPP: 0.415, ICMS: 0.34, IBS: 0.0017 }
        };

        const result = calculateAnexo({
            rbt12: 100000, // Faixa 1
            rbaAnexo: 50000,
            anexo: '1',
            activeYear: '2026',
            ultrapassouSublimite: false,
            isIcmsStSegregado: false,
            partilhaTributos: mockPartilha
        });

        // Alíquota nominal da Faixa 1, Anexo 1 é 4%
        expect(result.aliqNominal).toBe(0.04);
        expect(result.parcelaDeduzir).toBe(0);
        
        // Efetiva Padrão = (100000 * 0.04 - 0) / 100000 = 0.04
        expect(result.aliqEfetivaPadraoFull).toBe(0.04);
        expect(result.aliqEfetivaPadrao).toBe(0.04);

        // Valor DAS = RBA * Efetiva = 50000 * 0.04 = 2000
        expect(result.valorDasPadraoAnexo).toBe(2000);

        // Fração Por Fora do Anexo 1 Faixa 1 = 0.505
        // CBS = 0.1533, IBS = 0.0017
        // dasFractionPorFora = 1 - CBS - IBS = 1 - 0.1533 - 0.0017 = 0.845
        expect(result.dasFractionPorFora).toBeCloseTo(0.845, 4);

        // Valor Por Fora = 50000 * (0.04 * 0.845) = 50000 * 0.0338 = 1690
        expect(result.valorDasPorForaAnexo).toBe(1690);
    });

    it('deve segregar ICMS-ST corretamente', () => {
        const mockPartilha = {
            1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.1533, CPP: 0.415, ICMS: 0.34, IBS: 0.0017 }
        };

        const result = calculateAnexo({
            rbt12: 100000,
            rbaAnexo: 50000,
            anexo: '1',
            activeYear: '2026',
            ultrapassouSublimite: false,
            isIcmsStSegregado: true,
            percIcmsSt: 0.5, // 50% da receita tem ST
            partilhaTributos: mockPartilha
        });

        // ICMS total na faixa 1 é 34% da alíquota
        // 50% disso é deduzido = 17%
        // fractionPadrao passa a ser 1 - 0.17 = 0.83
        expect(result.fractionPadrao).toBeCloseTo(0.83, 4);
        
        // Efetiva original = 0.04
        // Efetiva com ST = 0.04 * 0.83 = 0.0332
        expect(result.aliqEfetivaPadrao).toBeCloseTo(0.0332, 4);

        // Valor DAS = 50000 * 0.0332 = 1660
        expect(result.valorDasPadraoAnexo).toBe(1660);
    });
});
