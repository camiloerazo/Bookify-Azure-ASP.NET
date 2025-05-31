import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Rooms.css';
import { Room, Reservation, ReservationStatus } from './types'; // Import Room, Reservation, and ReservationStatus types

interface ReservationForm {
    roomId: number;
    checkInDate: string;
    checkOutDate: string;
}

export default function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [allReservations, setAllReservations] = useState<Reservation[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [reservationForm, setReservationForm] = useState<ReservationForm>({
        roomId: 0,
        checkInDate: '',
        checkOutDate: ''
    });
    const navigate = useNavigate();
    const { user } = useAuth();

    // Function to check if a room has any active reservations
    const hasActiveReservation = (room: Room): boolean => {
        // Filter relevant reservations for this room
        const roomReservations = allReservations.filter(res => res.RoomId === room.Id);

        console.log(`Checking for active reservations for Room ${room.Id} (${room.Name}). Found ${roomReservations.length} total reservations.`);

        // Check for overlapping reservations
        for (const res of roomReservations) {
            console.log("Checking reservation:", res);
            // Ignore cancelled and checked out reservations
            if (res.ReservationStatus === ReservationStatus.Cancelled || res.ReservationStatus === ReservationStatus.CheckedOut) {
                console.log("Skipping cancelled/checked out reservation.");
                continue;
            }

            // If we find any reservation that is NOT cancelled or checked out, the room is considered unavailable
            console.log("Found active reservation. Room is NOT available.");
            return true; // Found an active reservation, room has active reservation
        }

        // No conflicts found, room is available
        console.log("No active reservations found for this room. Room is available.");
        return false; // No active reservations found, room is available
    };

    useEffect(() => {
        fetchRooms();
        fetchAllReservations();
    }, []);

    // Filter rooms whenever the rooms list, reservations, or filter dates change
    useEffect(() => {
        const currentlyFilteredRooms = rooms.filter(room =>
            !hasActiveReservation(room)
        );
        setFilteredRooms(currentlyFilteredRooms);
    }, [rooms, allReservations]);

    const fetchRooms = async () => {
        try {
            setIsLoading(true);
            setError(''); // Clear any previous errors
            console.log('Fetching rooms from:', 'https://localhost:7035/rooms');
            
            const response = await fetch('https://localhost:7035/rooms', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                throw new Error(errorData?.message || `Failed to fetch rooms: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received data:', data);
            
            // Handle reference-preserving JSON format
            const roomsArray = data.$values || data;
            if (!Array.isArray(roomsArray)) {
                console.error('Invalid data format:', data);
                throw new Error('Invalid data format received from server');
            }
            
            console.log('Setting rooms:', roomsArray);
            setRooms(roomsArray);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError(err instanceof Error ? err.message : 'Error loading rooms');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllReservations = async () => {
        try {
            const response = await fetch('https://localhost:7035/reservations', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error fetching reservations:', errorData);
                throw new Error(errorData?.message || `Failed to fetch reservations: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received reservations:', data);
            
            // Handle reference-preserving JSON format
            const reservationsArray = data.$values || data;
            if (!Array.isArray(reservationsArray)) {
                console.error('Invalid data format:', data);
                throw new Error('Invalid data format received from server');
            }
            
            console.log('Setting reservations:', reservationsArray);
            console.log("Fetched all reservations:", reservationsArray);
            setAllReservations(reservationsArray);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError(err instanceof Error ? err.message : 'Error loading reservations');
        }
    };

    const handleReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in to make a reservation');
            navigate('/login');
            return;
        }

        // Log user data to verify what we have
        console.log('Current user data:', user);

        try {
            setIsLoading(true);
            setError(''); // Clear any previous errors

            if (!user.Id || !user.Email || !user.Name) {
                throw new Error('User data is incomplete. Please log out and log in again.');
            }

            // Format dates as ISO strings and ensure all required fields
            const requestData = {
                UserId: user.Id,
                RoomId: reservationForm.roomId,
                CheckInDate: new Date(reservationForm.checkInDate).toISOString(),
                CheckOutDate: new Date(reservationForm.checkOutDate).toISOString()
            };

            console.log('Sending reservation data:', requestData);

            const response = await fetch('https://localhost:7035/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const responseData = await response.json().catch(() => null);
            console.log('Full server response:', response.status, responseData);

            if (!response.ok) {
                // Handle validation errors
                if (responseData?.errors) {
                    const validationErrors = Object.entries(responseData.errors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    throw new Error(`Validation errors:\n${validationErrors}`);
                }
                // Handle other error messages
                throw new Error(responseData?.message || responseData?.title || `Failed to create reservation: ${response.status}`);
            }

            alert('Reservation created successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error creating reservation:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error creating reservation';
            setError(errorMessage);
            alert(errorMessage); // Show error to user
        } finally {
            setIsLoading(false);
        }
    };

    const openReservationModal = (room: Room) => {
        setSelectedRoom(room);
        setReservationForm({
            roomId: room.Id,
            checkInDate: '',
            checkOutDate: ''
        });
    };

    const closeReservationModal = () => {
        setSelectedRoom(null);
        setReservationForm({
            roomId: 0,
            checkInDate: '',
            checkOutDate: ''
        });
    };

    return (
        <div className="rooms-page">
            <header className="rooms-header">
                <h1>Available Rooms</h1>
                <p>Find and book your perfect stay</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            {isLoading ? (
                <div className="loading">Loading rooms...</div>
            ) : (
                <div className="rooms-grid">
                    {filteredRooms.map(room => (
                        <div key={room.Id} className="room-card">
                            <div className="room-header">
                                <h3>{room.Name}</h3>
                                <span className="room-type">{room.RoomType}</span>
                            </div>
                            <div className="room-details">
                                <p className="hotel-name">{room.Hotel?.Name}</p>
                                <p className="hotel-location">
                                    {room.Hotel?.Address}, {room.Hotel?.City}, {room.Hotel?.State}
                                </p>
                                <p className="room-price">${room.Price} per night</p>
                            </div>
                            <button
                                className="action-button primary"
                                onClick={() => openReservationModal(room)}
                            >
                                Book Now
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Reservation Modal */}
            {selectedRoom && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Book {selectedRoom.Name}</h2>
                        <form onSubmit={handleReservation}>
                            <div className="form-group">
                                <label>Check-in Date</label>
                                <input
                                    type="date"
                                    value={reservationForm.checkInDate}
                                    onChange={(e) => setReservationForm({
                                        ...reservationForm,
                                        checkInDate: e.target.value
                                    })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Check-out Date</label>
                                <input
                                    type="date"
                                    value={reservationForm.checkOutDate}
                                    onChange={(e) => setReservationForm({
                                        ...reservationForm,
                                        checkOutDate: e.target.value
                                    })}
                                    min={reservationForm.checkInDate || new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="action-button primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating Reservation...' : 'Confirm Booking'}
                                </button>
                                <button
                                    type="button"
                                    className="action-button secondary"
                                    onClick={closeReservationModal}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 