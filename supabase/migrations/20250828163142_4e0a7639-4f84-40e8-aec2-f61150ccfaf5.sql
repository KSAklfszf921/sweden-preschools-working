-- Create the missing forskolor_changelog table for tracking coordinate updates
CREATE TABLE IF NOT EXISTS public.forskolor_changelog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  preschool_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL DEFAULT 'update',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.forskolor_changelog ENABLE ROW LEVEL SECURITY;

-- Create policies for the changelog table
CREATE POLICY "Allow read access to changelog" 
ON public.forskolor_changelog 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert to changelog" 
ON public.forskolor_changelog 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_forskolor_changelog_preschool_id 
ON public.forskolor_changelog(preschool_id);

CREATE INDEX IF NOT EXISTS idx_forskolor_changelog_created_at 
ON public.forskolor_changelog(created_at);

-- Create trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forskolor_changelog_updated_at
BEFORE UPDATE ON public.forskolor_changelog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();