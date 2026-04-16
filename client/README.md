# IntelliStock Client

Modern SaaS frontend for IntelliStock - AI-powered inventory management and smart billing system.

## ✨ Features

- **Modern SaaS UI** - Clean, professional design inspired by Stripe/Vercel
- **Role-based Dashboards** - Admin, Staff, and Client interfaces
- **AI Analytics** - Machine learning-powered insights and forecasting
- **POS System** - Complete point-of-sale with cart management
- **Responsive Design** - Works perfectly on all devices
- **Smooth Animations** - Framer Motion powered interactions

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router v6

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
cd intellistock/client

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3001`

### Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client/
├── src/
│   ├── api/
│   │   └── axios.js              # HTTP client configuration
│   ├── components/
│   │   ├── Navbar.jsx           # Top navigation with user menu
│   │   ├── Sidebar.jsx          # Role-based navigation
│   │   ├── ProductCard.jsx      # Product display component
│   │   ├── BillingCart.jsx      # POS cart management
│   │   ├── RevenueChart.jsx     # Revenue visualization
│   │   ├── ForecastChart.jsx    # AI demand forecasting
│   │   ├── StatsCard.jsx        # Metrics display
│   │   └── AlertCard.jsx        # Notification alerts
│   ├── pages/
│   │   ├── Login.jsx            # Authentication page
│   │   ├── AdminDashboard.jsx   # Admin analytics dashboard
│   │   ├── StaffDashboard.jsx   # Inventory management
│   │   ├── ClientDashboard.jsx  # Customer product browsing
│   │   ├── Billing.jsx          # POS system
│   │   └── Analytics.jsx        # AI-powered analytics
│   ├── App.jsx                  # Main application component
│   └── main.jsx                 # Application entry point
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366f1)
- **Accent**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)

### Components
- Glass morphism effects
- Soft shadows and rounded corners
- Smooth hover animations
- Responsive grid layouts

## 🔐 User Roles

### Admin
- Complete analytics dashboard
- AI insights and forecasting
- System-wide management
- Revenue and performance metrics

### Staff
- Inventory management
- Product CRUD operations
- POS system access
- Stock level monitoring

### Client
- Product browsing
- Shopping cart
- Order history
- Purchase tracking

## 📊 Features

### Admin Dashboard
- Revenue analytics with charts
- AI demand forecasting
- Inventory alerts and recommendations
- Real-time metrics and KPIs

### POS System
- Product search and filtering
- Dynamic cart management
- Tax calculation
- Payment processing
- Receipt generation

### Analytics
- Machine learning predictions
- Sales trend analysis
- Customer behavior insights
- Inventory optimization

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### API Integration

The frontend connects to the backend API with automatic authentication handling and error management.

## 📱 Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Optimized performance

## 🎭 Animations

- Page transitions with Framer Motion
- Micro-interactions on buttons and cards
- Loading states and skeleton screens
- Smooth data updates

## 🚀 Deployment

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Setup

1. Ensure backend API is running on configured port
2. Set environment variables
3. Run build command
4. Deploy static files to your hosting platform

## 🤝 Contributing

1. Follow the established code style
2. Use meaningful commit messages
3. Test on multiple devices and browsers
4. Ensure accessibility compliance

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ for modern inventory management

```
src/
├── api/              # API service files
├── components/       # Reusable components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── App.jsx          # Main App component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Features

- **Dashboard**: Real-time analytics and charts
- **Products**: Manage inventory with low stock alerts
- **Sales**: Track sales transactions
- **Reports**: Generate and download reports
- **ML Integration**: Advanced analytics powered by ML models

## API Integration

The client connects to the backend API at `http://localhost:5000/api`. Ensure the backend server is running before using the application.

## Contributing

Follow the project's code style and commit conventions.

## License

MIT
