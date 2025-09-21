#!/bin/bash

# 3D Multiplayer Shooting Game - Local Installation Script
# This script automates the installation process for local development

echo "🎮 3D Multiplayer Shooting Game - Local Installation"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not detected. Please install PostgreSQL 13+ and create a database."
    echo "   Then update the DATABASE_URL in your .env file."
else
    echo "✅ PostgreSQL detected"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/shooter_game"

# Session Secret (replace with a secure random string)
SESSION_SECRET="your-secure-session-secret-$(date +%s)-$(shuf -i 1000-9999 -n 1)"

# Server Configuration
PORT=5000
NODE_ENV=development
EOL
    echo "✅ .env file created with default values"
    echo "⚠️  Please update the DATABASE_URL with your actual database credentials"
else
    echo "✅ .env file already exists"
fi

# Build check
echo ""
echo "🔧 Running build check..."
if npm run check; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your PostgreSQL database:"
echo "   createdb shooter_game"
echo ""
echo "2. Update the DATABASE_URL in .env with your database credentials"
echo ""
echo "3. Push the database schema:"
echo "   npm run db:push"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Open your browser and navigate to:"
echo "   http://localhost:5000"
echo ""
echo "🎮 Enjoy the game!"