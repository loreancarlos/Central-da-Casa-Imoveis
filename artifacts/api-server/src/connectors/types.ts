export interface PropertyImportData {
  identificadorOrigem: string;
  fonte: string;
  tipo: string;
  cidade: string;
  bairro: string;
  preco: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  descricao?: string | null;
  urlOriginal?: string | null;
  fotos?: string[];
}

export interface PropertyConnector {
  getName(): string;
  importProperties(): Promise<PropertyImportData[]>;
}

export interface ImportResult {
  importados: number;
  atualizados: number;
  ignorados: number;
}
