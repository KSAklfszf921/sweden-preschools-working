import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkOriginalTable() {
  console.log('🔍 Kontrollerar ORIGINAL "Förskolor" tabellen...\n');
  
  try {
    // 1. Totalt antal i ursprungstabellen
    console.log('📊 Räknar från "Förskolor" tabellen...');
    const { count: totalCount, error: totalError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // 2. Räkna förskolor som saknar Latitud
    const { count: missingLatCount, error: latError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .is('Latitud', null);
    
    if (latError) throw latError;
    
    // 3. Räkna förskolor som saknar Longitud
    const { count: missingLngCount, error: lngError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .is('Longitud', null);
    
    if (lngError) throw lngError;
    
    // 4. Räkna förskolor som saknar BÅDA koordinaterna
    const { count: missingBothCount, error: bothError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .is('Latitud', null)
      .is('Longitud', null);
    
    if (bothError) throw bothError;
    
    // 5. Räkna förskolor som saknar NÅGON av koordinaterna
    const { count: missingAnyCount, error: anyError } = await supabase
      .from('Förskolor')
      .select('*', { count: 'exact', head: true })
      .or('Latitud.is.null,Longitud.is.null');
    
    if (anyError) throw anyError;
    
    // 6. Visa exempel på struktur
    console.log('📋 Exempel på tabellstruktur:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('Förskolor')
      .select('*')
      .limit(2);
    
    if (sampleError) throw sampleError;
    
    if (sampleData && sampleData.length > 0) {
      console.log('🏷️ Tillgängliga kolumner:');
      console.log(Object.keys(sampleData[0]).join(', '));
      console.log('\n📄 Första förskolan:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    }
    
    // VISA RESULTAT
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTAT FRÅN "Förskolor" TABELLEN:');
    console.log('='.repeat(60));
    console.log(`🏫 Totalt antal förskolor: ${totalCount?.toLocaleString('sv-SE') || 'N/A'}`);
    console.log(`❌ Saknar Latitud: ${missingLatCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`❌ Saknar Longitud: ${missingLngCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`❌ Saknar BÅDA koordinaterna: ${missingBothCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`⚠️ Saknar NÅGON koordinat: ${missingAnyCount?.toLocaleString('sv-SE') || '0'}`);
    
    const withCoordinates = (totalCount || 0) - (missingAnyCount || 0);
    console.log(`✅ Har båda koordinaterna: ${withCoordinates.toLocaleString('sv-SE')}`);
    
    if (totalCount && totalCount > 0) {
      const percentage = ((withCoordinates / totalCount) * 100).toFixed(2);
      console.log(`📈 Andel med koordinater: ${percentage}%`);
    }
    
    // Jämför med v_forskolor_geo
    console.log('\n🔄 JÄMFÖRELSE MED v_forskolor_geo:');
    console.log('='.repeat(60));
    const { count: viewCount, error: viewError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true });
    
    if (viewError) {
      console.log(`❌ Kunde inte läsa v_forskolor_geo: ${viewError.message}`);
    } else {
      console.log(`📋 Förskolor i v_forskolor_geo: ${viewCount?.toLocaleString('sv-SE') || 'N/A'}`);
      console.log(`🔍 Skillnad: ${((totalCount || 0) - (viewCount || 0)).toLocaleString('sv-SE')} förskolor`);
      console.log(`💡 Troligen filtrerar v_forskolor_geo bort förskolor utan koordinater`);
    }
    
    // Visa exempel på förskolor som saknar koordinater
    console.log('\n⚠️ EXEMPEL PÅ FÖRSKOLOR SOM SAKNAR KOORDINATER:');
    console.log('='.repeat(60));
    const { data: missingExamples, error: missingError } = await supabase
      .from('Förskolor')
      .select('id, Namn, Kommun, Adress, Latitud, Longitud')
      .or('Latitud.is.null,Longitud.is.null')
      .limit(10);
    
    if (missingError) {
      console.log(`❌ Fel vid hämtning av exempel: ${missingError.message}`);
    } else if (missingExamples && missingExamples.length > 0) {
      missingExamples.forEach((preschool, index) => {
        console.log(`${index + 1}. ${preschool.Namn || 'Okänt namn'}`);
        console.log(`   📍 ${preschool.Adress || 'Ingen adress'}, ${preschool.Kommun || 'Okänd kommun'}`);
        console.log(`   🗺️ Lat: ${preschool.Latitud || 'SAKNAS'}, Lng: ${preschool.Longitud || 'SAKNAS'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('💥 Fel under analys:', error);
  }
}

// Kör analysen
checkOriginalTable().then(() => {
  console.log('✨ Analys av ursprungstabellen klar!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});