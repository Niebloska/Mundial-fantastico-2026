import { createClient } from '@supabase/supabase-js';

// Usaremos variables de entorno, pero por ahora dejamos la estructura lista
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zycylocvsicbbbkdpuhn.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Y3lsb2N2c2ljYmJia2RwdWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzM1NDQsImV4cCI6MjA5Mzc0OTU0NH0.aMI-6ZdMzV2fpzWGGSReg7k8lXzrZiSf9_Be7VY9-wE';

export const supabase = createClient(supabaseUrl, supabaseKey);
