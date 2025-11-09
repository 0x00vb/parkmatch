"use client";

import { useState, useEffect } from "react";

export default function MapTest() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("MapTest: Component mounted");
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>MapTest: Loading...</div>;
  }

  return (
    <div style={{ width: '100%', height: '400px', backgroundColor: 'lightblue' }}>
      <h3>MapTest Component</h3>
      <p>If you see this, the component is working but the map might not be loading.</p>
      <p>Check browser console for more details.</p>
    </div>
  );
}
