
-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  symptoms_text TEXT,
  blood_pressure TEXT,
  heart_rate INTEGER,
  temperature NUMERIC(4,1),
  pre_existing_conditions TEXT[] DEFAULT '{}',
  document_url TEXT,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High')),
  confidence_score NUMERIC(5,2),
  recommended_department TEXT,
  contributing_factors JSONB DEFAULT '[]',
  ai_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Public insert policy (patients submit without auth)
CREATE POLICY "Anyone can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (true);

-- Public select policy (staff dashboard reads all)
CREATE POLICY "Anyone can view patients"
  ON public.patients FOR SELECT
  USING (true);

-- Public update policy (AI results update)
CREATE POLICY "Anyone can update patients"
  ON public.patients FOR UPDATE
  USING (true);

-- Storage bucket for health documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-documents', 'health-documents', true);

CREATE POLICY "Anyone can upload health documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'health-documents');

CREATE POLICY "Anyone can view health documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'health-documents');
