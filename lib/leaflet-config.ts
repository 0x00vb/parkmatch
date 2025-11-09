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

export const createGarageIcon = (type: "COVERED" | "UNCOVERED") => {
  if (typeof window === "undefined") return null;

  try {
    const L = require("leaflet");

    // Different color based on garage type
    const color = type === "COVERED" ? "blue" : "purple";

    // Create a custom icon with SVG data URL for garage markers
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        <rect x="8" y="16" width="8" height="6" fill="${color}" rx="1"/>
        <rect x="10" y="18" width="4" height="2" fill="white" rx="0.5"/>
      </svg>
    `;

    const dataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

    return new L.Icon({
      iconUrl: dataUrl,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
      shadowSize: [41, 41],
      className: `garage-marker garage-${type.toLowerCase()}`
    });
  } catch (error) {
    console.error("Error creating garage icon:", error);
    return null;
  }
};
