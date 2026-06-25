import type { PropertyConnector, PropertyImportData } from "../types";
import { logger } from "../../lib/logger";

const BASE_URL = "https://www.helenaimoveis.com.br";
const LISTING_BASE = `${BASE_URL}/mobile/imovel/venda/todos/timoteo`;
const FONTE = "Helena Imóveis";

export class HelenaConnector implements PropertyConnector {
  getName(): string {
    return FONTE;
  }

  async importProperties(): Promise<PropertyImportData[]> {
    const start = Date.now();
    logger.info("Iniciando importação Helena Imóveis");

    const all: PropertyImportData[] = [];
    let page = 1;

    while (true) {
      const html = await this.fetchPage(page);
      const cards = this.parseCards(html);

      if (cards.length === 0) break;

      all.push(...cards);
      logger.info({ page, encontrados: cards.length }, "Página processada");
      page++;
    }

    const elapsed = Date.now() - start;
    logger.info(
      {
        totalEncontrados: all.length,
        importados: all.length,
        ignorados: 0,
        tempoTotal: `${elapsed}ms`,
      },
      "Importação Helena Imóveis concluída"
    );

    return all;
  }

  private async fetchPage(page: number): Promise<string> {
    const url = page === 1 ? LISTING_BASE : `${LISTING_BASE}/?pag=${page}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const buffer = await res.arrayBuffer();
    return new TextDecoder("iso-8859-1").decode(buffer);
  }

  private parseCards(html: string): PropertyImportData[] {
    const results: PropertyImportData[] = [];
    const cardMatches = [...html.matchAll(/class="imovelcard" data-link="([^"]+)"/g)];

    for (const match of cardMatches) {
      const link = match[1];
      const idMatch = link.match(/\/imovel\/(\d+)\//);
      if (!idMatch) continue;
      const id = idMatch[1];

      const cardStart = match.index!;
      const nextCardIdx = html.indexOf('class="imovelcard" data-link=', cardStart + 100);
      const cardHtml = html.slice(cardStart, nextCardIdx === -1 ? undefined : nextCardIdx);

      // bairro e cidade
      const localMatch = cardHtml.match(/class="imovelcard__info__local">([^<]+)<\/h2>/);
      const localText = localMatch ? decodeHtml(localMatch[1].trim()) : "";
      const [rawBairro, rawCidade] = localText.split(",");
      const bairro = toTitleCase(rawBairro?.trim() || "");
      const cidade = rawCidade?.split("/")?.[0]?.trim() || "Timóteo";

      // tipo
      const tipoMatch = cardHtml.match(
        /class="imovelcard__info__ref"><strong>[^<]+<\/strong>\s*-\s*([^<]+)<\/p>/
      );
      const tipo = tipoMatch ? decodeHtml(tipoMatch[1].trim()) : "Imóvel";

      // preço
      const precoMatch = cardHtml.match(/class="imovelcard__valor__valor">([^<]+)<\/p>/);
      const precoText = precoMatch ? precoMatch[1].trim() : "";
      const preco = parsePrice(precoText) ?? 0;

      results.push({
        identificadorOrigem: id,
        fonte: FONTE,
        tipo,
        cidade,
        bairro,
        preco,
        area: 0,
        quartos: 0,
        banheiros: 0,
        vagas: 0,
        urlOriginal: `${BASE_URL}${link}`,
      });
    }

    return results;
  }
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&Aacute;/g, "Á")
    .replace(/&eacute;/gi, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&iacute;/gi, "í")
    .replace(/&Iacute;/g, "Í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&atilde;/gi, "ã")
    .replace(/&Atilde;/g, "Ã")
    .replace(/&otilde;/gi, "õ")
    .replace(/&Otilde;/g, "Õ")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

function parsePrice(text: string): number | null {
  if (!text || /consulte|sob\s*consulta/i.test(text)) return null;
  const cleaned = text.replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
