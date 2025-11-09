// Reservation Flow Components
export { default as ReservationForm } from './ReservationForm';
export { default as ReservationPending } from './ReservationPending';
export { default as ReservationConfirmed } from './ReservationConfirmed';
export { default as ActiveReservationModal } from './ActiveReservationModal';

// Types
export interface ReservationFlowProps {
  garage: {
    id: string;
    address: string;
    city: string;
    type: "COVERED" | "UNCOVERED";
    height: number;
    width: number;
    length: number;
    hourlyPrice?: number;
    user: {
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
    };
  };
}

export interface ReservationData {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  garage: ReservationFlowProps['garage'] & {
    latitude: number;
    longitude: number;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}
