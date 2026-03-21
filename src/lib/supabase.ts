import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ContractMetadata = {
  address:          string;
  property_address: string;
  landlord_name:    string;
  tenant_name:      string;
  photo_url?:       string;
  created_at?:      string;
};
