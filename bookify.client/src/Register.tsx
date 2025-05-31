import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reuse login styles

const validateEmail = (email: string) => {
    // A basic regular expression for email validation
    const emailRegex = /^[^@\s@]+@[^@\s@]+\.[^@\s@]+$/;
    return emailRegex.test(email);
};

async function sendRegistrationData(email: string, password: string, name: string) {
    const response = await fetch('https://localhost:7035/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) {
        throw new Error('Registro fallido. Por favor, intente de nuevo.');
    }
    return await response.json();
}

export default function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('registerEmail') as string;
        const name = formData.get('registerName') as string;
        const password = (formData.get('registerPassword') as string).replace(/\s+/g, '');
        const confirmPassword = (formData.get('registerPasswordConfirm') as string).replace(/\s+/g, '');

        try {
            if (!validateEmail(email)) {
                throw new Error('Por favor, ingrese una dirección de correo electrónico válida');
            }
            if (password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            if (password.length < 8) {
                throw new Error('La contraseña debe tener al menos 8 caracteres');
            }

            await sendRegistrationData(email, password, name);
            alert('¡Registro exitoso! Por favor, inicie sesión.');
            navigate('/'); // Redirect to login page
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registro fallido. Por favor, intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-container">
                <h2>Crear cuenta</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-group">
                        <label htmlFor="registerEmail">Correo electrónico</label>
                        <input
                            id="registerEmail"
                            name="registerEmail"
                            type="email"
                            placeholder="Ingrese su correo electrónico"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerName">Nombre</label>
                        <input
                            id="registerName"
                            name="registerName"
                            type="text"
                            placeholder="Ingrese su nombre"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerPassword">Contraseña</label>
                        <input
                            id="registerPassword"
                            name="registerPassword"
                            type="password"
                            placeholder="Ingrese su contraseña"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="registerPasswordConfirm">Confirmar contraseña</label>
                        <input
                            id="registerPasswordConfirm"
                            name="registerPasswordConfirm"
                            type="password"
                            placeholder="Confirme su contraseña"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                    <div className="register-prompt">
                        <p>¿Ya tienes una cuenta?</p>
                        <button 
                            type="button"
                            className="register-button"
                            onClick={() => navigate('/')}
                            disabled={isLoading}
                        >
                            Volver a Inicio de Sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}