// Helper type for JSON response format
export interface JsonResponse<T> {
    $id?: string;
    $values?: T[];
}

export interface User {
    Id: number;
    Email: string;
    Name: string;
    Password: string;
    Reservations: JsonResponse<Reservation> | Reservation[];
    Payments: JsonResponse<Payment> | Payment[];
}

export interface Hotel {
    Id: number;
    Name: string;
    Address: string;
    City: string;
    State: string;
    Rooms: JsonResponse<Room> | Room[];
}

export interface Room {
    Id: number;
    HotelId: number;
    RoomType: string;
    Price: number;
    Name: string;
    Hotel?: Hotel;
    Reservations: JsonResponse<Reservation> | Reservation[];
}

export interface Reservation {
    Id: number;
    UserId: number;
    RoomId: number;
    CheckInDate: string;
    CheckOutDate: string;
    reservationStatus: ReservationStatus;
    User?: User;
    Room?: Room;
    Payments: JsonResponse<Payment> | Payment[];
}

export interface Payment {
    Id: number;
    ReservationId: number;
    UserId: number;
    Amount: number;
    PaymentDate: string;
    PaymentMethod: string;
    Reservation?: Reservation;
    User?: User;
}

export enum ReservationStatus {
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2,
    CheckedIn = 3,
    CheckedOut = 4
}

// Helper function to handle JSON response format
export function getArrayFromResponse<T>(response: JsonResponse<T> | T[]): T[] {
    if (Array.isArray(response)) {
        return response;
    }
    return response.$values || [];
} 