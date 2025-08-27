import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkRemainingCoordinates() {
  console.log('🔍 Kontrollerar återstående förskolor utan koordinater...\n');
  
  try {
    // Räkna saknade koordinater nu
    const { count: missingCount, error: missingError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .or('Latitud.is.null,Longitud.is.null');
    
    if (missingError) throw missingError;
    
    // Räkna totalt
    const { count: totalCount, error: totalError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Räkna med koordinater
    const withCoordinates = (totalCount || 0) - (missingCount || 0);
    
    console.log('📊 AKTUELL STATUS:');
    console.log('='.repeat(50));
    console.log(`🏫 Totalt antal förskolor: ${totalCount?.toLocaleString('sv-SE') || 'N/A'}`);
    console.log(`❌ Saknar koordinater: ${missingCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`✅ Har koordinater: ${withCoordinates.toLocaleString('sv-SE')}`);
    
    if (totalCount && totalCount > 0) {
      const percentage = ((withCoordinates / totalCount) * 100).toFixed(2);
      console.log(`📈 Täckning: ${percentage}%`);
    }
    
    // Visa några exempel på kvarvarande
    if (missingCount && missingCount > 0) {
      console.log('\n⚠️ EXEMPEL PÅ KVARVARANDE FÖRSKOLOR:');
      console.log('='.repeat(50));
      const { data: examples, error: exError } = await supabase
        .from('Förskolor')
        .select('Namn, Kommun, Adress')
        .or('Latitud.is.null,Longitud.is.null')
        .limit(5);
      
      if (exError) {
        console.log(`❌ Fel vid hämtning av exempel: ${exError.message}`);
      } else if (examples && examples.length > 0) {
        examples.forEach((p, i) => {
          console.log(`${i + 1}. ${p.Namn || 'Okänt namn'} - ${p.Adress || 'Ingen adress'}, ${p.Kommun || 'Okänd kommun'}`);
        });
      }
    } else {
      console.log('\n🎉 ALLA FÖRSKOLOR HAR NU KOORDINATER!');
    }
    
  } catch (error) {
    console.error('💥 Fel:', error);
  }
}

checkRemainingCoordinates().then(() => {
  console.log('\n✨ Kontroll klar!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});