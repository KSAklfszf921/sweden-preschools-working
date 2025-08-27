import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/integrations/supabase/types';

const SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU";
const GOOGLE_API_KEY = "AIzaSyAiw36pD7WMkFwBDgyrll9imHsxzK1JiTY";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface PreschoolToGeocode {
  id: string;
  Namn: string | null;
  Kommun: string | null;
  Adress: string | null;
  Postnummer: number | null;
}

interface GeocodeResult {
  id: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  error?: string;
  address_used?: string;
}

// Retry delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string): Promise<{lat: number, lng: number, formatted_address: string} | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=se&language=sv&key=${GOOGLE_API_KEY}`;
  
  const maxRetries = 3;
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        console.log(`⚠️ API limit reached, waiting 1 second... (retry ${retry + 1}/${maxRetries + 1})`);
        await delay(1000);
        continue;
      }
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Kontrollera att resultatet är i Sverige (ungefär)
        const { lat, lng } = result.geometry.location;
        if (lat >= 55 && lat <= 70 && lng >= 10 && lng <= 25) {
          return {
            lat: lat,
            lng: lng,
            formatted_address: result.formatted_address
          };
        } else {
          console.log(`⚠️ Koordinater utanför Sverige: ${lat}, ${lng} för adress: ${address}`);
          return null;
        }
      } else {
        console.log(`❌ Geocoding misslyckades för: ${address} (Status: ${data.status})`);
        if (data.error_message) {
          console.log(`   Felmeddelande: ${data.error_message}`);
        }
        return null;
      }
    } catch (error) {
      console.error(`💥 Fel vid geocoding av ${address}:`, error);
      if (retry < maxRetries) {
        console.log(`🔄 Försöker igen om 2 sekunder... (retry ${retry + 1}/${maxRetries + 1})`);
        await delay(2000);
      }
    }
  }
  
  return null;
}

async function buildAddressString(preschool: PreschoolToGeocode): Promise<string[]> {
  const addresses: string[] = [];
  
  // Prioritetsordning för adresser
  if (preschool.Adress && preschool.Kommun) {
    // Fullständig adress med kommun
    addresses.push(`${preschool.Adress}, ${preschool.Kommun}, Sverige`);
    
    // Med postnummer om tillgängligt
    if (preschool.Postnummer) {
      addresses.push(`${preschool.Adress}, ${preschool.Postnummer} ${preschool.Kommun}, Sverige`);
    }
  }
  
  // Försök med endast namn och kommun
  if (preschool.Namn && preschool.Kommun) {
    addresses.push(`${preschool.Namn}, ${preschool.Kommun}, Sverige`);
  }
  
  // Endast kommun som sista utväg
  if (preschool.Kommun) {
    addresses.push(`${preschool.Kommun}, Sverige`);
  }
  
  return addresses;
}

async function geocodePreschool(preschool: PreschoolToGeocode): Promise<GeocodeResult> {
  const addresses = await buildAddressString(preschool);
  
  console.log(`🔍 Geocoding: ${preschool.Namn || 'Okänt namn'} (${preschool.Kommun || 'Okänd kommun'})`);
  
  for (const address of addresses) {
    console.log(`   📍 Försöker med: ${address}`);
    const result = await geocodeAddress(address);
    
    if (result) {
      console.log(`   ✅ Hittade: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
      return {
        id: preschool.id,
        success: true,
        latitude: result.lat,
        longitude: result.lng,
        formatted_address: result.formatted_address,
        address_used: address
      };
    }
    
    // Vänta lite mellan försök för samma förskola
    await delay(200);
  }
  
  return {
    id: preschool.id,
    success: false,
    error: 'Kunde inte hitta giltiga koordinater',
    address_used: addresses[0] || 'Ingen adress tillgänglig'
  };
}

async function updatePreschoolCoordinates(results: GeocodeResult[]): Promise<void> {
  const successfulResults = results.filter(r => r.success && r.latitude && r.longitude);
  
  console.log(`\n💾 Uppdaterar ${successfulResults.length} förskolor i databasen...`);
  
  for (const result of successfulResults) {
    try {
      const { error } = await supabase
        .from('Förskolor')
        .update({
          Latitud: result.latitude,
          Longitud: result.longitude
        })
        .eq('id', result.id);
      
      if (error) {
        console.error(`❌ Fel vid uppdatering av ${result.id}:`, error);
      } else {
        console.log(`✅ Uppdaterade ${result.id} med koordinater (${result.latitude?.toFixed(6)}, ${result.longitude?.toFixed(6)})`);
      }
      
      // Liten paus mellan uppdateringar
      await delay(100);
    } catch (error) {
      console.error(`💥 Oväntat fel vid uppdatering av ${result.id}:`, error);
    }
  }
}

export async function geocodeMissingCoordinates(batchSize: number = 50, testMode: boolean = false) {
  console.log('🚀 Startar geocoding av förskolor som saknar koordinater...\n');
  
  try {
    // Hämta förskolor som saknar koordinater
    console.log('📊 Hämtar förskolor som saknar koordinater...');
    const { data: missingCoordinates, error: fetchError } = await supabase
      .from('Förskolor')
      .select('id, Namn, Kommun, Adress, Postnummer, Latitud, Longitud')
      .or('Latitud.is.null,Longitud.is.null')
      .limit(testMode ? 5 : batchSize);
    
    if (fetchError) throw fetchError;
    
    if (!missingCoordinates || missingCoordinates.length === 0) {
      console.log('🎉 Inga förskolor saknar koordinater!');
      return;
    }
    
    console.log(`📋 Hittade ${missingCoordinates.length} förskolor som saknar koordinater`);
    console.log(`${testMode ? '🧪 TESTLÄGE: Endast de första 5 förskolorna' : `📦 Batch-storlek: ${batchSize}`}\n`);
    
    // Visa exempel på vad som kommer att geocodas
    console.log('📋 Exempel på förskolor som kommer att geocodas:');
    missingCoordinates.slice(0, 3).forEach((p, i) => {
      console.log(`${i + 1}. ${p.Namn || 'Okänt namn'} - ${p.Adress || 'Ingen adress'}, ${p.Kommun || 'Okänd kommun'}`);
    });
    
    if (testMode) {
      console.log('\n⏳ Väntar 3 sekunder innan start...');
      await delay(3000);
    }
    
    // Geocoda varje förskola
    const results: GeocodeResult[] = [];
    let processed = 0;
    
    for (const preschool of missingCoordinates) {
      processed++;
      console.log(`\n[${processed}/${missingCoordinates.length}] ================`);
      
      const result = await geocodePreschool(preschool);
      results.push(result);
      
      // Progress
      const progress = ((processed / missingCoordinates.length) * 100).toFixed(1);
      console.log(`📈 Progress: ${progress}%`);
      
      // Vänta mellan API-anrop för att inte överskrida limits
      await delay(200);
    }
    
    // Sammanställ resultat
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 GEOCODING RESULTAT:');
    console.log('='.repeat(60));
    console.log(`🎯 Totalt processade: ${results.length}`);
    console.log(`✅ Lyckade geocodings: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Misslyckade geocodings: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);
    
    if (failed.length > 0) {
      console.log('\n❌ Misslyckade geocodings:');
      failed.forEach((fail, i) => {
        console.log(`${i + 1}. ID: ${fail.id} - ${fail.error} (${fail.address_used})`);
      });
    }
    
    // Uppdatera databasen om inte testläge
    if (!testMode && successful.length > 0) {
      await updatePreschoolCoordinates(successful);
      
      console.log('\n🎉 Geocoding och databasuppdatering klar!');
      console.log(`✨ ${successful.length} förskolor har nu koordinater!`);
    } else if (testMode) {
      console.log('\n🧪 TESTLÄGE: Inga ändringar gjordes i databasen');
      console.log('   Kör utan testMode för att faktiskt uppdatera koordinaterna');
    }
    
  } catch (error) {
    console.error('💥 Fel under geocoding:', error);
    throw error;
  }
}

// Huvudfunktion
async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '50');
  
  console.log('🗺️ GOOGLE GEOCODING FÖR SVENSKA FÖRSKOLOR');
  console.log('='.repeat(60));
  console.log(`🔑 API-nyckel: ${GOOGLE_API_KEY.substring(0, 20)}...`);
  console.log(`${testMode ? '🧪 Testläge aktiverat' : '🚀 Produktionsläge'}`);
  console.log(`📦 Batch-storlek: ${batchSize}`);
  console.log('');
  
  await geocodeMissingCoordinates(batchSize, testMode);
}

// Kör script
main().then(() => {
  console.log('\n✨ Script komplett!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script fel:', error);
  process.exit(1);
});