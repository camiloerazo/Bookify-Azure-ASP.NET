import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from './AuthContext';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleNavigateToRegister = () => {
        navigate('/register');
    };

    const handleNavigateToAdmin = () => {
        navigate('/admin');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Por favor, complete todos los campos');
            setIsLoading(false);
            return;
        }

        try {
            // First, check if the user exists
            const response = await fetch(`https://localhost:7035/users/consult/${encodeURIComponent(email.trim())}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Usuario no encontrado');
                }
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Error al verificar credenciales de usuario');
            }

            const userData: User = await response.json();
            console.log('Received user data:', { ...userData, Password: '[REDACTED]' });
            console.log('Password comparison:', {
                provided: password.trim(),
                stored: userData.Password?.trim(),
                lengths: {
                    provided: password.trim().length,
                    stored: userData.Password?.trim().length
                },
                exactMatch: password.trim() === userData.Password?.trim()
            });

            // Verify password (Note: In production, this should be done on the server)
            const trimmedProvidedPassword = password.trim();
            const trimmedStoredPassword = userData.Password?.trim() || '';
            
            if (trimmedProvidedPassword !== trimmedStoredPassword) {
                console.error('Password mismatch:', {
                    provided: trimmedProvidedPassword,
                    stored: trimmedStoredPassword,
                    lengths: {
                        provided: trimmedProvidedPassword.length,
                        stored: trimmedStoredPassword.length
                    }
                });
                throw new Error('Contraseña inválida');
            }

            // Remove password from user data before storing
            const { Password: _, ...userWithoutPassword } = userData;
            
            // Call the login function from AuthContext with user data (without password)
            login(userWithoutPassword as User);
            
            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Bienvenido a Bookify</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="action-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>
                <div className="register-prompt">
                    <p>¿No tienes una cuenta?</p>
                    <button 
                        className="register-button"
                        onClick={handleNavigateToRegister}
                        disabled={isLoading}
                    >
                        Crear cuenta
                    </button>
                </div>
                <div className="admin-prompt">
                    <button 
                        className="admin-button"
                        onClick={handleNavigateToAdmin}
                        disabled={isLoading}
                    >
                        Acceder al Panel de Administrador
                    </button>
                </div>
            </div>
        </div>
    );
}