// ─── SPH ───────────────────────────────────────────────────────────

export interface SPHData {
  doc_number: string;
  city: string;
  date: string;
  lampiran: string;
  subject: string;
  subject_short: string;
  recipient: {
    name: string;
    org: string;
    location: string;
  };
  tables: PriceTable[];
}

export interface PriceTable {
  title: string;
  optional?: boolean;
  rows: PriceRow[];
  total?: string;
}

export interface PriceRow {
  no: number | string;
  jasa: string;
  keterangan: string;
  ket_extra?: string;
  harga: string;
  optional?: boolean;
}

// ─── MoU ───────────────────────────────────────────────────────────

export interface MoUData {
  doc_number: string;
  vendor_id?: string;
  client: {
    org: string;
    name: string;
    title: string;
    id?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  package: string;
  duration: string;
  milestones: Milestone[];
  operational_costs?: OperationalCost[];
  additional_notes?: string[];
}

export interface OperationalCost {
  label: string;
  amount: string;
  period: string;
  note?: string;
}

export interface Milestone {
  title: string;
  percent_text?: string;
  trigger?: string;
  items?: string[];
}
