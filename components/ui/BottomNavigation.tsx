"use client";

import { useSession } from "next-auth/react";
import { useOwnerStats } from "@/lib/hooks/useOwnerStats";
import { 
  HomeIcon, 
  TruckIcon, 
  CalendarIcon, 
  BuildingStorefrontIcon, 
  UserIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid, 
  TruckIcon as TruckIconSolid, 
  CalendarIcon as CalendarIconSolid, 
  BuildingStorefrontIcon as BuildingStorefrontIconSolid, 
  UserIcon as UserIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from "@heroicons/react/24/solid";

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const { data: session } = useSession();
  const { stats } = useOwnerStats();
  
  if (!session) return null;

  const isDriverAndOwner = session.user.role === "CONDUCTOR_PROPIETARIO";

  // Navigation items for Driver only (CONDUCTOR)
  const driverNavItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      id: "vehiculos",
      label: "Vehículos",
      icon: TruckIcon,
      iconSolid: TruckIconSolid,
    },
    {
      id: "reservas",
      label: "Reservas",
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
  ];

  // Navigation items for Driver and Owner (CONDUCTOR_PROPIETARIO)
  const driverOwnerNavItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      id: "vehiculos",
      label: "Vehículos",
      icon: TruckIcon,
      iconSolid: TruckIconSolid,
    },
    {
      id: "reservas",
      label: "Reservas",
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
    {
      id: "solicitudes",
      label: "Solicitudes",
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
    },
    {
      id: "garages",
      label: "Garages",
      icon: BuildingStorefrontIcon,
      iconSolid: BuildingStorefrontIconSolid,
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
  ];

  const navItems = isDriverAndOwner ? driverOwnerNavItems : driverNavItems;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
        <div className="mx-auto max-w-sm">
          <div className="flex justify-around items-center py-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = isActive ? item.iconSolid : item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 relative ${
                    isActive ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6 mb-1" />
                    {/* Show badge for pending reservations on solicitudes tab */}
                    {item.id === "solicitudes" && stats.pending > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {stats.pending > 99 ? '99+' : stats.pending}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex md:flex-col md:flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative ${
                  isActive 
                    ? "bg-green-50 text-green-600 border border-green-200" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {/* Show badge for pending reservations on solicitudes tab */}
                  {item.id === "solicitudes" && stats.pending > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                      {stats.pending > 99 ? '99+' : stats.pending}
                    </div>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
