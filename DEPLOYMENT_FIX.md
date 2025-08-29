## 🚨 KRITISKT: API-nycklar saknas för GitHub deployment!

### Problem
Din Google API-nyckel är inte korrekt konfigurerad i Supabase Edge Function secrets, vilket gör att geocoding-servicen failar.

### 📋 Lösning - Steg för steg:

#### 1. Lägg till Google API-nyckel 🔑
1. Gå till [Google Cloud Console](https://console.cloud.google.com)
2. Aktivera "Geocoding API" 
3. Skapa API-nyckel under "Credentials"
4. Kopiera nyckeln

#### 2. Konfigurera i Supabase 🛠️
1. Gå till [Supabase Edge Functions Secrets](https://supabase.com/dashboard/project/zfeqsdtddvelapbrwlol/settings/functions)
2. Lägg till dessa secrets:
   - **GOOGLE_GEOCODING_API_KEY**: [Din Google API-nyckel]
   - **MAPBOX_TOKEN**: [Din Mapbox public token] 
   - **SUPABASE_SERVICE_ROLE_KEY**: [Finns i Supabase Settings → API]

#### 3. Verifiera att det fungerar ✅
Efter att du lagt till secrets:
- Testa geocoding-funktionen igen
- Kontrollera att Edge Function logs visar "✅ Present" för alla nycklar

#### 4. GitHub Deployment klarar! 🚀
När alla secrets är konfigurerade:
- Push till GitHub - automatisk deployment aktiverad
- Applikationen fungerar i produktion med säkra API-nycklar

### 🔍 Debug
Om det fortfarande inte fungerar:
- Kontrollera Edge Function logs i Supabase
- Verifiera att Google API har rätt quota/billing aktiverat

---

**Nästa steg**: Lägg till API-nycklarna enligt instruktionerna ovan!