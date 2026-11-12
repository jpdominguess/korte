"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "./ui";

interface Props {
  barbers: Array<{ id: string; name: string }>;
  value: string | null;
  /** Página e parâmetros que ficam ao trocar de barbeiro. */
  path: string;
  params?: Record<string, string>;
  /** Quando informado, aparece uma opção para ver todos. */
  allLabel?: string;
}

export function BarberSelect({ barbers, value, path, params = {}, allLabel }: Props) {
  const router = useRouter();

  return (
    <label className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
      Barbeiro
      <select
        value={value ?? ""}
        onChange={(event) => {
          const query = new URLSearchParams(params);
          if (event.target.value) query.set("barbeiro", event.target.value);
          router.push(`${path}?${query}`);
        }}
        className={`${inputClass} w-auto min-w-56`}
      >
        {allLabel && <option value="">{allLabel}</option>}
        {barbers.map((barber) => (
          <option key={barber.id} value={barber.id}>
            {barber.name}
          </option>
        ))}
      </select>
    </label>
  );
}
