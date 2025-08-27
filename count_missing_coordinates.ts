import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function countMissingCoordinates() {
  console.log('🔍 Ansluter till Supabase...');
  
  // Först, kolla vilka kolumner som finns
  console.log('\n📋 Kontrollerar tabellstruktur...');
  const { data: sampleData, error: sampleError } = await supabase
    .from('v_forskolor_geo')
    .select('*')
    .limit(1);
  
  if (sampleError) {
    console.error('❌ Fel vid kontroll av tabellstruktur:', sampleError);
    return;
  }
  
  if (sampleData && sampleData.length > 0) {
    console.log('🏷️ Tillgängliga kolumner:');
    console.log(Object.keys(sampleData[0]).join(', '));
    console.log('\n📄 Exempel på data:');
    console.log(JSON.stringify(sampleData[0], null, 2));
    console.log('\n' + '='.repeat(50));
  }
  
  try {
    // Räkna totalt antal förskolor
    const { count: totalCount, error: totalError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('❌ Fel vid räkning av totalt antal:', totalError);
      return;
    }
    
    // Räkna förskolor som saknar koordinater (latitude är null)
    const { count: missingCount, error: missingError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true })
      .is('latitud', null);
    
    if (missingError) {
      console.error('❌ Fel vid räkning av saknade koordinater:', missingError);
      return;
    }
    
    // Räkna förskolor med koordinater
    const { count: withCoordinatesCount, error: coordError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true })
      .not('latitud', 'is', null);
    
    if (coordError) {
      console.error('❌ Fel vid räkning av förskolor med koordinater:', coordError);
      return;
    }
    
    console.log('\n📊 RESULTAT:');
    console.log('='.repeat(50));
    console.log(`🏫 Totalt antal förskolor: ${totalCount?.toLocaleString('sv-SE') || 'N/A'}`);
    console.log(`❌ Förskolor som SAKNAR koordinater: ${missingCount?.toLocaleString('sv-SE') || 'N/A'}`);
    console.log(`✅ Förskolor med koordinater: ${withCoordinatesCount?.toLocaleString('sv-SE') || 'N/A'}`);
    
    if (totalCount && missingCount) {
      const percentage = ((missingCount / totalCount) * 100).toFixed(2);
      console.log(`📈 Andel som saknar koordinater: ${percentage}%`);
    }
    
    // Visa några exempel på förskolor som saknar koordinater
    console.log('\n🔍 Exempel på förskolor som saknar koordinater:');
    const { data: examples, error: exampleError } = await supabase
      .from('v_forskolor_geo')
      .select('*')
      .is('latitud', null)
      .limit(10);
    
    if (exampleError) {
      console.error('❌ Fel vid hämtning av exempel:', exampleError);
      return;
    }
    
    if (examples && examples.length > 0) {
      examples.forEach((preschool, index) => {
        console.log(`${index + 1}. ${JSON.stringify(preschool, null, 2)}`);
        console.log('');
      });
    } else {
      console.log('🎉 Inga förskolor saknar koordinater!');
    }
    
  } catch (error) {
    console.error('💥 Oväntat fel:', error);
  }
}

// Kör scriptet
countMissingCoordinates().then(() => {
  console.log('✨ Analys klar!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});