import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User, Reservation, ReservationStatus, getArrayFromResponse } from './types';
import PayPalButton from './components/PayPalButton';
import './Dashboard.css';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, setUser, logout } = useAuth();

    // Function to fetch updated user data
    const fetchUserData = async () => {
        if (!user?.Id) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`https://localhost:7035/users/${user.Id}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener datos del usuario');
            }

            const userData = await response.json() as User;
            // Update user data in context
            setUser({
                ...userData,
                Payments: getArrayFromResponse(userData.Payments),
                Reservations: getArrayFromResponse(userData.Reservations)
            });
            console.log("User data received from API:", userData);
            console.log("Processed user data in context:", { ...userData, Payments: getArrayFromResponse(userData.Payments), Reservations: getArrayFromResponse(userData.Reservations) });
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err.message : 'Error al actualizar datos del usuario');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch user data on component mount and when activeTab changes
    useEffect(() => {
        console.log("Fetching user data...");
        console.log("User object before fetch:", user);
        fetchUserData();
    }, [activeTab]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleNavigateToRooms = () => {
        navigate('/rooms');
    };

    const handleCancelReservation = async (reservationId: number) => {
        if (!confirm('¿Está seguro de que desea cancelar esta reserva?')) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`https://localhost:7035/reservations/${reservationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ReservationStatus.Cancelled)
            });

            if (!response.ok) {
                throw new Error('Error al cancelar la reserva');
            }

            // Refresh user data to update the reservations list
            await fetchUserData();
            alert('Reserva cancelada exitosamente');
        } catch (err) {
            console.error('Error cancelling reservation:', err);
            alert(err instanceof Error ? err.message : 'Error al cancelar la reserva');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async (reservationId: number) => {
        try {
            const response = await fetch(`https://localhost:7035/reservations/${reservationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ReservationStatus.CheckedIn)
            });

            if (!response.ok) {
                throw new Error('El registro de entrada falló. Por favor, intente de nuevo.');
            }

            await fetchUserData();
            alert('¡Registro de entrada exitoso! Bienvenido a su estancia.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'El registro de entrada falló. Por favor, intente de nuevo.');
        }
    };

    const handleCheckOut = async (reservationId: number) => {
        try {
            const response = await fetch(`https://localhost:7035/reservations/${reservationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ReservationStatus.CheckedOut)
            });

            if (!response.ok) {
                throw new Error('El registro de salida falló. Por favor, intente de nuevo.');
            }

            await fetchUserData();
            alert('¡Registro de salida exitoso! Gracias por hospedarse con nosotros.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'El registro de salida falló. Por favor, intente de nuevo.');
        }
    };

    // Update the handlePayment function
    const handlePaymentSuccess = async (reservationId: number) => {
        try {
            setIsLoading(true);
            // Here you would typically update the reservation status or create a payment record
            await fetchUserData();
            alert('¡Pago exitoso! Gracias por su pago.');
        } catch (error) {
            console.error('Error processing payment:', error);
            alert(error instanceof Error ? error.message : 'Error al procesar el pago');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment error:', error);
        alert(`Pago fallido: ${error}`);
    };

    const reservations = getArrayFromResponse(user?.Reservations || []);
    const payments = getArrayFromResponse(user?.Payments || []);

    // Find the first pending reservation for the overview tab
    const firstPendingReservation = reservations.find(r => r.reservationStatus === ReservationStatus.Pending);

    console.log("Final reservations array:", reservations);
    console.log("Final payments array:", payments);
    console.log("First pending reservation for overview:", firstPendingReservation);

    // Effect to scroll to PayPal payment card when Overview is active
    useEffect(() => {
        if (activeTab === 'overview' && firstPendingReservation) {
            const paymentCard = document.getElementById('paypal-payment-card');
            if (paymentCard) {
                paymentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [activeTab, firstPendingReservation]);

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <h2>Bookify</h2>
                </div>
                <nav className="nav-menu">
                    <button 
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Resumen
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'checkinout' ? 'active' : ''}`}
                        onClick={() => setActiveTab('checkinout')}
                    >
                        Registro de entrada/salida
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reservations')}
                    >
                        Mis reservas
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Perfil
                    </button>

                    {/* Pay Now button - visible only if there's a pending reservation */}
                    {firstPendingReservation && (
                        <button 
                            className="nav-item pay-now-button"
                            onClick={() => setActiveTab('overview')}
                        >
                            Pagar ahora
                        </button>
                    )}

                    <button 
                        className="nav-item logout-button"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="header">
                    <h1>Bienvenido, {user?.Name}</h1>
                    <div className="quick-actions">
                        <button 
                            className="action-button primary"
                            onClick={() => navigate('/rooms')}
                        >
                            Encontrar habitaciones disponibles
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="dashboard-content">
                    {error && <div className="error-message">{error}</div>}
                    
                    {isLoading && <div className="loading">Cargando...</div>}

                    {activeTab === 'overview' && (
                        <div className="overview-section">
                            <div className="card">
                                <h3>Reservas activas</h3>
                                <p className="number">{reservations.filter(r => r.reservationStatus !== ReservationStatus.Cancelled && r.reservationStatus !== ReservationStatus.CheckedOut).length}</p>
                                <p className="subtitle">Reservas actuales</p>
                            </div>
                            <div className="card">
                                <h3>Pagos totales</h3>
                                <p className="number">
                                    ${payments.reduce((sum: number, payment) => sum + (payment.Amount || 0), 0)}
                                </p>
                                <p className="subtitle">Gasto a lo largo de la vida</p>
                            </div>
                            <div className="card">
                                <h3>Entradas programadas</h3>
                                <p className="number">
                                    {reservations.filter((r: Reservation) => 
                                        new Date(r.CheckInDate) > new Date()
                                    ).length}
                                </p>
                                <p className="subtitle">Próximos 30 días</p>
                            </div>

                            {/* PayPal Payment Section in Overview */}
                            {firstPendingReservation && (
                                <div className="card" id="paypal-payment-card">
                                    <h3>Completar pago</h3>
                                    <p>Tiene una reserva pendiente ({firstPendingReservation.Room?.Name}) que requiere pago de ${firstPendingReservation.Room?.Price || 0}.</p>
                                    <PayPalButton
                                        amount={firstPendingReservation.Room?.Price || 0}
                                        reservationId={firstPendingReservation.Id}
                                        onSuccess={() => handlePaymentSuccess(firstPendingReservation.Id)}
                                        onError={handlePaymentError}
                                    />
                                </div>
                            )}

                        </div>
                    )}

                    {activeTab === 'checkinout' && (
                        <div className="checkinout-section">
                            <div className="checkinout-container">
                                <div className="checkinout-card">
                                    <h2>Registro de entrada</h2>
                                    {reservations.length > 0 ? (
                                        <div className="reservation-list">
                                            {reservations
                                                .filter(reservation => {
                                                    console.log("Check In filter - reservation:", reservation);
                                                    return reservation.reservationStatus === ReservationStatus.Pending || 
                                                           reservation.reservationStatus === ReservationStatus.Confirmed;
                                                })
                                                .map((reservation, index) => (
                                                    <div key={index} className="reservation-card">
                                                        <div className="reservation-header">
                                                            <h3>Reserva #{reservation.Id}</h3>
                                                            <span className={`status ${ReservationStatus[reservation.reservationStatus]?.toLowerCase()}`}>
                                                                {ReservationStatus[reservation.reservationStatus]}
                                                            </span>
                                                        </div>
                                                        <div className="reservation-details">
                                                            <div className="detail-item">
                                                                <label>Entrada:</label>
                                                                <span>{new Date(reservation.CheckInDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <label>Salida:</label>
                                                                <span>{new Date(reservation.CheckOutDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <label>Habitación:</label>
                                                                <span>{reservation.Room?.Name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="reservation-actions">
                                                            <button 
                                                                className="action-button primary"
                                                                onClick={() => handleCheckIn(reservation.Id)}
                                                            >
                                                                Registrar entrada
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {reservations.filter(r => 
                                                r.reservationStatus === ReservationStatus.Confirmed
                                            ).length === 0 && (
                                                <div className="no-reservations">
                                                    <p>No hay reservas listas para registrar entrada en este momento.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="no-reservations">
                                            <p>No tiene ninguna reserva activa.</p>
                                            <button 
                                                className="action-button primary"
                                                onClick={handleNavigateToRooms}
                                            >
                                                Reservar una habitación
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="checkinout-card">
                                    <h2>Registro de salida</h2>
                                    {reservations.length > 0 ? (
                                        <div className="reservation-list">
                                            {reservations
                                                .filter(reservation => {
                                                    console.log("Check Out filter - reservation:", reservation);
                                                    return reservation.reservationStatus === ReservationStatus.CheckedIn;
                                                })
                                                .map((reservation, index) => (
                                                    <div key={index} className="reservation-card">
                                                        <div className="reservation-header">
                                                            <h3>Reserva #{reservation.Id}</h3>
                                                            <span className={`status ${ReservationStatus[reservation.reservationStatus]?.toLowerCase()}`}>
                                                                {ReservationStatus[reservation.reservationStatus]}
                                                            </span>
                                                        </div>
                                                        <div className="reservation-details">
                                                            <div className="detail-item">
                                                                <label>Entrada:</label>
                                                                <span>{new Date(reservation.CheckInDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <label>Salida:</label>
                                                                <span>{new Date(reservation.CheckOutDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <label>Habitación:</label>
                                                                <span>{reservation.Room?.Name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="reservation-actions">
                                                            <button 
                                                                className="action-button primary"
                                                                onClick={() => handleCheckOut(reservation.Id)}
                                                            >
                                                                Registrar salida
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {reservations.filter(r => 
                                                r.reservationStatus === ReservationStatus.CheckedIn
                                            ).length === 0 && (
                                                <div className="no-reservations">
                                                    <p>No hay entradas activas para registrar salida en este momento.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="no-reservations">
                                            <p>No tiene ninguna entrada activa.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reservations' && (
                        <div className="reservations-section">
                            <h2>Mis reservas</h2>
                            {reservations.length > 0 ? (
                                <div className="reservation-list">
                                    {reservations.map((reservation: Reservation) => (
                                        <div key={reservation.Id} className="reservation-card">
                                            <div className="reservation-header">
                                                <h3>Reserva #{reservation.Id}</h3>
                                                <span className={`status ${ReservationStatus[reservation.reservationStatus]?.toLowerCase()}`}>
                                                    {ReservationStatus[reservation.reservationStatus]}
                                                </span>
                                            </div>
                                            <div className="reservation-details">
                                                <div className="detail-item">
                                                    <label>Entrada:</label>
                                                    <span>{new Date(reservation.CheckInDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Salida:</label>
                                                    <span>{new Date(reservation.CheckOutDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Habitación:</label>
                                                    <span>{reservation.Room?.Name || 'Cargando...'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label>Hotel:</label>
                                                    <span>{reservation.Room?.Hotel?.Name || 'Cargando...'}</span>
                                                </div>
                                            </div>
                                            {reservation.reservationStatus === ReservationStatus.Pending && (
                                                <div className="reservation-actions">
                                                    <button 
                                                        className="action-button secondary"
                                                        onClick={() => handleCancelReservation(reservation.Id)}
                                                        disabled={isLoading}
                                                    >
                                                        Cancelar reserva
                                                    </button>
                                                </div>
                                            )}
                                            {reservation.reservationStatus === ReservationStatus.Confirmed && (
                                                <div className="reservation-actions">
                                                    <button 
                                                        className="action-button primary"
                                                        onClick={() => handleCheckIn(reservation.Id)}
                                                        disabled={isLoading}
                                                    >
                                                        Registrar entrada
                                                    </button>
                                                </div>
                                            )}
                                            {reservation.reservationStatus === ReservationStatus.CheckedIn && (
                                                <div className="reservation-actions">
                                                    <button 
                                                        className="action-button primary"
                                                        onClick={() => handleCheckOut(reservation.Id)}
                                                        disabled={isLoading}
                                                    >
                                                        Registrar salida
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-reservations">
                                    <p>No tiene ninguna reserva.</p>
                                    <button 
                                        className="action-button primary"
                                        onClick={handleNavigateToRooms}
                                    >
                                        Reservar una habitación
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-section">
                            <h2>Mi perfil</h2>
                            <div className="profile-info">
                                <div className="info-item">
                                    <label>Nombre:</label>
                                    <span>{user?.Name}</span>
                                </div>
                                <div className="info-item">
                                    <label>Correo electrónico:</label>
                                    <span>{user?.Email}</span>
                                </div>
                                <div className="info-item">
                                    <label>Miembro desde:</label>
                                    <span>Enero de 2024</span>
                                </div>
                                <div className="info-item">
                                    <label>Reservas totales:</label>
                                    <span>{reservations.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}