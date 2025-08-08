#!/bin/bash

echo "🚀 Setting up Keypo Wallet..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
    echo "   Especially:"
    echo "   - MASTER_KEY (minimum 32 characters)"
    echo "   - JWT_SECRET (minimum 32 characters)"
    echo "   - DATABASE_URL (your PostgreSQL connection)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Setting up database..."
npx prisma migrate dev --name init

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"