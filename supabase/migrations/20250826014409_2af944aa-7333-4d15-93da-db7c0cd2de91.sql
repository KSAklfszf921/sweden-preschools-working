-- Create Google Places data table for enhanced preschool information
CREATE TABLE public.preschool_google_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public."Förskolor"(id) ON DELETE CASCADE,
  google_place_id text UNIQUE,
  google_rating numeric(2,1),
  google_reviews_count integer DEFAULT 0,
  google_photos text[], -- Array of photo reference IDs
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preschool_google_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can view Google data" 
ON public.preschool_google_data 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_preschool_google_data_preschool_id ON public.preschool_google_data(preschool_id);
CREATE INDEX idx_preschool_google_data_place_id ON public.preschool_google_data(google_place_id);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  preschool_id uuid NOT NULL REFERENCES public."Förskolor"(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, preschool_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create search history table
CREATE TABLE public.user_search_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  search_query jsonb NOT NULL,
  search_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for search history
CREATE POLICY "Users can view their own search history" 
ON public.user_search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" 
ON public.user_search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" 
ON public.user_search_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update Google data timestamp
CREATE OR REPLACE FUNCTION public.update_google_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_data_timestamp
BEFORE UPDATE ON public.preschool_google_data
FOR EACH ROW
EXECUTE FUNCTION public.update_google_data_timestamp();