import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Logo } from "./shared/Logo";
import { Footer } from "./shared/Footer";
import { brand } from "./shared/brand";
import { colors, font, fontSize, pagePadding } from "./shared/theme";
import type { MoUData, Milestone } from "./shared/types";

const styles = StyleSheet.create({
  page: {
    paddingTop:    pagePadding.top,
    paddingRight:  pagePadding.right,
    paddingBottom: pagePadding.bottom,
    paddingLeft:   pagePadding.left,
    fontFamily:    font.regular,
    fontSize:      fontSize.base,
    color:         colors.text,
    lineHeight:    1.55,
  },

  logoBar: { alignItems: "center", marginBottom: 18 },

  titleWrap: { alignItems: "center", marginBottom: 22 },
  title:     { fontFamily: font.bold, fontSize: 22, color: colors.textHeading, letterSpacing: 0.5 },
  sub:       { fontFamily: font.regular, fontSize: fontSize.md, color: colors.textMuted, letterSpacing: 2, marginTop: 6 },
  rule:      { width: 60, height: 3, backgroundColor: colors.primary, marginTop: 12 },

  preamble: { marginBottom: 8 },

  party: {
    backgroundColor: colors.bgAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderLeftStyle: "solid",
    padding: 12,
    marginBottom: 10,
  },
  partyRole: {
    fontFamily: font.bold,
    color: colors.primary,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partyRow:   { flexDirection: "row", marginBottom: 2 },
  partyLabel: { width: 165, color: colors.textMuted },
  partySep:   { width: 10, color: colors.textMuted },
  partyValue: { flex: 1 },

  packageTitle: {
    fontFamily: font.bold,
    color: colors.primary,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  packageTable: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "solid",
  },
  packageTableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: "solid",
  },
  packageTableRowFirst: {
    flexDirection: "row",
  },
  packageTableLabel: {
    width: "38%",
    padding: 8,
    fontFamily: font.bold,
    color: colors.textMuted,
    backgroundColor: colors.bgAlt,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderRightStyle: "solid",
  },
  packageTableValue: {
    flex: 1,
    padding: 8,
  },

  ack: { marginBottom: 14, textAlign: "justify" },

  h2: {
    fontFamily: font.bold,
    color: colors.primary,
    fontSize: fontSize.lg,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
  },

  // ordered list rows
  ol:       { marginLeft: 0 },
  oli:      { flexDirection: "row", marginBottom: 6 },
  oliNum:   { width: 22, fontFamily: font.bold, color: colors.primary },
  oliBody:  { flex: 1, textAlign: "justify" },
  bold:     { fontFamily: font.bold, color: colors.textHeading },
  italic:   { fontFamily: font.italic },

  sublist:    { marginTop: 4, marginLeft: 14 },
  subItem:    { flexDirection: "row", marginBottom: 2 },
  subBullet:  { width: 10 },
  subBody:    { flex: 1, textAlign: "justify" },

  milestone: {
    backgroundColor: colors.bgAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderLeftStyle: "solid",
    padding: 8,
    paddingLeft: 10,
    marginTop: 6,
  },
  milestoneTitle:  { fontFamily: font.bold, color: colors.textHeading, marginBottom: 2 },
  milestonePct:    { color: colors.primary },
  milestoneItem:   { flexDirection: "row", marginLeft: 14, marginTop: 1 },
  milestoneDot:    { width: 8 },
  milestoneItemBody: { flex: 1, fontSize: fontSize.base },

  closing: { marginTop: 22, textAlign: "justify" },

  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sig:        { width: "45%", alignItems: "center" },
  sigHead:    { textAlign: "center", marginBottom: 4 },
  sigHeadBold:{ fontFamily: font.bold, color: colors.primary, letterSpacing: 0.5 },
  sigSpace:   { height: 60 },
  sigName:    { fontFamily: font.bold, borderTopWidth: 1, borderTopColor: colors.textHeading, borderTopStyle: "solid", paddingTop: 4, alignSelf: "stretch", textAlign: "center" },
  sigRole:    { fontSize: 9.5, color: colors.textMuted, marginTop: 2, textAlign: "center" },
});

const Numbered: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
  <View style={styles.oli}>
    <Text style={styles.oliNum}>{index}.</Text>
    <Text style={styles.oliBody}>{children}</Text>
  </View>
);

/**
 * Section heading that pushes itself to the next page if there isn't enough
 * room for ~3 lines of content below — prevents orphan headings stuck at the
 * bottom of a page with the list/content starting on the next page.
 */
const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View minPresenceAhead={90}>
    <Text style={styles.h2}>{children}</Text>
  </View>
);

const SubItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.subItem}>
    <Text style={styles.subBullet}>•</Text>
    <Text style={styles.subBody}>{children}</Text>
  </View>
);

const MilestoneView: React.FC<{ milestone: Milestone }> = ({ milestone }) => (
  <View style={styles.milestone} wrap={false}>
    <Text style={styles.milestoneTitle}>
      {milestone.title}
      {milestone.percent_text && <Text style={styles.milestonePct}> — {milestone.percent_text}</Text>}
      {milestone.trigger && <Text>  →  {milestone.trigger}</Text>}
    </Text>
    {milestone.items?.map((item, i) => (
      <View key={i} style={styles.milestoneItem}>
        <Text style={styles.milestoneDot}>•</Text>
        <Text style={styles.milestoneItemBody}>{item}</Text>
      </View>
    ))}
  </View>
);

export const MoUDocument: React.FC<{ data: MoUData }> = ({ data }) => (
  <Document title={`MoU ${data.doc_number}`} author={brand.name}>
    <Page size="A4" style={styles.page}>
      <View style={styles.logoBar}>
        <Logo height={60} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>MoU</Text>
        <Text style={styles.sub}>MEMORANDUM OF UNDERSTANDING</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.preamble}>
        <Text>Yang bertanda tangan di bawah ini:</Text>
      </View>

      {/* PIHAK VENDOR */}
      <View style={styles.party}>
        <Text style={styles.partyRole}>PIHAK VENDOR: {brand.name.toUpperCase()} — {brand.tagline.toUpperCase()}</Text>
        {[
          ["Nama", brand.ceo],
          ["Jabatan", `${brand.ceo_title} ${brand.name}`],
          ["Alamat", brand.location],
          ["Email", brand.contact.email],
          ["No. Telepon", brand.contact.phone],
        ].map(([label, value], i) => (
          <View key={i} style={styles.partyRow}>
            <Text style={styles.partyLabel}>{label}</Text>
            <Text style={styles.partySep}>:</Text>
            <Text style={styles.partyValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* PIHAK KLIEN */}
      <View style={styles.party}>
        <Text style={styles.partyRole}>PIHAK KLIEN: {data.client.org.toUpperCase()}</Text>
        {[
          ["Nama", data.client.name],
          ["Jabatan", data.client.title],
          ["Alamat", data.client.address ?? "________________"],
          ["Email", data.client.email ?? "________________"],
          ["No. Telepon", data.client.phone ?? "________________"],
        ].map(([label, value], i) => (
          <View key={i} style={styles.partyRow}>
            <Text style={styles.partyLabel}>{label}</Text>
            <Text style={styles.partySep}>:</Text>
            <Text style={styles.partyValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* PAKET */}
      <View wrap={false}>
        <Text style={styles.packageTitle}>PAKET YANG DIPILIH</Text>
        <View style={styles.packageTable}>
          <View style={styles.packageTableRowFirst}>
            <Text style={styles.packageTableLabel}>Opsi tabel harga yang dipilih</Text>
            <Text style={styles.packageTableValue}>{data.package}</Text>
          </View>
          <View style={styles.packageTableRow}>
            <Text style={styles.packageTableLabel}>Waktu kerja sama</Text>
            <Text style={styles.packageTableValue}>{data.duration}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.ack}>
        Akan membaca, memahami, menghargai, serta menyetujui kesepakatan-kesepakatan yang tercantum di seluruh dokumen ini dari awal hingga akhir.
      </Text>

      {/* AGREEMENT */}
      <H2>Poin Kesepakatan (Agreement)</H2>
      <View style={styles.ol}>
        <Numbered index={1}>
          Kerja sama pihak vendor dan pihak klien dilakukan dalam kurun waktu <Text style={styles.bold}>{data.duration}</Text>.
        </Numbered>
        <Numbered index={2}>
          Perhitungan waktu; dalam hal ini diberlakukan sejak penandatanganan kontrak kedua belah pihak, sesuai dengan hari dan jam kerja.
        </Numbered>
        <Numbered index={3}>
          Hari dan jam kerja diberlakukan dengan waktu <Text style={styles.bold}>Senin – Jumat (09:00 – 17:00)</Text>.
        </Numbered>
        <Numbered index={4}>
          Pihak klien tidak menghubungi mengenai pekerjaan di luar jam kerja yang tercantum pada Poin Kesepakatan ke-3 (kecuali pada urusan yang mendadak dan tidak dapat diganti di waktu yang lain).
        </Numbered>
        <Numbered index={5}>
          Kerja sama ini sepenuhnya berlisensi pada pihak klien, namun dengan catatan dapat digunakan oleh pihak vendor demi kepentingan portfolio.
        </Numbered>
        <Numbered index={6}>
          Kedua belah pihak menetapkan pekerjaan ini sebagai hal yang <Text style={styles.italic}>confidential</Text> atau rahasia sampai output delivery telah dirilis kepada publik.
        </Numbered>
      </View>

      {/* PAYMENT */}
      <H2>Poin Pembayaran (Payment)</H2>
      <View style={styles.ol}>
        <Numbered index={1}>
          Pihak klien wajib membayarkan <Text style={styles.bold}>awal sebesar 25%</Text> dari total nominal yang tercantum pada tabel harga.
        </Numbered>
        <Numbered index={2}>
          Pihak klien wajib membayarkan sisa pelunasan setelah pekerjaan dinyatakan selesai.
        </Numbered>
        <Numbered index={3}>
          Pihak vendor tidak akan memberi output delivery apabila pihak klien belum melunasi kewajiban.
        </Numbered>
        <Numbered index={4}>
          Apabila terdapat keterlambatan pembayaran dari pihak klien, maka diberlakukan <Text style={styles.bold}>denda administratif sebesar 5%</Text> dari total tabel harga per harinya.
        </Numbered>
        <Numbered index={5}>
          <Text style={styles.bold}>Pembayaran Milestone:</Text> Pembayaran tambahan akan dilakukan berdasarkan pencapaian Milestone yang telah diselesaikan dan mendapatkan persetujuan klien atau perwakilan PIHAK VENDOR, dengan detail sebagai berikut:
        </Numbered>
        {data.milestones.map((m, i) => <MilestoneView key={i} milestone={m} />)}
      </View>

      {/* RECURRING / OPERATIONAL COSTS */}
      {data.operational_costs && data.operational_costs.length > 0 && (
        <>
          <H2>Biaya Operasional Berjalan (Recurring Costs)</H2>
          <View style={styles.ol}>
            {data.operational_costs.map((c, i) => (
              <Numbered key={i} index={i + 1}>
                <Text style={styles.bold}>{c.label}</Text>
                {" — "}
                <Text style={styles.bold}>{c.amount}</Text>
                {" "}{c.period}
                {c.note && <Text>. {c.note}</Text>}
              </Numbered>
            ))}
          </View>
        </>
      )}

      {/* ADDITIONAL NOTES / CLAUSES */}
      {data.additional_notes && data.additional_notes.length > 0 && (
        <>
          <H2>Ketentuan Tambahan (Additional Terms)</H2>
          <View style={styles.ol}>
            {data.additional_notes.map((note, i) => (
              <Numbered key={i} index={i + 1}>{note}</Numbered>
            ))}
          </View>
        </>
      )}

      {/* SOW GENERAL */}
      <H2>Poin Pekerjaan (Statement of Work — General)</H2>
      <View style={styles.ol}>
        <Numbered index={1}>
          Pihak klien memahami serta menyetujui keseluruhan dokumen <Text style={styles.italic}>pitch deck</Text> yang telah dibagikan pihak vendor.
        </Numbered>
        <Numbered index={2}>
          Pihak klien wajib memberikan PIC (<Text style={styles.italic}>People in Charge</Text>) atau orang yang bertanggung jawab untuk berkomunikasi dengan pihak vendor (diutamakan <Text style={styles.italic}>fast response</Text> pada hari dan jam kerja sesuai Poin Kesepakatan ke-3).
        </Numbered>
        <Numbered index={3}>
          Handover output delivery dilakukan pihak vendor melalui dokumen <Text style={styles.bold}>Berita Acara Serah Terima</Text>.
        </Numbered>
      </View>

      {/* SOW UI/X */}
      <H2>Poin Pekerjaan (Statement of Work — UI/X Design)</H2>
      <View style={styles.ol}>
        <Numbered index={1}>
          Pihak vendor mengerjakan UI/X Design yang mengacu pada penjabaran di <Text style={styles.italic}>Pitch Deck</Text>.
        </Numbered>
        <Numbered index={2}>
          Pihak klien diberi jatah revisi UI Design sebanyak <Text style={styles.bold}>8 minor</Text> dan <Text style={styles.bold}>2 mayor</Text>.
        </Numbered>
        <View style={styles.sublist}>
          <SubItem>
            <Text style={styles.bold}>Minor</Text> meliputi: perubahan font, color, image, hovering state, clicked state, dan sejenisnya.
          </SubItem>
          <SubItem>
            <Text style={styles.bold}>Mayor</Text> meliputi: perubahan susunan page, section, layout, dan sejenisnya.
          </SubItem>
        </View>
        <Numbered index={3}>
          Pihak klien dapat memberikan revisi secara <Text style={styles.italic}>unlimited</Text> dalam konteks apabila terdapat kesalahan dari pihak vendor (contoh: tidak sesuai brief/deck, salah menginput isi konten, copywriting, content writing, gambar, dan sejenisnya).
        </Numbered>
        <Numbered index={4}>
          Apabila pihak klien memberikan revisi di luar batas, maka akan diberlakukan denda administratif sebesar:
        </Numbered>
        <View style={styles.sublist}>
          <SubItem><Text style={styles.bold}>15%</Text> dari total tabel harga per revisi minor.</SubItem>
          <SubItem><Text style={styles.bold}>45%</Text> dari total tabel harga per revisi mayor.</SubItem>
        </View>
      </View>

      {/* SOW DEV */}
      <H2>Poin Pekerjaan (Statement of Work — Development)</H2>
      <View style={styles.ol}>
        <Numbered index={1}>
          Pihak vendor melakukan development dengan mengacu pada UI/X Design yang telah disetujui.
        </Numbered>
        <Numbered index={2}>
          Pihak vendor melakukan development dengan ketentuan: <Text style={styles.italic}>website development, content development, animation (hovering, clicked, wrong state, dsb.), setup domain</Text>, dan requirement-requirement lain yang telah dijabarkan di pitch deck.
        </Numbered>
      </View>

      {/* CLOSING */}
      <View style={styles.closing}>
        <Text>
          Demikian Surat Penawaran Harga (SPH) dan MoU ini dibuat dengan sebenar-benarnya, besar harapan kami agar Bapak/Ibu dapat bekerja sama dengan mengikuti poin-poin yang telah disebutkan. Akhir kata, kami ucapkan banyak terima kasih.
        </Text>
      </View>

      {/* SIGNATURES */}
      <View style={styles.signatures} wrap={false}>
        <View style={styles.sig}>
          <View style={styles.sigHead}>
            <Text style={styles.sigHeadBold}>PIHAK VENDOR</Text>
            <Text>{brand.name}</Text>
          </View>
          <View style={styles.sigSpace} />
          <Text style={styles.sigName}>{brand.ceo}</Text>
          <Text style={styles.sigRole}>{brand.ceo_title}, {brand.name}</Text>
        </View>
        <View style={styles.sig}>
          <View style={styles.sigHead}>
            <Text style={styles.sigHeadBold}>PIHAK KLIEN</Text>
            <Text>{data.client.org}</Text>
          </View>
          <View style={styles.sigSpace} />
          <Text style={styles.sigName}>{data.client.name}</Text>
          <Text style={styles.sigRole}>{data.client.title}</Text>
        </View>
      </View>

      <Footer />
    </Page>
  </Document>
);
