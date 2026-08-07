import { describe, it, expect } from 'vitest';
import { parseXmlNFe } from '../parser';

describe('SZ-2 e SZ-3: Parser de XML e Inteligência Tributária', () => {
  const xmlSimulado = `
  <nfeProc>
    <NFe>
      <infNFe>
        <det nItem="1">
          <prod>
            <xProd>Produto Normal</xProd>
            <NCM>10000000</NCM>
            <CFOP>5102</CFOP>
            <vProd>1000.00</vProd>
          </prod>
          <imposto>
            <PIS><PISAliq><CST>01</CST></PISAliq></PIS>
          </imposto>
        </det>
        <det nItem="2">
          <prod>
            <xProd>Produto Monofásico (Bebida)</xProd>
            <NCM>22011000</NCM>
            <CFOP>5102</CFOP>
            <vProd>500.00</vProd>
          </prod>
          <imposto>
            <PIS><PISNT><CST>04</CST></PISNT></PIS>
          </imposto>
        </det>
        <det nItem="3">
          <prod>
            <xProd>Material de Uso e Consumo</xProd>
            <NCM>30000000</NCM>
            <CFOP>1556</CFOP>
            <vProd>200.00</vProd>
          </prod>
          <imposto>
            <PIS><PISAliq><CST>01</CST></PISAliq></PIS>
          </imposto>
        </det>
      </infNFe>
    </NFe>
  </nfeProc>
  `;

  it('Deve identificar corretamente as 3 zonas tributárias', () => {
    const produtos = parseXmlNFe(xmlSimulado);
    
    expect(produtos.length).toBe(3);
    
    // Item 1: Normal (Gera ambos)
    expect(produtos[0].geraCreditoPisCofins).toBe(true);
    expect(produtos[0].geraCreditoIbsCbs).toBe(true);

    // Item 2: Monofásico CST 04 (Bloqueia PIS/COFINS, Gera IBS/CBS)
    expect(produtos[1].geraCreditoPisCofins).toBe(false);
    expect(produtos[1].geraCreditoIbsCbs).toBe(true);

    // Item 3: Uso Pessoal CFOP 1556 (Gera PIS/COFINS, Bloqueia IBS/CBS)
    expect(produtos[2].geraCreditoPisCofins).toBe(true);
    expect(produtos[2].geraCreditoIbsCbs).toBe(false);
  });
});
