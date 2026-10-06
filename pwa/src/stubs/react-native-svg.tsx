// Stub web de react-native-svg: la libreria real depende de modulos nativos
// que no bundlean bajo react-native-web. En el navegador basta con emitir los
// elementos SVG del DOM, que aceptan las mismas props (stroke, strokeWidth,
// viewBox...) que usa components/Icon.tsx.
import { createElement } from "react";

type SvgProps = Record<string, unknown> & { children?: React.ReactNode };

const el = (tag: string) => (props: SvgProps) => createElement(tag, props);

export default el("svg");
export const Path = el("path");
export const Polyline = el("polyline");
export const Line = el("line");
export const Circle = el("circle");
export const Rect = el("rect");
export const Ellipse = el("ellipse");
export const Defs = el("defs");
export const LinearGradient = el("linearGradient");
export const Stop = el("stop");
