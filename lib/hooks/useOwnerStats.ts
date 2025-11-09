import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface OwnerStats {
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
}

export function useOwnerStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<OwnerStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (session?.user?.role === "CONDUCTOR_PROPIETARIO") {
          const response = await fetch('/api/owner/reservations?limit=1');
          if (response.ok) {
            const data = await response.json();
            setStats(data.stats || {
              total: 0,
              pending: 0,
              confirmed: 0,
              active: 0,
              completed: 0,
              cancelled: 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching owner stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Poll for updates every 60 seconds (less frequent than the main component)
    const interval = setInterval(fetchStats, 60000);

    return () => clearInterval(interval);
  }, [session]);

  return { stats, isLoading };
}
