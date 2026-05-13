import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { brand } from "./brand";
import { colors, font } from "./theme";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
  },
  contact: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: colors.textMuted,
    paddingBottom: 4,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 4,
  },
  confidentiality: {
    fontSize: 7.5,
    color: colors.textFaint,
    textAlign: "center",
    lineHeight: 1.4,
  },
  bold: {
    fontFamily: font.bold,
    color: colors.textMuted,
  },
});

export const Footer: React.FC = () => (
  <View style={styles.footer} fixed>
    <View style={styles.contact}>
      <Text>{brand.contact.email}</Text>
      <Text>{brand.contact.phone}</Text>
      <Text>{brand.contact.website}</Text>
    </View>
    <View style={styles.divider}>
      <Text style={styles.confidentiality}>
        Dengan membuka dokumen ini, Anda menyetujui bahwa semua isi dokumen ini{" "}
        <Text style={styles.bold}>tidak dapat disebarluaskan</Text> ke pihak manapun, kecuali atas izin dari personel {brand.name}.
      </Text>
    </View>
  </View>
);
