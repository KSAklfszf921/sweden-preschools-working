import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// @ts-ignore - MarkerCluster doesn't have perfect TypeScript definitions
import 'leaflet.markercluster';
import './leaflet-styles.css';

interface Preschool {
  id: string;
  namn: string;
  kommun: string;
  adress?: string;
  latitud: string | number;
  longitud: string | number;
  antal_barn?: string | number;
  huvudman: string;
  telefon?: string;
  hemsida?: string;
  betyg?: number;
}

interface LeafletMapProps {
  preschools: Preschool[];
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ preschools, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerClusterGroup = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize lightweight Leaflet map
    mapInstance.current = L.map(mapRef.current).setView([62.0, 15.0], 5);

    // Add free OpenStreetMap tiles (no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(mapInstance.current);

    // Create simple marker cluster group
    markerClusterGroup.current = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    mapInstance.current.addLayer(markerClusterGroup.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!markerClusterGroup.current || !preschools) return;

    // Clear existing markers
    markerClusterGroup.current.clearLayers();

    // Create lightweight markers
    preschools.forEach(preschool => {
      const lat = typeof preschool.latitud === 'string' 
        ? parseFloat(preschool.latitud) 
        : preschool.latitud;
      const lng = typeof preschool.longitud === 'string' 
        ? parseFloat(preschool.longitud) 
        : preschool.longitud;

      if (!isNaN(lat) && !isNaN(lng)) {
        const markerColor = preschool.huvudman === 'Kommunal' ? '#3498db' : '#f39c12';
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${markerColor};
            width: 12px; height: 12px; border-radius: 50%;
            border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        
        const popupContent = `
          <div class="leaflet-popup-content-custom">
            <div class="popup-header">${preschool.namn}</div>
            <div class="popup-info">
              <div><strong>Kommun:</strong> ${preschool.kommun}</div>
              ${preschool.adress ? `<div><strong>Adress:</strong> ${preschool.adress}</div>` : ''}
              <div><strong>Antal barn:</strong> ${preschool.antal_barn || 'Ej angivet'}</div>
              <div><strong>Huvudman:</strong> ${preschool.huvudman}</div>
              ${preschool.telefon ? `<div><strong>Telefon:</strong> ${preschool.telefon}</div>` : ''}
              ${preschool.hemsida ? `<div><strong>Hemsida:</strong> <a href="${preschool.hemsida}" target="_blank" rel="noopener">Besök</a></div>` : ''}
              ${preschool.betyg ? `<div><strong>Betyg:</strong> ${'⭐'.repeat(Math.round(preschool.betyg))}</div>` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });
        
        markerClusterGroup.current?.addLayer(marker);
      }
    });
  }, [preschools]);

  return (
    <div 
      ref={mapRef} 
      className={`leaflet-map-container ${className || ''}`}
      style={{ minHeight: '400px', width: '100%', height: '100%' }}
    />
  );
};