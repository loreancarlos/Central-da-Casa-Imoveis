import type { PropertyConnector, PropertyImportData } from "../types";
import { logger } from "../../lib/logger";
import { setProgress, clearProgress } from "../../lib/progressStore";

const BASE_URL = "https://www.casalinhares.com.br";
const API_BASE = "https://api2.imobzi.app/v1/ac-ohlj221031aqut/site2";
const FONTE = "Casa Linhares";
const DETAIL_DELAY_MS = 400;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
};

interface MapProperty {
  db_id: number;
  code: string;
  property_type: string;
  neighborhood: string;
  city: string;
  site_url: string;
  useful_area: number;
  area: number;
  lot_area: number;
  sale_value: number;
  cover_photo?: { url: string };
  site_publish_price: boolean;
}

interface DetailProperty {
  bedroom: number;
  bathroom: number;
  garage: number;
  useful_area: number;
  area: number;
  lot_area: number;
  sale_value: number;
  description: string;
  photos: Array<{ url: string; type: string; category: string; position: number }>;
}

export class CasaLinharesConnector implements PropertyConnector {
  getName(): string {
    return FONTE;
  }

  async importProperties(): Promise<PropertyImportData[]> {
    const start = Date.now();
    logger.info("Iniciando importação Casa Linhares");

    const mapItems = await this.fetchMapProperties();
    logger.info({ total: mapItems.length }, "Listagem concluída — iniciando enriquecimento");
    setProgress(FONTE, { current: 0, total: mapItems.length, running: true });

    const results: PropertyImportData[] = [];
    let fotosTotal = 0;

    for (let i = 0; i < mapItems.length; i++) {
      const item = mapItems[i];
      const tInicio = Date.now();

      let detail: DetailProperty | null = null;
      try {
        detail = await this.fetchDetail(item.site_url);
      } catch (err) {
        logger.warn({ url: item.site_url, err }, "Falha ao buscar detalhes — usando dados da listagem");
      }

      const preco = detail?.sale_value && detail.sale_value > 0
        ? detail.sale_value
        : item.site_publish_price && item.sale_value > 0
          ? item.sale_value
          : 0;

      const area = detail
        ? (detail.useful_area > 0 ? detail.useful_area : detail.area > 0 ? detail.area : detail.lot_area)
        : (item.useful_area > 0 ? item.useful_area : item.area > 0 ? item.area : item.lot_area);

      const fotos = this.extractFotos(detail, item.cover_photo?.url);
      fotosTotal += fotos.length;

      results.push({
        identificadorOrigem: item.code,
        fonte: FONTE,
        tipo: item.property_type,
        cidade: item.city,
        bairro: item.neighborhood,
        preco,
        area,
        quartos: detail?.bedroom ?? 0,
        banheiros: detail?.bathroom ?? 0,
        vagas: detail?.garage ?? 0,
        descricao: detail?.description?.trim() || null,
        urlOriginal: `${BASE_URL}${item.site_url}`,
        fotos,
      });

      const elapsed = Date.now() - tInicio;
      setProgress(FONTE, { current: i + 1, total: mapItems.length, running: true });
      logger.info(
        { progresso: `${i + 1}/${mapItems.length}`, fotos: fotos.length, tempoMs: elapsed },
        "Imóvel enriquecido"
      );

      if (i < mapItems.length - 1) {
        await sleep(DETAIL_DELAY_MS);
      }
    }

    const totalMs = Date.now() - start;
    const avgMs = mapItems.length > 0 ? Math.round(totalMs / mapItems.length) : 0;

    clearProgress(FONTE);
    logger.info(
      {
        totalEncontrados: results.length,
        totalFotos: fotosTotal,
        tempoTotal: `${totalMs}ms`,
        tempoPorImovel: `${avgMs}ms`,
      },
      "Importação Casa Linhares concluída"
    );

    return results;
  }

  private async fetchMapProperties(): Promise<MapProperty[]> {
    const url =
      `${API_BASE}/search/map?availability=buy&city=Tim%C3%B3teo&cursor=&direction=desc&order=created_at&get_center_map=true`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar mapa de imóveis`);
    const data = (await res.json()) as { properties_map: MapProperty[] };
    return data.properties_map ?? [];
  }

  private async fetchDetail(siteUrl: string): Promise<DetailProperty> {
    const url = `${API_BASE}/properties?url=${encodeURIComponent(siteUrl)}&listing_broker_properties_count=true`;
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar detalhe de ${siteUrl}`);
    return res.json() as Promise<DetailProperty>;
  }

  private extractFotos(detail: DetailProperty | null, coverUrl?: string): string[] {
    const fotos = new Set<string>();

    if (detail?.photos) {
      const sorted = [...detail.photos]
        .filter((p) => p.url && (p.type === "photo" || p.category === "photos"))
        .sort((a, b) => a.position - b.position);

      for (const p of sorted) {
        if (fotos.size >= 20) break;
        fotos.add(normalizePhotoUrl(p.url));
      }
    }

    if (fotos.size === 0 && coverUrl) {
      fotos.add(normalizePhotoUrl(coverUrl));
    }

    return [...fotos];
  }
}

function normalizePhotoUrl(url: string): string {
  if (!url) return url;
  url = url.trim();
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
