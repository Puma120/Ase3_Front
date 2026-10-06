import { ReactNode } from "react";
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";

import { FONT_FILES, spacing } from "../theme/tokens";

// Negrita anidada: en web hereda la familia y solo cambia el peso; en Android
// cada peso es su propio archivo de fuente (ver theme/fonts.ts).
const styles = {
  bold: (Platform.OS === "web" ? { fontWeight: "700" } : { fontFamily: FONT_FILES["700"] }) as TextStyle,
};

// Markdown minimo para las respuestas del asistente: **negritas**, listas
// con "-", "*" o "1." y saltos de linea. Sin esto el usuario veria los
// asteriscos y guiones crudos (decision 8: listas y negritas para lo clave).

type Block =
  | { t: "p"; text: string }
  | { t: "li"; marker: string; text: string }
  | { t: "gap" };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if (!line) {
      if (blocks.length && blocks[blocks.length - 1].t !== "gap") blocks.push({ t: "gap" });
    } else if ((m = line.match(/^[-*•]\s+(.*)$/))) {
      blocks.push({ t: "li", marker: "•", text: m[1] });
    } else if ((m = line.match(/^(\d+)[.)]\s+(.*)$/))) {
      blocks.push({ t: "li", marker: `${m[1]}.`, text: m[2] });
    } else if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      blocks.push({ t: "p", text: `**${m[1].replace(/\*\*/g, "")}**` });
    } else {
      blocks.push({ t: "p", text: line });
    }
  }
  if (blocks[blocks.length - 1]?.t === "gap") blocks.pop();
  return blocks;
}

function inline(text: string): ReactNode[] {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
    .filter(Boolean)
    .map((part, i) =>
      /^(\*\*|__).+\1$/.test(part) ? (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      ) : (
        part
      ),
    );
}

// Version sin marcas, para anunciarla a lectores de pantalla.
export function plainText(text: string): string {
  return text.replace(/\*\*|__|`/g, "").replace(/^\s*(?:[-*•]|#{1,6})\s+/gm, "");
}

export function RichText({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {parse(text).map((b, i) =>
        b.t === "gap" ? (
          <View key={i} style={{ height: spacing.xs }} />
        ) : b.t === "li" ? (
          <View key={i} style={{ flexDirection: "row", gap: spacing.sm, paddingLeft: spacing.xs }}>
            <Text style={style}>{b.marker}</Text>
            <Text style={[style, { flex: 1 }]} selectable>
              {inline(b.text)}
            </Text>
          </View>
        ) : (
          <Text key={i} style={style} selectable>
            {inline(b.text)}
          </Text>
        ),
      )}
    </View>
  );
}
