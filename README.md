# 🏨 Bookify - Hotel Management System

<div align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-blue" alt="Status: In Development"/>
  <img src="https://img.shields.io/badge/Version-0.1.0-green" alt="Version: 0.1.0"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT"/>
</div>

## 📋 Description

Bookify is a modern hotel management platform built with ASP.NET Core and React, designed to provide a complete solution for hotel operations including booking management, check-in processes, and payment handling. The application follows a clean architecture approach with a clear separation between the frontend and backend services.

## 🛠 Tech Stack

### Frontend (bookify.client)
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 6
- **Routing:** React Router DOM 7
- **Payment Integration:** PayPal React SDK
- **Development Tools:**
  - ESLint 9
  - TypeScript 5.7
  - Vite 6.3

### Backend (Bookify.Server)
- **Framework:** ASP.NET Core 8.0
- **Database:** SQL Server with Entity Framework Core 9.0
- **API Documentation:** Swagger/OpenAPI
- **Key Packages:**
  - Microsoft.EntityFrameworkCore.SqlServer
  - Microsoft.AspNetCore.SpaProxy
  - Swashbuckle.AspNetCore

## 📦 Project Structure

```
bookify/
├── bookify.client/           # React Frontend Application
│   ├── src/                 # Source code
│   ├── public/             # Static assets
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Frontend dependencies
│
├── Bookify.Server/          # ASP.NET Core Backend
│   ├── Controllers/        # API Controllers
│   ├── Data/              # Data access layer
│   ├── Migrations/        # Database migrations
│   ├── Program.cs         # Application entry point
│   └── appsettings.json   # Configuration
│
└── Bookify.sln            # Solution file
```

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- SQL Server
- Visual Studio 2022 or VS Code

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/bookify.git
cd bookify
```

2. Backend Setup:
```bash
cd Bookify.Server
dotnet restore
dotnet ef database update
```

3. Frontend Setup:
```bash
cd ../bookify.client
npm install
```

4. Running the Application:
```bash
# From the root directory
dotnet run --project Bookify.Server
```

The application will be available at:
- Frontend: https://localhost:57182
- Backend API: https://localhost:5001
- Swagger Documentation: https://localhost:5001/swagger

## 🧪 Development

- The backend uses Entity Framework Core for database operations
- The frontend is configured with Vite for fast development
- SPA Proxy is configured for seamless development experience
- Hot reload is enabled for both frontend and backend

## 📚 Documentation

- API documentation is available through Swagger UI when running the application
- Database schema can be viewed through Entity Framework migrations
- Frontend component documentation is available in the source code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For support, please open an issue in the repository.

---

<div align="center">
  <sub>Built with ❤️ by the Bookify Team</sub>
</div>