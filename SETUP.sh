#!/bin/bash
# IntelliStock Setup and Debug Script

echo "🚀 IntelliStock Backend Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Navigate to server directory
cd server || exit

echo ""
echo "📦 Installing server dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intellistock_db

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# ML Service
ML_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGIN=http://localhost:5173
EOF
    echo "✅ Created .env file - UPDATE DB credentials!"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Update DB credentials in server/.env"
echo "3. Run migrations: npm run migrate"
echo "4. Start server: npm run dev"
