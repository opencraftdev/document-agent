import React from "react";
import { Image, StyleSheet } from "@react-pdf/renderer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../brand/logo.png");

interface LogoProps {
  height?: number;
}

const styles = StyleSheet.create({
  logo: { objectFit: "contain" },
});

export const Logo: React.FC<LogoProps> = ({ height = 60 }) => (
  <Image src={LOGO_PATH} style={[styles.logo, { height }]} />
);
