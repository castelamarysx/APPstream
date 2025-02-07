import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface OpenPlayerOptions {
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

export function openPlayerInNewWindow({ url, title = '', width = 1280, height = 720 }: OpenPlayerOptions) {
  // Codifica os parâmetros para URL
  const params = new URLSearchParams({
    url,
    title
  });

  // Calcula a posição central na tela
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  // Configurações da janela
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
    'scrollbars=yes'
  ].join(',');

  // Abre a nova janela
  window.open(
    `/player?${params.toString()}`,
    `player_${Date.now()}`, // Nome único para cada janela
    features
  );
}
