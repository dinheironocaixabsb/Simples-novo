import { describe, it, expect } from 'vitest';
import { detectarRedutorPorCnae } from '../lc214Redutor';

describe('lc214Redutor - Detecção de Benefício Tributário por CNAE', () => {
  it('deve retornar sem benefício quando CNAE estiver vazio', () => {
    const res = detectarRedutorPorCnae('');
    expect(res.temBeneficio).toBe(false);
    expect(res.redutor).toBe('NONE');
  });

  it('deve detectar redução de 60% para clínica odontológica/médica', () => {
    const res = detectarRedutorPorCnae('8610-1/01 - CLINICA ODONTOLOGICA');
    expect(res.temBeneficio).toBe(true);
    expect(res.redutor).toBe('60%');
    expect(res.percentual).toBe(60);
  });

  it('deve detectar redução de 60% para instituições de ensino', () => {
    const res = detectarRedutorPorCnae('8512-1/00 - Educação infantil - creche');
    expect(res.temBeneficio).toBe(true);
    expect(res.redutor).toBe('60%');
  });

  it('deve detectar redução de 40% para restaurantes e bares', () => {
    const res = detectarRedutorPorCnae('5611-2/01 - Restaurantes e similares');
    expect(res.temBeneficio).toBe(true);
    expect(res.redutor).toBe('40%');
    expect(res.percentual).toBe(40);
  });

  it('deve detectar redução de 30% para serviços de advocacia/contabilidade', () => {
    const res = detectarRedutorPorCnae('6911-7/01 - Serviços advocatícios');
    expect(res.temBeneficio).toBe(true);
    expect(res.redutor).toBe('30%');
  });

  it('deve retornar sem benefício para atividades sem redução prevista (ex: desenvolvimento de software)', () => {
    const res = detectarRedutorPorCnae('6201-5/01 - Desenvolvimento de programas de computador sob encomenda');
    expect(res.temBeneficio).toBe(false);
    expect(res.redutor).toBe('NONE');
  });

  it('deve verificar CNAEs secundários caso o principal não possua benefício', () => {
    const res = detectarRedutorPorCnae('6201-5/01 - Software', ['5611-2/01 - Restaurante']);
    expect(res.temBeneficio).toBe(true);
    expect(res.redutor).toBe('40%');
  });
});
