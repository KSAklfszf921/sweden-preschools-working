 # Swedish Preschool Map 🏫

En interaktiv karttjänst för att utforska förskolors i Sverige med 3D-visualisering och omfattande statistik.

## 🚀 Funktioner

- **3D Interaktiv Karta** - Utforska förskolor med Mapbox 3D-rendering
- **Omfattande Statistik** - Personaltäthet, lärarexamen, betyg och mer
- **Smart Filtrering** - Sök efter kommun, betyg, personalstatistik
- **Google Integration** - Betyg, bilder och kontaktinformation
- **Real-time Data** - Uppdaterad data från Skolverket

## 🛠️ Teknisk Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Karta**: Mapbox GL JS med 3D-terrain
- **Backend**: Supabase (databas + edge functions)
- **Deployment**: GitHub Actions → GitHub Pages / Netlify / Vercel

## 📦 Installation

### Lokalt Development

```bash
git clone https://github.com/your-username/swedish-preschool-map.git
cd swedish-preschool-map
npm install
npm run dev
```

### Environment Setup

Kopiera `.env.example` till `.env` och konfigurera:

```bash
cp .env.example .env
```

Fyll i dina Supabase-uppgifter i `.env`.

## 🚀 Deployment

### GitHub Pages (Automatisk)

1. Forka repot
2. Aktivera GitHub Pages i repo settings
3. Push till `main` branch - deployment sker automatiskt via GitHub Actions

### Netlify

1. Koppla ditt GitHub repo till Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel

1. Importera ditt GitHub repo till Vercel
2. Framework preset: Vite
3. Deployment sker automatiskt

## 🔐 API Keys & Secrets

För produktion behöver följande konfigureras i Supabase Edge Function Secrets:

- `MAPBOX_TOKEN` - Din Mapbox public token
- `GOOGLE_GEOCODING_API_KEY` - Google Maps Geocoding API
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Hämta API Keys

**Mapbox Token:**
1. Gå till [mapbox.com](https://mapbox.com)
2. Skapa konto och navigera till "Tokens"
3. Kopiera din "Default public token"

**Google Geocoding API:**
1. Gå till [Google Cloud Console](https://console.cloud.google.com)
2. Aktivera "Geocoding API"
3. Skapa API key under "Credentials"

## 📊 Datastruktur

Applikationen använder data från Skolverket och Google Places API:

### Förskolor (Huvudtabell)
- Skolverkets officiella data
- Geografiska koordinater
- Personalstatistik
- Barn- och gruppinformation

### Google Data (Berikad)
- Betyg och recensioner
- Kontaktinformation
- Bilder från Google Places
- Street View integration

## 🔧 Utveckling

### Viktiga Filer

- `src/components/Map3D.tsx` - Huvudkartkomponent
- `src/stores/mapStore.ts` - Global state management
- `supabase/functions/` - Backend edge functions
- `src/components/enhanced/` - Förbättrade UI-komponenter

### Kodstruktur

```
src/
├── components/          # React komponenter
├── stores/             # Zustand state management
├── utils/              # Hjälpfunktioner
├── hooks/              # Custom React hooks
└── integrations/       # Supabase integration

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations
```

## 🐛 Troubleshooting

### Vanliga Problem

**Kartan laddar inte:**
- Kontrollera Mapbox token i browser dev tools
- Verifiera att token har rätt scope

**Geocoding fungerar inte:**
- Kontrollera Google API key i Supabase secrets
- Verifiera att Geocoding API är aktiverat

**Build errors:**
- Kör `npm ci` för clean install
- Kontrollera Node.js version (rekommenderat: 18+)

### Debug Tools

```bash
# Visa console logs
npm run dev

# Build för produktion
npm run build

# Preview production build
npm run preview
```

## 📈 Performance

- **Lazy loading** för bilder och komponenter
- **Code splitting** för optimal bundle size
- **Caching** av API-anrop och statisk data
- **CDN** för assets via GitHub Pages/Netlify

## 🤝 Bidrag

1. Forka projektet
2. Skapa feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add amazing feature'`)
4. Push till branch (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🙏 Acknowledgments

- **Skolverket** för tillhandahållande av öppen förskoledata
- **Mapbox** för 3D-kartteknologi
- **Supabase** för backend-infrastruktur
- **Google Places API** för berikad data

---

Utvecklat med ❤️ för svenska föräldrar och förskolor.

*Deployment test - GitHub Actions fix*
