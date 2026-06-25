import type { PropertyConnector, PropertyImportData } from "./types";

export class MockConnector implements PropertyConnector {
  getName(): string {
    return "MockConnector";
  }

  async importProperties(): Promise<PropertyImportData[]> {
    return [
      {
        identificadorOrigem: "mock-001",
        fonte: "MockConnector",
        tipo: "Casa",
        cidade: "Timóteo",
        bairro: "Bela Vista",
        preco: 350000,
        area: 120,
        quartos: 3,
        banheiros: 2,
        vagas: 1,
        descricao: "Casa espaçosa com quintal no bairro Bela Vista.",
        urlOriginal: null,
        fotos: [],
      },
      {
        identificadorOrigem: "mock-002",
        fonte: "MockConnector",
        tipo: "Apartamento",
        cidade: "Timóteo",
        bairro: "Centro",
        preco: 220000,
        area: 75,
        quartos: 2,
        banheiros: 1,
        vagas: 1,
        descricao: "Apartamento bem localizado no Centro de Timóteo.",
        urlOriginal: null,
        fotos: [],
      },
      {
        identificadorOrigem: "mock-003",
        fonte: "MockConnector",
        tipo: "Casa",
        cidade: "Timóteo",
        bairro: "Limoeiro",
        preco: 480000,
        area: 200,
        quartos: 4,
        banheiros: 3,
        vagas: 2,
        descricao: "Ampla residência com área gourmet no Limoeiro.",
        urlOriginal: null,
        fotos: [],
      },
    ];
  }
}
