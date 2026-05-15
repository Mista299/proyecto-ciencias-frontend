Cómo configurar variables de entorno para despliegue en Vercel

- Variables públicas (cliente): prefijar con EXPO_PUBLIC_. Ejemplo: EXPO_PUBLIC_API_URL
- Variables privadas (secretos): no incluir en el bundle del cliente; usar serverless functions o backend.

Pasos en Vercel:
1. En Vercel, abrir el proyecto -> Settings -> Environment Variables.
2. Añadir variable: Name = EXPO_PUBLIC_API_URL, Value = https://api.miapp.test, Environment = Production (o Preview/Development según corresponda).
3. Guardar y desplegar. Durante la build, app.config.js leerá process.env.EXPO_PUBLIC_API_URL y la pondrá en expo.extra.

Build Command recomendado en Vercel:
PUBLIC_URL=. npx expo export:web --output web-build
Output Directory: web-build

Nota: Si necesitás variables en tiempo de ejecución (no build), considerar un backend o endpoints que entreguen la configuración segura al cliente. Si querés, puedo agregar ejemplos adicionales o variables específicas.