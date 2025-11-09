// Leaflet configuration - Client-side only
export const configureLeaflet = () => {
  if (typeof window === "undefined") return;

  try {
    // Import leaflet dynamically to avoid SSR issues
    const L = require("leaflet");

    // Fix for default markers in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    console.log("Leaflet configured successfully");
    return L;
  } catch (error) {
    console.error("Error configuring Leaflet:", error);
    return null;
  }
};

export const createParkingIcon = (color: string) => {
  if (typeof window === "undefined") return null;

  try {
    const L = require("leaflet");

    // Use default marker for now to avoid external URL issues
    return new L.Icon({
      iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png`,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: `marker-${color}` // Add custom class for styling
    });
  } catch (error) {
    console.error("Error creating parking icon:", error);
    return null;
  }
};
