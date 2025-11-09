export interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  garage: {
    id: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    hourlyPrice?: number;
    dailyPrice?: number;
    monthlyPrice?: number;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
    };
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    year?: number;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
  };
}
