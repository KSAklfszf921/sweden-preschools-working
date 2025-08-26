-- Enable real-time for Förskolor table
ALTER TABLE "Förskolor" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "Förskolor";

-- Enable real-time for preschool_google_data table  
ALTER TABLE preschool_google_data REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE preschool_google_data;

-- Enable real-time for preschool_images table
ALTER TABLE preschool_images REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE preschool_images;