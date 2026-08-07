import { describe, it, expect } from 'vitest';
import { obterAliquotasIbsCbs } from '../ibsCbs';

describe('SZ-5: Automação IBS/CBS e Redutores', () => {
  it('Deve aplicar a tabela de transição de 2026', () => {
    const resultado = obterAliquotasIbsCbs({ ano: 2026, redutor: 'NONE' });
    expect(resultado.aliquotaIbs).toBe(0.1);
    expect(resultado.aliquotaCbs).toBe(0.9);
    expect(resultado.aliquotaTotal).toBe(1.0);
  });

  it('Deve aplicar a alíquota cheia para anos > 2026 e < 2033 como simplificação (26.5%)', () => {
    const resultado = obterAliquotasIbsCbs({ ano: 2028, redutor: 'NONE' });
    expect(resultado.aliquotaIbs).toBe(17.7);
    expect(resultado.aliquotaCbs).toBe(8.8);
    expect(resultado.aliquotaTotal).toBe(26.5);
  });

  it('Deve aplicar Redutor de 40% (ex: Restaurantes) corretamente', () => {
    const resultado = obterAliquotasIbsCbs({ ano: 2033, redutor: '40%' });
    // 17.7 * 0.6 = 10.62
    // 8.8 * 0.6 = 5.28
    expect(resultado.aliquotaIbs).toBe(10.62);
    expect(resultado.aliquotaCbs).toBe(5.28);
    expect(resultado.aliquotaTotal).toBe(15.90);
  });

  it('Deve respeitar o Override manual de alíquota ignorando a legislação', () => {
    const resultado = obterAliquotasIbsCbs({ 
      ano: 2033, 
      redutor: 'NONE', 
      aliquotaManualIbs: 10,
      aliquotaManualCbs: 12
    });
    expect(resultado.aliquotaIbs).toBe(10);
    expect(resultado.aliquotaCbs).toBe(12);
    expect(resultado.aliquotaTotal).toBe(22);
  });
});
