import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSpecificPreschool() {
  console.log('🔍 Kontrollerar specifik förskola som vi vet att vi uppdaterade...\n');
  
  try {
    // Aspö Förskola var den första i vår lista (Karlskrona)
    const { data: aspöList, error: aspöError } = await supabase
      .from('Förskolor')
      .select('id, Namn, Kommun, Adress, Latitud, Longitud')
      .eq('Namn', 'Aspö Förskola')
      .eq('Kommun', 'Karlskrona');
    
    if (aspöError) {
      console.error('❌ Fel vid hämtning av Aspö Förskola:', aspöError);
      return;
    }
    
    if (aspöList && aspöList.length > 0) {
      const aspö = aspöList[0];
      console.log('📋 Aspö Förskola (första i vår geocoding-lista):');
      console.log('='.repeat(60));
      console.log(`🏫 Namn: ${aspö.Namn}`);
      console.log(`📍 Adress: ${aspö.Adress}, ${aspö.Kommun}`);
      console.log(`🗺️ Latitud: ${aspö.Latitud || 'SAKNAS'}`);
      console.log(`🗺️ Longitud: ${aspö.Longitud || 'SAKNAS'}`);
      console.log(`🆔 ID: ${aspö.id}`);
    }
    
    // Kolla även några andra från listan
    const namesToCheck = [
      'Laxen Förskola',
      'Vikebo Förskola', 
      'Glasblåsarens Förskola',
      'Förskolan Noas Ark'
    ];
    
    for (const namn of namesToCheck) {
      const { data: preschool, error } = await supabase
        .from('Förskolor')
        .select('id, Namn, Kommun, Latitud, Longitud')
        .eq('Namn', namn)
        .single();
      
      if (!error && preschool) {
        console.log(`\n🏫 ${preschool.Namn} (${preschool.Kommun})`);
        console.log(`   Lat: ${preschool.Latitud || 'SAKNAS'}, Lng: ${preschool.Longitud || 'SAKNAS'}`);
        console.log(`   ID: ${preschool.id}`);
      }
    }
    
    // Kontrollera totalt igen med en ny query
    console.log('\n🔄 OMRÄKNING MED NY QUERY:');
    console.log('='.repeat(60));
    const { count: newMissingCount, error: newError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .or('Latitud.is.null,Longitud.is.null');
    
    if (newError) throw newError;
    
    console.log(`❌ Förskolor som saknar koordinater (ny räkning): ${newMissingCount?.toLocaleString('sv-SE') || '0'}`);
    
  } catch (error) {
    console.error('💥 Fel:', error);
  }
}

checkSpecificPreschool().then(() => {
  console.log('\n✨ Kontroll klar!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});