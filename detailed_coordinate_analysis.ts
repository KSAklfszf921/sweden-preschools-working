import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function detailedCoordinateAnalysis() {
  console.log('🔍 Detaljerad koordinatanalys av Sveriges förskolor...\n');
  
  try {
    // 1. Totalt antal förskolor
    const { count: totalCount, error: totalError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // 2. Förskolor som är null
    const { count: nullCount, error: nullError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true })
      .is('latitud', null);
    
    if (nullError) throw nullError;
    
    // 3. Förskolor med 0, 0 koordinater (ofta ogiltigt)
    const { count: zeroCount, error: zeroError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true })
      .eq('latitud', 0)
      .eq('longitud', 0);
    
    if (zeroError) throw zeroError;
    
    // 4. Förskolor med koordinater utanför Sverige
    // Sverige: Lat 55-69°N, Lng 10-24°E
    const { count: outsideSwedenCount, error: outsideError } = await supabase
      .from('v_forskolor_geo')
      .select('*', { count: 'exact', head: true })
      .or('latitud.lt.55,latitud.gt.69,longitud.lt.10,longitud.gt.24');
    
    if (outsideError) throw outsideError;
    
    // 5. Kolla koordinater som verkar suspekta (exakt samma koordinater)
    const { data: duplicateCoords, error: duplicateError } = await supabase
      .from('v_forskolor_geo')
      .select('latitud, longitud')
      .not('latitud', 'is', null)
      .not('longitud', 'is', null);
    
    if (duplicateError) throw duplicateError;
    
    // Analysera duplicates
    const coordMap = new Map();
    duplicateCoords?.forEach(coord => {
      const key = `${coord.latitud},${coord.longitud}`;
      coordMap.set(key, (coordMap.get(key) || 0) + 1);
    });
    
    const duplicates = Array.from(coordMap.entries())
      .filter(([key, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    // 6. Kommuner med saknade koordinater
    const { data: kommunData, error: kommunError } = await supabase
      .from('v_forskolor_geo')
      .select('kommun, latitud')
      .not('kommun', 'is', null);
    
    if (kommunError) throw kommunError;
    
    const kommunStats = new Map();
    kommunData?.forEach(item => {
      const kommun = item.kommun || 'Okänd';
      if (!kommunStats.has(kommun)) {
        kommunStats.set(kommun, { total: 0, missing: 0 });
      }
      const stats = kommunStats.get(kommun)!;
      stats.total++;
      if (item.latitud === null) {
        stats.missing++;
      }
    });
    
    // Sortera kommuner efter antal saknade koordinater
    const kommunSorted = Array.from(kommunStats.entries())
      .map(([kommun, stats]) => ({
        kommun,
        total: stats.total,
        missing: stats.missing,
        percentage: stats.total > 0 ? (stats.missing / stats.total * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 15);
    
    // VISA RESULTAT
    console.log('📊 KOORDINATANALYS RESULTAT');
    console.log('='.repeat(60));
    console.log(`🏫 Totalt antal förskolor: ${totalCount?.toLocaleString('sv-SE') || 'N/A'}`);
    console.log(`❌ Förskolor med NULL koordinater: ${nullCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`🎯 Förskolor med (0, 0) koordinater: ${zeroCount?.toLocaleString('sv-SE') || '0'}`);
    console.log(`🌍 Förskolor utanför Sverige: ${outsideSwedenCount?.toLocaleString('sv-SE') || '0'}`);
    
    const validCount = (totalCount || 0) - (nullCount || 0) - (zeroCount || 0) - (outsideSwedenCount || 0);
    console.log(`✅ Förskolor med giltiga koordinater: ${validCount.toLocaleString('sv-SE')}`);
    
    if (totalCount && totalCount > 0) {
      const qualityPercentage = ((validCount / totalCount) * 100).toFixed(2);
      console.log(`📈 Datakvalitet (giltiga koordinater): ${qualityPercentage}%`);
    }
    
    console.log('\n🔄 DUPLICERADE KOORDINATER (Top 10):');
    console.log('='.repeat(60));
    duplicates.forEach(([coords, count], index) => {
      const [lat, lng] = coords.split(',');
      console.log(`${index + 1}. ${count} förskolor på: (${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)})`);
    });
    
    console.log('\n🏘️ KOMMUNER MED SAKNADE KOORDINATER (Top 15):');
    console.log('='.repeat(60));
    kommunSorted.forEach((item, index) => {
      if (item.missing > 0) {
        console.log(`${index + 1}. ${item.kommun}: ${item.missing}/${item.total} (${item.percentage}%)`);
      }
    });
    
    // Visa exempel på förskolor med potentiella problem
    if (zeroCount && zeroCount > 0) {
      console.log('\n⚠️ EXEMPEL PÅ FÖRSKOLOR MED (0, 0) KOORDINATER:');
      console.log('='.repeat(60));
      const { data: zeroExamples, error: zeroExError } = await supabase
        .from('v_forskolor_geo')
        .select('namn, kommun, latitud, longitud')
        .eq('latitud', 0)
        .eq('longitud', 0)
        .limit(5);
      
      if (!zeroExError && zeroExamples) {
        zeroExamples.forEach((item, index) => {
          console.log(`${index + 1}. ${item.namn || 'Okänt namn'} (${item.kommun || 'Okänd kommun'})`);
        });
      }
    }
    
    if (outsideSwedenCount && outsideSwedenCount > 0) {
      console.log('\n🌍 EXEMPEL PÅ FÖRSKOLOR UTANFÖR SVERIGE:');
      console.log('='.repeat(60));
      const { data: outsideExamples, error: outsideExError } = await supabase
        .from('v_forskolor_geo')
        .select('namn, kommun, latitud, longitud')
        .or('latitud.lt.55,latitud.gt.69,longitud.lt.10,longitud.gt.24')
        .limit(5);
      
      if (!outsideExError && outsideExamples) {
        outsideExamples.forEach((item, index) => {
          console.log(`${index + 1}. ${item.namn || 'Okänt namn'} (${item.kommun || 'Okänd kommun'}) - (${item.latitud}, ${item.longitud})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Fel under analys:', error);
  }
}

// Kör analysen
detailedCoordinateAnalysis().then(() => {
  console.log('\n✨ Detaljerad analys klar!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});