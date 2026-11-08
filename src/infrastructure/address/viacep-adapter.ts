import type { Address, AddressLookup } from "@/application/ports";

interface ViaCepResponse {
  logradouro?: string;
  localidade?: string;
  uf?: string;
  erro?: unknown;
}

export class ViaCepAdapter implements AddressLookup {
  async findByCep(cep: string): Promise<Address | null> {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) return null;
    return { street: data.logradouro ?? "", city: `${data.localidade ?? ""}/${data.uf ?? ""}` };
  }
}
