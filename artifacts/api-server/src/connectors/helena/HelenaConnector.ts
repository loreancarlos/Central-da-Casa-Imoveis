import type { PropertyConnector, PropertyImportData } from "../types";
import { logger } from "../../lib/logger";

const BASE_URL = "https://www.helenaimoveis.com.br";
const LISTING_BASE = `${BASE_URL}/mobile/imovel/venda/todos/timoteo`;
const FONTE = "Helena Imóveis";
const DETAIL_DELAY_MS = 400;

interface ListingCard {
  identificadorOrigem: string;
  tipo: string;
  cidade: string;
  bairro: string;
  preco: number;
  urlOriginal: string;
}

interface DetailData {
  quartos: number;
  banheiros: number;
  vagas: number;
  area: number;
  descricao: string | null;
  fotos: string[];
  preco: number | null;
}

export class HelenaConnector implements PropertyConnector {
  getName(): string {
    return FONTE;
  }

  async importProperties(): Promise<PropertyImportData[]> {
    const start = Date.now();
    logger.info("Iniciando importação Helena Imóveis");

    const cards: ListingCard[] = [];
    let page = 1;

    while (true) {
      const html = await this.fetchHtml(page === 1 ? LISTING_BASE : `${LISTING_BASE}/?pag=${page}`);
      const batch = this.parseListingCards(html);
      if (batch.length === 0) break;
      cards.push(...batch);
      logger.info({ page, encontrados: batch.length }, "Página de listagem processada");
      page++;
    }

    logger.info({ total: cards.length }, "Listagem concluída — iniciando enriquecimento");

    const results: PropertyImportData[] = [];
    let fotosTotal = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const tInicio = Date.now();

      let detail: DetailData = { quartos: 0, banheiros: 0, vagas: 0, area: 0, descricao: null, fotos: [], preco: null };

      try {
        const detailHtml = await this.fetchHtml(card.urlOriginal);
        detail = this.parseDetailPage(detailHtml, card.urlOriginal);
      } catch (err) {
        logger.warn({ url: card.urlOriginal, err }, "Falha ao buscar detalhes — usando dados da listagem");
      }

      const preco = detail.preco != null && detail.preco > 0 ? detail.preco : card.preco;
      fotosTotal += detail.fotos.length;

      results.push({
        identificadorOrigem: card.identificadorOrigem,
        fonte: FONTE,
        tipo: card.tipo,
        cidade: card.cidade,
        bairro: card.bairro,
        preco,
        area: detail.area,
        quartos: detail.quartos,
        banheiros: detail.banheiros,
        vagas: detail.vagas,
        descricao: detail.descricao,
        urlOriginal: card.urlOriginal,
        fotos: detail.fotos,
      });

      const elapsed = Date.now() - tInicio;
      logger.info(
        { progresso: `${i + 1}/${cards.length}`, fotos: detail.fotos.length, tempoMs: elapsed },
        "Imóvel enriquecido"
      );

      if (i < cards.length - 1) {
        await sleep(DETAIL_DELAY_MS);
      }
    }

    const totalMs = Date.now() - start;
    const avgMs = cards.length > 0 ? Math.round(totalMs / cards.length) : 0;

    logger.info(
      {
        totalEncontrados: results.length,
        totalFotos: fotosTotal,
        tempoTotal: `${totalMs}ms`,
        tempoPorImovel: `${avgMs}ms`,
      },
      "Importação Helena Imóveis concluída"
    );

    return results;
  }

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
    const buffer = await res.arrayBuffer();
    return new TextDecoder("iso-8859-1").decode(buffer);
  }

  private parseListingCards(html: string): ListingCard[] {
    const results: ListingCard[] = [];
    const cardMatches = [...html.matchAll(/class="imovelcard" data-link="([^"]+)"/g)];

    for (const match of cardMatches) {
      const link = match[1];
      const idMatch = link.match(/\/imovel\/(\d+)\//);
      if (!idMatch) continue;
      const id = idMatch[1];

      const cardStart = match.index!;
      const nextCardIdx = html.indexOf('class="imovelcard" data-link=', cardStart + 100);
      const cardHtml = html.slice(cardStart, nextCardIdx === -1 ? undefined : nextCardIdx);

      const localMatch = cardHtml.match(/class="imovelcard__info__local">([^<]+)<\/h2>/);
      const localText = localMatch ? decodeHtml(localMatch[1].trim()) : "";
      const [rawBairro, rawCidade] = localText.split(",");
      const bairro = toTitleCase(rawBairro?.trim() || "");
      const cidade = rawCidade?.split("/")?.[0]?.trim() || "Timóteo";

      const tipoMatch = cardHtml.match(
        /class="imovelcard__info__ref"><strong>[^<]+<\/strong>\s*-\s*([^<]+)<\/p>/
      );
      const tipo = tipoMatch ? decodeHtml(tipoMatch[1].trim()) : "Imóvel";

      const precoMatch = cardHtml.match(/class="imovelcard__valor__valor">([^<]+)<\/p>/);
      const preco = precoMatch ? (parsePrice(precoMatch[1].trim()) ?? 0) : 0;

      results.push({
        identificadorOrigem: id,
        tipo,
        cidade,
        bairro,
        preco,
        urlOriginal: `${BASE_URL}${link}`,
      });
    }

    return results;
  }

  private parseDetailPage(html: string, url: string): DetailData {
    const clean = html.replace(/\s+/g, " ");

    const quartos = extractInt(clean, [
      /(\d+)\s*quarto/i,
      /quartos?\s*[:\-]?\s*(\d+)/i,
      /(\d+)\s*dorm/i,
      /(\d+)\s*suite/i,
    ]);

    const banheiros = extractInt(clean, [
      /(\d+)\s*banheiro/i,
      /banheiros?\s*[:\-]?\s*(\d+)/i,
      /(\d+)\s*wc/i,
    ]);

    const vagas = extractInt(clean, [
      /(\d+)\s*vaga/i,
      /vagas?\s*[:\-]?\s*(\d+)/i,
      /(\d+)\s*garagem/i,
    ]);

    const area = extractFloat(clean, [
      /(\d+(?:[.,]\d+)?)\s*m[²2]/i,
      /área\s*(?:total|útil)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i,
      /(\d+(?:[.,]\d+)?)\s*metros/i,
    ]);

    const descricao = extractDescricao(clean);

    const fotos = extractFotos(html, url);

    const precoMatch = clean.match(/class="[^"]*(?:imovel|preco|valor)[^"]*"[^>]*>([^<]*R\$[^<]+)</i)
      || clean.match(/R\$\s*([\d.,]+)/);
    const preco = precoMatch ? parsePrice(precoMatch[1]) : null;

    return { quartos, banheiros, vagas, area, descricao, fotos, preco };
  }
}

function extractInt(html: string, patterns: RegExp[]): number {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n >= 0 && n <= 20) return n;
    }
  }
  return 0;
}

function extractFloat(html: string, patterns: RegExp[]): number {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      const n = parseFloat(m[1].replace(",", "."));
      if (!isNaN(n) && n > 0 && n < 100000) return n;
    }
  }
  return 0;
}

function extractDescricao(html: string): string | null {
  const patterns = [
    /class="[^"]*(?:descri|observ|texto|detalhe)[^"]*"[^>]*>([\s\S]{30,1000}?)<\//i,
    /<p[^>]*>([\s\S]{50,800}?)<\/p>/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      const text = decodeHtml(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      if (text.length > 30) return text.slice(0, 800);
    }
  }
  return null;
}

function extractFotos(html: string, pageUrl: string): string[] {
  const urlObj = new URL(pageUrl);
  const origin = urlObj.origin;

  const fotos = new Set<string>();

  const patterns = [
    /src="([^"]*\/fotos?\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /src="([^"]*\/imovel[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /data-src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /href="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /src="([^"]+helenaimoveis[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ];

  for (const pat of patterns) {
    let m: RegExpExecArray | null;
    const regex = new RegExp(pat.source, pat.flags);
    while ((m = regex.exec(html)) !== null) {
      let src = m[1];
      if (src.startsWith("//")) src = `https:${src}`;
      else if (src.startsWith("/")) src = `${origin}${src}`;
      if (!src.startsWith("http")) continue;
      if (src.includes("thumb") && fotos.size > 0) continue;
      fotos.add(src);
      if (fotos.size >= 20) break;
    }
  }

  return [...fotos];
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&aacute;/gi, "á").replace(/&Aacute;/g, "Á")
    .replace(/&eacute;/gi, "é").replace(/&Eacute;/g, "É")
    .replace(/&iacute;/gi, "í").replace(/&Iacute;/g, "Í")
    .replace(/&oacute;/gi, "ó").replace(/&Oacute;/g, "Ó")
    .replace(/&uacute;/gi, "ú").replace(/&Uacute;/g, "Ú")
    .replace(/&atilde;/gi, "ã").replace(/&Atilde;/g, "Ã")
    .replace(/&otilde;/gi, "õ").replace(/&Otilde;/g, "Õ")
    .replace(/&ccedil;/gi, "ç").replace(/&Ccedil;/g, "Ç")
    .replace(/&ntilde;/gi, "ñ").replace(/&nbsp;/g, " ")
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
