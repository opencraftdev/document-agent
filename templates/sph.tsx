import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Logo } from "./shared/Logo";
import { Footer } from "./shared/Footer";
import { brand } from "./shared/brand";
import { colors, font, fontSize, pagePadding } from "./shared/theme";
import type { SPHData, PriceTable, PriceRow } from "./shared/types";

const COL = { no: "6%", jasa: "26%", ket: "46%", harga: "22%" };

const styles = StyleSheet.create({
  page: {
    paddingTop:    pagePadding.top,
    paddingRight:  pagePadding.right,
    paddingBottom: pagePadding.bottom,
    paddingLeft:   pagePadding.left,
    fontFamily:    font.regular,
    fontSize:      fontSize.base,
    color:         colors.text,
    lineHeight:    1.5,
  },

  logoBar: { alignItems: "center", marginBottom: 28 },

  dateLine: { textAlign: "right", marginBottom: 14 },

  letterMeta: { marginBottom: 18 },
  metaRow:   { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 70 },
  metaSep:   { width: 8 },
  metaValue: { flex: 1 },

  recipient: { marginBottom: 16 },

  bodyPara: { textAlign: "justify", marginBottom: 10 },
  bold:     { fontFamily: font.bold, color: colors.textHeading },
  italic:   { fontFamily: font.italic },

  tableTitle: { fontFamily: font.bold, marginBottom: 4, marginTop: 14, color: colors.textHeading },
  tableTitleOpt: { color: colors.optional, fontSize: fontSize.sm, fontFamily: font.boldItalic },

  table:        { marginBottom: 12, borderWidth: 1, borderColor: colors.borderMid, borderStyle: "solid" },
  tableHeader:  { flexDirection: "row", backgroundColor: colors.primary },
  thCell:       { color: "#ffffff", padding: 6, fontFamily: font.bold, fontSize: fontSize.base },
  tableRow:     { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.borderMid, borderTopStyle: "solid" },
  td:           { padding: 6, fontSize: fontSize.base },
  ket:          { fontFamily: font.italic, color: colors.textMuted, fontSize: 9.5 },
  optInline:    { color: colors.optional, fontFamily: font.boldItalic, fontSize: fontSize.sm },
  totalRow:     { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.borderMid, borderTopStyle: "solid", backgroundColor: "#f3f3f3" },
  totalLabel:   { padding: 6, fontFamily: font.bold, fontSize: fontSize.base, width: "78%" },
  totalValue:   { padding: 6, fontFamily: font.bold, fontSize: fontSize.base, width: COL.harga },

  closing:   { marginTop: 20 },
  signature: { marginTop: 18, width: 240 },
  sigSpace:  { height: 40 },
  sigName:   { fontFamily: font.bold, borderTopWidth: 1, borderTopColor: colors.textHeading, borderTopStyle: "solid", paddingTop: 4 },
  sigRole:   { fontSize: 9.5, color: colors.textMuted, marginTop: 2 },
});

const TableCell = ({ width, children, style }: { width: string; children: React.ReactNode; style?: any }) => (
  <Text style={[styles.td, { width }, style]}>{children}</Text>
);

const PriceTableView: React.FC<{ table: PriceTable }> = ({ table }) => (
  <View wrap={false}>
    <Text style={styles.tableTitle}>
      {table.title}
      {table.optional && <Text style={styles.tableTitleOpt}>  (Optional)</Text>}
    </Text>

    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.thCell, { width: COL.no }]}>No</Text>
        <Text style={[styles.thCell, { width: COL.jasa }]}>Jasa</Text>
        <Text style={[styles.thCell, { width: COL.ket }]}>Keterangan</Text>
        <Text style={[styles.thCell, { width: COL.harga }]}>Harga</Text>
      </View>

      {table.rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <TableCell width={COL.no}>{row.no}</TableCell>
          <TableCell width={COL.jasa}>
            {row.jasa}
            {row.optional && <Text style={styles.optInline}>  (Optional)</Text>}
          </TableCell>
          <TableCell width={COL.ket} style={styles.ket}>
            {row.keterangan}
            {row.ket_extra && (
              <>
                {"  "}
                <Text style={styles.optInline}>{row.ket_extra}</Text>
              </>
            )}
          </TableCell>
          <TableCell width={COL.harga}>{row.harga}</TableCell>
        </View>
      ))}

      {table.total && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{table.total}</Text>
        </View>
      )}
    </View>
  </View>
);

export const SPHDocument: React.FC<{ data: SPHData }> = ({ data }) => (
  <Document title={`SPH ${data.doc_number}`} author={brand.name}>
    <Page size="A4" style={styles.page}>
      <View style={styles.logoBar}>
        <Logo height={60} />
      </View>

      <Text style={styles.dateLine}>{data.city}, {data.date}</Text>

      <View style={styles.letterMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>No</Text>
          <Text style={styles.metaSep}>:</Text>
          <Text style={styles.metaValue}>{data.doc_number}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Lampiran</Text>
          <Text style={styles.metaSep}>:</Text>
          <Text style={styles.metaValue}>{data.lampiran}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Hal</Text>
          <Text style={styles.metaSep}>:</Text>
          <Text style={styles.metaValue}>{data.subject}</Text>
        </View>
      </View>

      <View style={styles.recipient}>
        <Text>Yth. {data.recipient.name}</Text>
        <Text>{data.recipient.org}</Text>
        <Text>{data.recipient.location}</Text>
      </View>

      <Text style={styles.bodyPara}>Dengan Hormat,</Text>
      <Text style={styles.bodyPara}>
        Kami dari <Text style={styles.bold}>{brand.name}</Text>, sebuah badan usaha yang bergerak di bidang jasa, berfokus pada <Text style={styles.bold}>AI Transformation</Text> dan <Text style={styles.bold}>Pengembangan Ekosistem Digital</Text>. Kami membantu para pelaku usaha dalam mengoptimalkan proses bisnis melalui pemanfaatan teknologi kecerdasan buatan.
      </Text>
      <Text style={styles.bodyPara}>
        Layanan kami mencakup konsultasi strategis, perancangan solusi, hingga eksekusi implementasi untuk mendorong efisiensi, otomatisasi, dan pertumbuhan bisnis. Adapun layanan utama kami meliputi <Text style={styles.bold}>AI Consulting</Text> dan <Text style={styles.bold}>IT Consulting</Text>.
      </Text>
      <Text style={styles.bodyPara}>
        Bersamaan dengan surat ini, Kami bermaksud untuk menawarkan jasa <Text style={styles.italic}>{data.subject_short}</Text>. Adapun rincian harga yang kami tawarkan sebagai berikut:
      </Text>

      {data.tables.map((t, i) => <PriceTableView key={i} table={t} />)}

      <View style={styles.closing}>
        <Text style={styles.bodyPara}>
          Demikian penawaran ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
        </Text>

        <View style={styles.signature}>
          <Text>Hormat kami,</Text>
          <View style={styles.sigSpace} />
          <Text style={styles.sigName}>{brand.ceo}</Text>
          <Text style={styles.sigRole}>{brand.ceo_title}, {brand.name}</Text>
        </View>
      </View>

      <Footer />
    </Page>
  </Document>
);
