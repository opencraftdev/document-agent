import brandJson from "../../data/brand.json" with { type: "json" };

export interface Brand {
  name: string;
  tagline: string;
  ceo: string;
  ceo_title: string;
  location: string;
  city: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
}

export const brand: Brand = brandJson as Brand;
