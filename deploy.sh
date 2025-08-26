#!/bin/bash

echo "🚀 Iniciando despliegue del Sistema de Trading Journal..."

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Verificar si yarn está instalado
if ! command -v yarn &> /dev/null; then
    echo "❌ Error: Yarn no está instalado. Instálalo con: npm install -g yarn"
    exit 1
fi

echo "📦 Instalando dependencias..."
yarn install

echo "🔨 Construyendo el proyecto..."
yarn build

if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
    
    echo ""
    echo "🎯 Opciones de despliegue:"
    echo "1. Vercel (recomendado): vercel"
    echo "2. Netlify: netlify deploy"
    echo "3. Railway: railway up"
    echo ""
    echo "📝 Recuerda configurar las variables de entorno:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "📚 Consulta DEPLOYMENT.md para más detalles"
else
    echo "❌ Error en el build. Revisa los errores arriba."
    exit 1
fi
