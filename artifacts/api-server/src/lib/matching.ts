import type { Cliente } from "@workspace/db";
import type { Imovel } from "@workspace/db";

export function calcularScore(cliente: Cliente, imovel: Imovel): number {
  let score = 0;

  const precoMin = Number(cliente.precoMinimo);
  const precoMax = Number(cliente.precoMaximo);
  const preco = Number(imovel.preco);

  if (preco >= precoMin && preco <= precoMax) {
    score += 40;
  }

  if (imovel.tipo.toLowerCase() === cliente.tipoImovelDesejado.toLowerCase()) {
    score += 20;
  }

  if (imovel.quartos >= cliente.quartosMinimos) {
    score += 20;
  }

  if (
    cliente.bairroPreferido &&
    imovel.bairro.toLowerCase() === cliente.bairroPreferido.toLowerCase()
  ) {
    score += 20;
  }

  return score;
}
