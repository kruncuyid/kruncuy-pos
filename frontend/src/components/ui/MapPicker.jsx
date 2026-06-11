import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPicker({ lat = -7.8018, lng = 110.3647, onCoordsChange, label = "Geser pin untuk atur lokasi outlet" }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const newLat = parseFloat(pos.lat.toFixed(6));
      const newLng = parseFloat(pos.lng.toFixed(6));
      if (onCoordsChange) onCoordsChange(newLat, newLng);
    });

    mapInstance.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when props change from outside
  useEffect(() => {
    if (markerRef.current && mapInstance.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]">
      <div ref={mapRef} style={{ height: 300, width: "100%", zIndex: 1 }} />
      {label ? (
        <div className="bg-[var(--color-surface-2)] px-4 py-2 text-xs text-[var(--color-muted)] text-center border-t border-[var(--color-border)]">
          {label}
        </div>
      ) : null}
    </div>
  );
}
