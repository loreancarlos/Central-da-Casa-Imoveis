import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Fontes de importação
await client.query(`
  INSERT INTO fontes_importacao (nome, url, ativo) VALUES
    ('Helena Imóveis', 'https://helenaimoveis.com.br', true),
    ('Casa Linhares', 'https://casalinhares.com.br', true),
    ('Minas Caixa', 'https://minascaixa.com.br', true)
  ON CONFLICT DO NOTHING;
`);
console.log("✓ Fontes de importação inseridas");

// Clientes
await client.query(`
  INSERT INTO clientes (nome, telefone, tipo_imovel_desejado, cidade, bairro_preferido, preco_minimo, preco_maximo, quartos_minimos, observacoes) VALUES
    ('Ana Paula Ferreira',    '(31) 99801-1234', 'Casa',        'Timóteo', 'Limoeiro',         '180000', '320000', 3, 'Preferência por quintal'),
    ('Carlos Souza',          '(31) 99802-2345', 'Apartamento', 'Timóteo', 'Centro',           '120000', '250000', 2, NULL),
    ('Fernanda Lima',         '(31) 99803-3456', 'Casa',        'Timóteo', 'Bela Vista',       '200000', '380000', 3, 'Aceita reformar'),
    ('Ricardo Andrade',       '(31) 99804-4567', 'Apartamento', 'Timóteo', 'Veneza',           '150000', '280000', 2, 'Andar alto prefiro'),
    ('Mariana Costa',         '(31) 99805-5678', 'Casa',        'Timóteo', 'Santo Antônio',    '250000', '450000', 4, 'Churrasqueira essencial'),
    ('João Batista Rocha',    '(31) 99806-6789', 'Casa',        'Timóteo', NULL,               '100000', '200000', 2, 'Qualquer bairro'),
    ('Camila Nunes',          '(31) 99807-7890', 'Apartamento', 'Timóteo', 'Centro',           '90000',  '180000', 1, 'Próximo ao comércio'),
    ('Paulo Henrique Dias',   '(31) 99808-8901', 'Casa',        'Timóteo', 'Limoeiro',         '300000', '550000', 4, 'Área mínima 200m²'),
    ('Luciana Martins',       '(31) 99809-9012', 'Apartamento', 'Timóteo', 'Bela Vista',       '130000', '230000', 2, NULL),
    ('Eduardo Fonseca',       '(31) 99810-0123', 'Casa',        'Timóteo', 'Veneza',           '220000', '400000', 3, 'Garagem para 2 carros')
  ON CONFLICT DO NOTHING;
`);
console.log("✓ Clientes inseridos");

// Imóveis
await client.query(`
  INSERT INTO imoveis (fonte, identificador_origem, tipo, cidade, bairro, preco, area, quartos, banheiros, vagas, descricao) VALUES
    ('Helena Imóveis', 'HI-001', 'Casa',        'Timóteo', 'Limoeiro',      '285000', '160', 3, 2, 1, 'Casa espaçosa com quintal amplo e churrasqueira'),
    ('Helena Imóveis', 'HI-002', 'Apartamento', 'Timóteo', 'Centro',        '195000', '72',  2, 1, 1, 'Apartamento bem localizado, próximo ao centro comercial'),
    ('Helena Imóveis', 'HI-003', 'Casa',        'Timóteo', 'Bela Vista',    '340000', '200', 4, 3, 2, 'Sobrado moderno com piscina e área gourmet'),
    ('Helena Imóveis', 'HI-004', 'Apartamento', 'Timóteo', 'Veneza',        '165000', '65',  2, 1, 1, 'Apartamento em andar alto com vista panorâmica'),
    ('Helena Imóveis', 'HI-005', 'Casa',        'Timóteo', 'Santo Antônio', '390000', '230', 4, 3, 2, 'Casa com churrasqueira, piscina e jardim'),
    ('Helena Imóveis', 'HI-006', 'Casa',        'Timóteo', 'Limoeiro',      '160000', '110', 2, 1, 1, 'Casa simples em rua tranquila'),
    ('Helena Imóveis', 'HI-007', 'Apartamento', 'Timóteo', 'Centro',        '145000', '55',  1, 1, 0, 'Studio moderno no coração do centro'),
    ('Helena Imóveis', 'HI-008', 'Casa',        'Timóteo', 'Limoeiro',      '480000', '280', 4, 3, 3, 'Casa de alto padrão com amplo espaço externo'),
    ('Helena Imóveis', 'HI-009', 'Apartamento', 'Timóteo', 'Bela Vista',    '175000', '68',  2, 2, 1, 'Apartamento reformado com armários planejados'),
    ('Helena Imóveis', 'HI-010', 'Casa',        'Timóteo', 'Veneza',        '365000', '195', 3, 2, 2, 'Casa com garagem para 2 carros e quintal'),
    ('Casa Linhares',  'CL-001', 'Casa',        'Timóteo', 'Bela Vista',    '295000', '170', 3, 2, 2, 'Casa nova, nunca habitada, pronta para morar'),
    ('Casa Linhares',  'CL-002', 'Apartamento', 'Timóteo', 'Centro',        '215000', '80',  3, 2, 1, 'Apartamento espaçoso com varanda gourmet'),
    ('Casa Linhares',  'CL-003', 'Casa',        'Timóteo', 'Santo Antônio', '185000', '130', 3, 2, 1, 'Ótima localização, perto de escola e mercado'),
    ('Casa Linhares',  'CL-004', 'Apartamento', 'Timóteo', 'Veneza',        '130000', '50',  1, 1, 0, 'Apartamento compacto, ideal para investimento'),
    ('Casa Linhares',  'CL-005', 'Casa',        'Timóteo', 'Limoeiro',      '240000', '150', 3, 2, 1, 'Casa com jardim frontal e edícula no fundo'),
    ('Casa Linhares',  'CL-006', 'Apartamento', 'Timóteo', 'Bela Vista',    '195000', '75',  2, 2, 1, 'Apartamento com sacada e vista para parque'),
    ('Casa Linhares',  'CL-007', 'Casa',        'Timóteo', 'Centro',        '175000', '120', 3, 2, 1, 'Casa reformada próxima a ponto de ônibus'),
    ('Casa Linhares',  'CL-008', 'Casa',        'Timóteo', 'Santo Antônio', '420000', '260', 4, 3, 2, 'Mansão em condomínio fechado com lazer completo'),
    ('Casa Linhares',  'CL-009', 'Apartamento', 'Timóteo', 'Veneza',        '160000', '62',  2, 1, 1, 'Apartamento com dois quartos e box separado'),
    ('Casa Linhares',  'CL-010', 'Casa',        'Timóteo', 'Limoeiro',      '315000', '185', 4, 3, 2, 'Casa ampla com quarto de empregada e lavabo'),
    ('Minas Caixa',    'MC-001', 'Apartamento', 'Timóteo', 'Centro',        '105000', '45',  1, 1, 0, 'Quitinete no centro, ótima para autônomo'),
    ('Minas Caixa',    'MC-002', 'Casa',        'Timóteo', 'Bela Vista',    '275000', '165', 3, 2, 1, 'Casa em rua calma com boa vizinhança'),
    ('Minas Caixa',    'MC-003', 'Apartamento', 'Timóteo', 'Veneza',        '245000', '90',  3, 2, 2, 'Amplo apartamento com 2 vagas de garagem'),
    ('Minas Caixa',    'MC-004', 'Casa',        'Timóteo', 'Santo Antônio', '330000', '210', 4, 3, 2, 'Casa com churrasqueira coberta e quintal gramado'),
    ('Minas Caixa',    'MC-005', 'Casa',        'Timóteo', 'Limoeiro',      '195000', '135', 3, 2, 1, 'Casa aconchegante com varanda e jardim'),
    ('Minas Caixa',    'MC-006', 'Apartamento', 'Timóteo', 'Centro',        '175000', '70',  2, 1, 1, 'Apartamento com acabamento de qualidade'),
    ('Minas Caixa',    'MC-007', 'Casa',        'Timóteo', 'Bela Vista',    '355000', '220', 4, 3, 2, 'Casa espaçosa com piscina e área de lazer'),
    ('Minas Caixa',    'MC-008', 'Apartamento', 'Timóteo', 'Veneza',        '140000', '58',  2, 1, 0, 'Apartamento limpo e bem cuidado'),
    ('Minas Caixa',    'MC-009', 'Casa',        'Timóteo', 'Santo Antônio', '265000', '155', 3, 2, 1, 'Boa casa de bairro com espaço para família'),
    ('Minas Caixa',    'MC-010', 'Casa',        'Timóteo', 'Limoeiro',      '490000', '300', 5, 4, 3, 'Residência de luxo com toda infraestrutura')
  ON CONFLICT DO NOTHING;
`);
console.log("✓ Imóveis inseridos");

await client.end();
console.log("Seed concluído com sucesso!");
