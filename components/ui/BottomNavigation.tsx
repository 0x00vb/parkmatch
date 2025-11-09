"use client";

import { useSession } from "next-auth/react";
import { 
  HomeIcon, 
  TruckIcon, 
  CalendarIcon, 
  BuildingStorefrontIcon, 
  UserIcon 
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid, 
  TruckIcon as TruckIconSolid, 
  CalendarIcon as CalendarIconSolid, 
  BuildingStorefrontIcon as BuildingStorefrontIconSolid, 
  UserIcon as UserIconSolid 
} from "@heroicons/react/24/solid";

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const { data: session } = useSession();
  
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
      id: "garages",
      label: "Mis Garages",
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="mx-auto max-w-sm">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 ${
                  isActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
