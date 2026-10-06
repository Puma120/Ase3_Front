// Carga la tipografia nativa (Expo). La version web es useAppFonts.ts.
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
  AtkinsonHyperlegibleNext_800ExtraBold,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import { useFonts } from "expo-font";

import { FONT_FILES } from "./tokens";

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [FONT_FILES["400"]]: AtkinsonHyperlegibleNext_400Regular,
    [FONT_FILES["500"]]: AtkinsonHyperlegibleNext_500Medium,
    [FONT_FILES["600"]]: AtkinsonHyperlegibleNext_600SemiBold,
    [FONT_FILES["700"]]: AtkinsonHyperlegibleNext_700Bold,
    [FONT_FILES["800"]]: AtkinsonHyperlegibleNext_800ExtraBold,
  });
  // Si la fuente falla, la app abre igual con la del sistema.
  return loaded || !!error;
}
