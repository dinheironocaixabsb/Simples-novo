import { describe, it, expect } from 'vitest';
import { calcularRateioProporcional } from '../pisCofins';

describe('SZ-1: Rateio Proporcional PIS/COFINS', () => {
  it('Deve calcular 50% de rateio corretamente', () => {
    const input = {
      receitaTotal: 100000,
      receitaTributada: 50000, // 50%
      creditoInsumoComum: 5000 // R$ 5.000 de PIS/COFINS pago em insumos
    };
    const resultado = calcularRateioProporcional(input);
    expect(resultado).toBe(2500.00);
  });

  it('Deve retornar 0 se a receita total for 0', () => {
    const resultado = calcularRateioProporcional({
      receitaTotal: 0,
      receitaTributada: 10000,
      creditoInsumoComum: 5000
    });
    expect(resultado).toBe(0);
  });

  it('Não deve passar de 100% de rateio se a receita tributada vier maior por erro', () => {
    const input = {
      receitaTotal: 100000,
      receitaTributada: 150000,
      creditoInsumoComum: 5000
    };
    const resultado = calcularRateioProporcional(input);
    expect(resultado).toBe(5000.00);
  });
});
