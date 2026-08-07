/**
 * SZ-2 e SZ-3: Dicionários Tributários para Bloqueios
 */

export const BLOQUEIOS_PIS_COFINS = {
  // CSTs que indicam que não há direito a crédito de PIS/COFINS (Monofásico, ST, Isento, etc)
  cstsBloqueados: ['04', '05', '06', '07', '08', '09', '49', '70', '71', '72', '73', '74', '75', '98', '99'],
  // Alguns NCMs de exemplo (bebidas frias, autopeças, combustíveis - Monofásicos)
  ncmsMonofasicos: ['22011000', '22021000', '22030000']
};

export const BLOQUEIOS_IBS_CBS = {
  // CFOPs que caracterizam uso e consumo pessoal / não gerador de crédito pela LC 214
  cfopsUsoPessoal: ['1556', '2556', '1557', '2557', '1407', '2407'],
  // NCMs característicos de uso pessoal não vinculado (Cesta Básica ou Bebidas Alcoólicas em certas regras)
  ncmsUsoPessoal: []
};
