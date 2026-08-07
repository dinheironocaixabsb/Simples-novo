/**
 * SZ-1: Rateio Proporcional PIS/COFINS
 * Calcula a proporção do crédito aplicável sobre insumos de uso comum.
 */

export interface RateioInput {
  receitaTotal: number;
  receitaTributada: number;
  creditoInsumoComum: number;
}

export function calcularRateioProporcional(input: RateioInput): number {
  if (input.receitaTotal <= 0) return 0;
  
  // Impede que a receita tributada seja maior que a total
  const receitaTribEfetiva = Math.min(input.receitaTributada, input.receitaTotal);
  
  const proporcao = receitaTribEfetiva / input.receitaTotal;
  const creditoPermitido = input.creditoInsumoComum * proporcao;
  
  // Retorna com precisão financeira
  return Number(creditoPermitido.toFixed(2));
}
