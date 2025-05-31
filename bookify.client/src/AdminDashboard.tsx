import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './AdminDashboard.css';

interface Hotel {
    Id: number;
    Name: string;
    Address: string;
    City: string;
    State: string;
}

interface Room {
    Id: number;
    HotelId: number;
    RoomType: string;
    Price: number;
    Name: string;
    Hotel?: Hotel;
}

interface User {
    Id: number;
    Email: string;
    Name: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('hotels');
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Form states
    const [newHotel, setNewHotel] = useState({ Name: '', Address: '', City: '', State: '' });
    const [newRoom, setNewRoom] = useState({ HotelId: '', RoomType: '', Price: '', Name: '' });
    const [newUser, setNewUser] = useState({ Email: '', Name: '', Password: '' });

    // Edit states
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchHotels();
        fetchRooms();
        fetchUsers();
    }, []);

    const fetchHotels = async () => {
        try {
            console.log('Fetching hotels...');
            const response = await fetch('https://localhost:7035/hotels');
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, errorData);
                throw new Error(errorData?.message || `Failed to fetch hotels: ${response.status}`);
            }
            const data = await response.json();
            console.log('Hotels data received:', data);
            // Handle the reference-preserving JSON format
            const hotelsArray = data.$values || data;
            if (!Array.isArray(hotelsArray)) {
                console.error('Received non-array data:', data);
                throw new Error('Invalid data format received from server');
            }
            setHotels(hotelsArray);
        } catch (err) {
            console.error('Error fetching hotels:', err);
            setError(err instanceof Error ? err.message : 'Error loading hotels');
        }
    };

    const fetchRooms = async () => {
        try {
            console.log('Fetching rooms...');
            const response = await fetch('https://localhost:7035/rooms');
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, errorData);
                throw new Error(errorData?.message || `Failed to fetch rooms: ${response.status}`);
            }
            const data = await response.json();
            console.log('Rooms data received:', data);
            // Handle the reference-preserving JSON format
            const roomsArray = data.$values || data;
            if (!Array.isArray(roomsArray)) {
                console.error('Received non-array data:', data);
                throw new Error('Invalid data format received from server');
            }
            setRooms(roomsArray);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError(err instanceof Error ? err.message : 'Error loading rooms');
        }
    };

    const fetchUsers = async () => {
        try {
            console.log('Fetching users...');
            const response = await fetch('https://localhost:7035/users');
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, errorData);
                throw new Error(errorData?.message || `Failed to fetch users: ${response.status}`);
            }
            const data = await response.json();
            console.log('Users data received:', data);
            // Handle the reference-preserving JSON format
            const usersArray = data.$values || data;
            if (!Array.isArray(usersArray)) {
                console.error('Received non-array data:', data);
                throw new Error('Invalid data format received from server');
            }
            setUsers(usersArray);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err instanceof Error ? err.message : 'Error loading users');
        }
    };

    // Hotel Operations
    const handleCreateHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            console.log('Sending hotel data:', newHotel); // Log the data we're sending
            const response = await fetch('https://localhost:7035/hotels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHotel)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, errorData); // Log the error response
                throw new Error(errorData?.message || `Failed to create hotel: ${response.status}`);
            }
            
            await fetchHotels();
            setNewHotel({ Name: '', Address: '', City: '', State: '' });
        } catch (err) {
            console.error('Error creating hotel:', err); // Log the full error
            setError(err instanceof Error ? err.message : 'Error creating hotel');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHotel) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/hotels/${editingHotel.Id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingHotel)
            });
            if (!response.ok) throw new Error('Failed to update hotel');
            await fetchHotels();
            setEditingHotel(null);
        } catch (err) {
            setError('Error updating hotel');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHotel = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este hotel? Esto también eliminará todas las habitaciones asociadas.')) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/hotels/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete hotel');
            await fetchHotels();
            await fetchRooms(); // Refresh rooms as some might have been deleted
        } catch (err) {
            setError('Error deleting hotel');
        } finally {
            setIsLoading(false);
        }
    };

    // Room Operations
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const roomData = {
                ...newRoom,
                hotelId: parseInt(newRoom.HotelId),
                price: parseFloat(newRoom.Price)
            };
            console.log('Sending room data:', roomData);
            
            const response = await fetch('https://localhost:7035/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, errorData);
                
                // Handle validation errors
                if (errorData?.errors) {
                    const validationErrors = Object.entries(errorData.errors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    throw new Error(`Validation errors:\n${validationErrors}`);
                }
                
                throw new Error(errorData?.message || `Failed to create room: ${response.status}`);
            }
            
            await fetchRooms();
            setNewRoom({ HotelId: '', RoomType: '', Price: '', Name: '' });
        } catch (err) {
            console.error('Error creating room:', err);
            setError(err instanceof Error ? err.message : 'Error creating room');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoom) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/rooms/${editingRoom.Id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingRoom)
            });
            if (!response.ok) throw new Error('Failed to update room');
            await fetchRooms();
            setEditingRoom(null);
        } catch (err) {
            setError('Error updating room');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRoom = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta habitación?')) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/rooms/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete room');
            }
            await fetchRooms();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting room');
        } finally {
            setIsLoading(false);
        }
    };

    // User Operations
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('https://localhost:7035/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) throw new Error('Failed to create user');
            await fetchUsers();
            setNewUser({ Email: '', Name: '', Password: '' });
        } catch (err) {
            setError('Error creating user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/users/${editingUser.Id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            if (!response.ok) throw new Error('Failed to update user');
            await fetchUsers();
            setEditingUser(null);
        } catch (err) {
            setError('Error updating user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`https://localhost:7035/users/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete user');
            await fetchUsers();
        } catch (err) {
            setError('Error deleting user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="logo">
                    <h2>Bookify Administrador</h2>
                </div>
                <nav className="nav-menu">
                    <button 
                        className={`nav-item ${activeTab === 'hotels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hotels')}
                    >
                        Hoteles
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rooms')}
                    >
                        Habitaciones
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Usuarios
                    </button>
                    <button 
                        className="nav-item logout-button"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>Panel de Administrador</h1>
                    <div className="admin-actions">
                        <span className="admin-user">Bienvenido, {user?.Name}</span>
                    </div>
                </header>

                <div className="admin-content">
                    {error && <div className="error-message">{error}</div>}

                    {/* Hotels Section */}
                    {activeTab === 'hotels' && (
                        <div className="admin-section">
                            <h2>Gestionar hoteles</h2>
                            <div className="admin-grid">
                                <div className="admin-form-card">
                                    <h3>{editingHotel ? 'Editar hotel' : 'Agregar nuevo hotel'}</h3>
                                    <form onSubmit={editingHotel ? handleUpdateHotel : handleCreateHotel}>
                                        <div className="form-group">
                                            <label>Nombre del hotel</label>
                                            <input
                                                type="text"
                                                value={editingHotel ? editingHotel.Name : newHotel.Name}
                                                onChange={(e) => editingHotel 
                                                    ? setEditingHotel({...editingHotel, Name: e.target.value})
                                                    : setNewHotel({...newHotel, Name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Dirección</label>
                                            <input
                                                type="text"
                                                value={editingHotel ? editingHotel.Address : newHotel.Address}
                                                onChange={(e) => editingHotel
                                                    ? setEditingHotel({...editingHotel, Address: e.target.value})
                                                    : setNewHotel({...newHotel, Address: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Ciudad</label>
                                            <input
                                                type="text"
                                                value={editingHotel ? editingHotel.City : newHotel.City}
                                                onChange={(e) => editingHotel
                                                    ? setEditingHotel({...editingHotel, City: e.target.value})
                                                    : setNewHotel({...newHotel, City: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Estado</label>
                                            <input
                                                type="text"
                                                value={editingHotel ? editingHotel.State : newHotel.State}
                                                onChange={(e) => editingHotel
                                                    ? setEditingHotel({...editingHotel, State: e.target.value})
                                                    : setNewHotel({...newHotel, State: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button type="submit" className="action-button primary" disabled={isLoading}>
                                                {isLoading ? 'Guardando...' : editingHotel ? 'Actualizar hotel' : 'Crear hotel'}
                                            </button>
                                            {editingHotel && (
                                                <button 
                                                    type="button" 
                                                    className="action-button secondary"
                                                    onClick={() => setEditingHotel(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                <div className="admin-list-card">
                                    <h3>Hoteles existentes</h3>
                                    <div className="admin-list">
                                        {hotels.map(hotel => (
                                            <div key={hotel.Id} className="admin-list-item">
                                                <div className="item-details">
                                                    <h4>{hotel.Name}</h4>
                                                    <p>{hotel.Address}, {hotel.City}, {hotel.State}</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button 
                                                        className="action-button secondary"
                                                        onClick={() => setEditingHotel(hotel)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        className="action-button danger"
                                                        onClick={() => handleDeleteHotel(hotel.Id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rooms Section */}
                    {activeTab === 'rooms' && (
                        <div className="admin-section">
                            <h2>Gestionar habitaciones</h2>
                            <div className="admin-grid">
                                <div className="admin-form-card">
                                    <h3>{editingRoom ? 'Editar habitación' : 'Agregar nueva habitación'}</h3>
                                    <form onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}>
                                        <div className="form-group">
                                            <label>Hotel</label>
                                            <select
                                                value={editingRoom ? editingRoom.HotelId : newRoom.HotelId}
                                                onChange={(e) => editingRoom
                                                    ? setEditingRoom({...editingRoom, HotelId: parseInt(e.target.value)})
                                                    : setNewRoom({...newRoom, HotelId: e.target.value})}
                                                required
                                            >
                                                <option value="">Seleccione un hotel</option>
                                                {hotels.map(hotel => (
                                                    <option key={hotel.Id} value={hotel.Id}>
                                                        {hotel.Name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo de habitación</label>
                                            <input
                                                type="text"
                                                value={editingRoom ? editingRoom.RoomType : newRoom.RoomType}
                                                onChange={(e) => editingRoom
                                                    ? setEditingRoom({...editingRoom, RoomType: e.target.value})
                                                    : setNewRoom({...newRoom, RoomType: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nombre de la habitación</label>
                                            <input
                                                type="text"
                                                value={editingRoom ? editingRoom.Name : newRoom.Name}
                                                onChange={(e) => editingRoom
                                                    ? setEditingRoom({...editingRoom, Name: e.target.value})
                                                    : setNewRoom({...newRoom, Name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Precio por noche</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editingRoom ? editingRoom.Price : newRoom.Price}
                                                onChange={(e) => editingRoom
                                                    ? setEditingRoom({...editingRoom, Price: parseFloat(e.target.value)})
                                                    : setNewRoom({...newRoom, Price: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button type="submit" className="action-button primary" disabled={isLoading}>
                                                {isLoading ? 'Guardando...' : editingRoom ? 'Actualizar habitación' : 'Crear habitación'}
                                            </button>
                                            {editingRoom && (
                                                <button 
                                                    type="button" 
                                                    className="action-button secondary"
                                                    onClick={() => setEditingRoom(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                <div className="admin-list-card">
                                    <h3>Habitaciones existentes</h3>
                                    <div className="admin-list">
                                        {rooms.map(room => (
                                            <div key={room.Id} className="admin-list-item">
                                                <div className="item-details">
                                                    <h4>{room.Name}</h4>
                                                    <p>{room.RoomType} - ${room.Price}/night</p>
                                                    <p>Hotel: {room.Hotel?.Name || hotels.find(h => h.Id === room.HotelId)?.Name}</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button 
                                                        className="action-button secondary"
                                                        onClick={() => setEditingRoom(room)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        className="action-button danger"
                                                        onClick={() => handleDeleteRoom(room.Id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Section */}
                    {activeTab === 'users' && (
                        <div className="admin-section">
                            <h2>Gestionar usuarios</h2>
                            <div className="admin-grid">
                                <div className="admin-form-card">
                                    <h3>{editingUser ? 'Editar usuario' : 'Agregar nuevo usuario'}</h3>
                                    <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                                        <div className="form-group">
                                            <label>Nombre</label>
                                            <input
                                                type="text"
                                                value={editingUser ? editingUser.Name : newUser.Name}
                                                onChange={(e) => editingUser
                                                    ? setEditingUser({...editingUser, Name: e.target.value})
                                                    : setNewUser({...newUser, Name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Correo electrónico</label>
                                            <input
                                                type="email"
                                                value={editingUser ? editingUser.Email : newUser.Email}
                                                onChange={(e) => editingUser
                                                    ? setEditingUser({...editingUser, Email: e.target.value})
                                                    : setNewUser({...newUser, Email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Contraseña</label>
                                            <input
                                                type="password"
                                                value={newUser.Password}
                                                onChange={(e) => setNewUser({...newUser, Password: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button type="submit" className="action-button primary" disabled={isLoading}>
                                                {isLoading ? 'Guardando...' : editingUser ? 'Actualizar usuario' : 'Crear usuario'}
                                            </button>
                                            {editingUser && (
                                                <button 
                                                    type="button" 
                                                    className="action-button secondary"
                                                    onClick={() => setEditingUser(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                <div className="admin-list-card">
                                    <h3>Usuarios existentes</h3>
                                    <div className="admin-list">
                                        {users.map(user => (
                                            <div key={user.Id} className="admin-list-item">
                                                <div className="item-details">
                                                    <h4>{user.Name}</h4>
                                                    <p>{user.Email}</p>
                                                </div>
                                                <div className="item-actions">
                                                    <button 
                                                        className="action-button secondary"
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        className="action-button danger"
                                                        onClick={() => handleDeleteUser(user.Id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 