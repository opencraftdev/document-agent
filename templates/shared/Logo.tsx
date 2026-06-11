import React from "react";
import { Image, StyleSheet } from "@react-pdf/renderer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../brand/logo.png");
// Load the PNG as a buffer rather than passing the filesystem path as `src`.
// On Windows an absolute path (`C:\...`) is mis-parsed as a URL scheme by
// react-pdf, which then tries to fetch it and fails ("Unable to connect"),
// leaving the logo blank. A buffer sidesteps URL resolution entirely.
const LOGO_DATA = fs.readFileSync(LOGO_PATH);

interface LogoProps {
  height?: number;
}

const styles = StyleSheet.create({
  logo: { objectFit: "contain" },
});

export const Logo: React.FC<LogoProps> = ({ height = 60 }) => (
  <Image src={{ data: LOGO_DATA, format: "png" }} style={[styles.logo, { height }]} />
);
