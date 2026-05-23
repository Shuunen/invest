import { useEffect } from "react";

// abyss     // weird colors and contrast
// aqua      // wtf so blue dabedee dabada
// black     // too much contrast
// cyberpunk // weird colors and contrast
// coffee    // weird colors and contrast
// halloween // same as forest but less contrast
// luxury    // weird colors and contrast
// night     // not horrible, not great
// retro     // weird colors
// sunset    // not horrible but lacks contrast
// synthwave // too much lol
export const darkThemes = ["business", "dark", "dim", "dracula", "forest"] as const;

// acid      // too much contrast
// cmyk      // weird colors, success is purple ?!
// corporate // sad version of light/bumblebee
// autumn    // a bit sad
// emerald   // same as Corporate
// fantasy   // almost a copy of Corporate
// garden    // sad grey
// lemonade  // weird colors and contrast
// lofi      // weird colors and contrast
// nord      // sad pale
// pastel    // weird colors and contrast
// silk      // dim version of Cupcake
// valentine // weird colors and contrast
// wireframe // sad
export const lightThemes = ["bumblebee", "caramellatte", "cupcake", "light", "winter"] as const;

export const themes = [...darkThemes, ...lightThemes] as const;

export type Theme = (typeof themes)[number];

export function useThemeColorSync(theme: string) {
  useEffect(() => {
    setTimeout(() => {
      document.documentElement.dataset.theme = theme;
      const meta =
        document.querySelector<HTMLMetaElement>("meta[name='theme-color']") ??
        (() => {
          const element = document.createElement("meta");
          element.name = "theme-color";
          document.head.append(element);
          return element;
        })();
      const color = globalThis.getComputedStyle(document.documentElement).getPropertyValue("--color-base-200").trim();
      meta.content = color;
      console.log(`Updated theme-color meta to ${color} based on theme ${theme}`);
    }, 1);
  }, [theme]);
}
