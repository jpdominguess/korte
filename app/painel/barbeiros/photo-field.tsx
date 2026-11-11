"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, Button } from "~/_components/ui";

const SIZE = 400;

/** Reduz a foto no navegador para um quadrado de 400 px em JPEG, assim ela fica leve para guardar e exibir. */
async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface Props {
  name: string;
  initialUrl: string | null;
  /** Recebe a nova foto, null para remover ou undefined quando nada mudou. */
  onChange: (photo: string | null | undefined) => void;
}

export function PhotoField({ name, initialUrl, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const photo = await toSquareJpeg(file);
      setPreview(photo);
      setError(null);
      onChange(photo);
    } catch {
      setError("Não deu para ler essa imagem. Tente uma foto em JPG ou PNG.");
    }
  }

  function remove() {
    setPreview(null);
    setError(null);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} src={preview} size="xl" />
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} />
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
            <Camera />
            {preview ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {preview && (
            <Button variant="ghost" size="sm" onClick={remove}>
              <Trash2 />
              Remover
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-erro">{error}</p>}
    </div>
  );
}
