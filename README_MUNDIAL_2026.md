# ⚽ Quiniela Mundial 2026 - Versión Oficial

Aplicación web con diseño oficial del Mundial FIFA 2026, banderas reales y login funcional.

## 🎨 Cambios de Diseño (Nueva Versión)

### ✨ Lo Nuevo

✅ **Fondo Blanco Premium** - Diseño limpio y profesional  
✅ **Paleta Oficial Mundial 2026** - Colores vibrantes extraídos del branding oficial:
- Morado: `#7B2FBE`
- Verde Lima: `#BFFF00`
- Verde: `#00C853`
- Rosa/Fucsia: `#FF1744`
- Turquesa: `#00BFA5`
- Amarillo: `#FFD600`

✅ **Logo Oficial** - Logo del Mundial 2026 con el trofeo integrado  
✅ **Banderas Reales** - SVGs de banderas de países desde `country-flag-icons`  
✅ **Login Funcional** - Pantalla de inicio de sesión con credenciales demo  
✅ **Gradientes Vibrantes** - Efectos visuales coloridos y festivos  
✅ **Sombras Mundial** - Sistema de sombras personalizado con colores del torneo  

### 🎯 Nuevos Componentes

#### 1. Login (`src/app/components/Login.tsx`)
- Formulario de inicio de sesión
- Logo del Mundial 2026
- Fondo con blobs coloridos
- Credenciales demo visibles:
  - Usuario: `demo`
  - Contraseña: `demo123`

#### 2. CountryFlag (`src/app/components/CountryFlag.tsx`)
- Banderas SVG reales de países
- Mapeo de nombres a códigos ISO
- Fallback con iniciales si la bandera no carga
- Tamaños: sm, md, lg, xl
- Bordes circulares con sombra

#### 3. Componentes Actualizados
Todos los componentes principales han sido rediseñados:
- **MatchCard**: Banderas reales, gradientes morado-turquesa
- **Layout**: Logo del Mundial, botón de logout
- **Leaderboard**: Medallas doradas/plata/bronce para top 3
- **DateNav**: Píldoras con gradiente vibrante
- **LeagueManager**: Cards coloridos con gradientes

## 🚀 Cómo Usar

### 1. Iniciar la Aplicación

La app ya está funcionando. Solo abre la vista previa y verás:

1. **Pantalla de Login**
   - Usuario: `demo`
   - Contraseña: `demo123`

2. **Dashboard Principal**
   - Logo del Mundial 2026 en navbar
   - 3 vistas: Partidos, Clasificación, Ligas
   - Código de liga visible: `MUND-X7B9`

### 2. Navegar por la App

**Vista Partidos:**
- Carrusel de fechas en la parte superior
- Tarjetas de partidos con banderas reales
- Inputs gigantes para ingresar goles
- Botón "Guardar Pronóstico"
- Bloqueo automático T-30 (30 min antes del partido)

**Vista Clasificación:**
- Top 3 con medallas (oro, plata, bronce)
- Flechas de movimiento (↑ subió, ↓ bajó)
- Usuario actual destacado
- Puntajes con tipografía Teko gigante

**Vista Ligas:**
- Ver liga actual con código
- Copiar código al portapapeles
- Crear nueva liga
- Unirse con código

### 3. Cerrar Sesión

Click en "Salir" en el navbar (desktop) o en el menú (mobile)

## 🎨 Sistema de Colores

### Variables CSS Disponibles

```css
/* Colores principales */
--mundial-purple: #7B2FBE;
--mundial-lime: #BFFF00;
--mundial-green: #00C853;
--mundial-pink: #FF1744;
--mundial-coral: #FF6B6B;
--mundial-navy: #1A237E;
--mundial-turquoise: #00BFA5;
--mundial-yellow: #FFD600;

/* Gradientes */
--gradient-purple: linear-gradient(135deg, #7B2FBE, #9C27B0);
--gradient-green: linear-gradient(135deg, #00C853, #00E676);
--gradient-pink: linear-gradient(135deg, #FF1744, #FF4081);
--gradient-turquoise: linear-gradient(135deg, #00BFA5, #1DE9B6);
--gradient-multi: linear-gradient(135deg, #7B2FBE, #00BFA5, #FFD600);

/* Blobs decorativos */
--blob-purple: rgba(123, 47, 190, 0.15);
--blob-lime: rgba(191, 255, 0, 0.2);
--blob-green: rgba(0, 200, 83, 0.15);
--blob-pink: rgba(255, 23, 68, 0.15);
--blob-turquoise: rgba(0, 191, 165, 0.15);
--blob-yellow: rgba(255, 214, 0, 0.2);
```

### Clases Útiles

```tsx
// Sombras especiales del Mundial
className="shadow-mundial"      // Sombra estándar
className="shadow-mundial-lg"   // Sombra grande

// Texto con gradiente
className="text-gradient-mundial"

// Animación de pulso
className="animate-pulse-mundial"
```

## 🏗️ Estructura de Archivos

```
src/
├── app/
│   ├── App.tsx                    # App principal con login
│   ├── components/
│   │   ├── Login.tsx              # ⭐ NUEVO - Pantalla de login
│   │   ├── CountryFlag.tsx        # ⭐ NUEVO - Banderas reales
│   │   ├── MatchCard.tsx          # ✏️ ACTUALIZADO
│   │   ├── Layout.tsx             # ✏️ ACTUALIZADO - Logo mundial
│   │   ├── Leaderboard.tsx        # ✏️ ACTUALIZADO
│   │   ├── DateNav.tsx            # ✏️ ACTUALIZADO
│   │   └── LeagueManager.tsx      # ✏️ ACTUALIZADO
│   └── types/
│       └── index.ts               # Tipos TypeScript
├── styles/
│   ├── theme.css                  # ✏️ ACTUALIZADO - Fondo blanco
│   └── fonts.css                  # Plus Jakarta Sans + Teko
└── imports/
    ├── image.png                  # Logo Mundial 2026
    └── image-1.png                # Paleta de colores
```

## 🌍 Banderas Disponibles

El componente `CountryFlag` soporta estos países (y más):

- México (MX)
- Sudáfrica (ZA)
- República de Corea (KR)
- República Checa (CZ)
- Canadá (CA)
- Bosnia (BA)
- Estados Unidos (US)
- Paraguay (PY)
- Australia (AU)
- Turquía (TR)
- Catar (QA)
- Suiza (CH)
- Brasil (BR)
- Argentina (AR)
- España (ES)
- Alemania (DE)
- Francia (FR)
- Y 30+ países más...

### Agregar Más Banderas

Edita `src/app/components/CountryFlag.tsx`:

```typescript
const COUNTRY_CODES: Record<string, string> = {
  'Tu País': 'XX', // Código ISO 3166-1 alpha-2
  // ...
};
```

## 📱 Responsive Design

- **Mobile First**: Diseño optimizado para móviles
- **Bottom Navigation**: Tabs fijas en la parte inferior (mobile)
- **Desktop**: Navbar superior con todos los controles
- **Tablet**: Adaptación automática
- **Safe Areas**: Soporte para iPhone con notch

## 🎯 Características Principales

### Login
- ✅ Formulario funcional
- ✅ Validación de campos
- ✅ Estados de carga
- ✅ Credenciales demo visibles
- ✅ Logo del Mundial integrado

### Banderas Reales
- ✅ SVGs desde CDN (flagcdn.com)
- ✅ Fallback con iniciales
- ✅ Mapeo automático de nombres
- ✅ 4 tamaños disponibles
- ✅ Bordes y sombras personalizadas

### Match Cards
- ✅ Banderas circulares de equipos
- ✅ Gradientes morado-turquesa
- ✅ Inputs con border colorido
- ✅ Animación de guardado
- ✅ Regla T-30 activa

### Leaderboard
- ✅ Top 3 con medallas especiales
- ✅ Gradientes oro/plata/bronce
- ✅ Flechas de movimiento
- ✅ Sombras especiales
- ✅ Usuario actual destacado

### Layout
- ✅ Logo del Mundial visible
- ✅ Botón de logout
- ✅ Código de liga destacado
- ✅ Gradientes en tabs
- ✅ Responsive completo

## 🔐 Autenticación

### Credenciales Demo

```
Usuario: demo
Contraseña: demo123
```

### Flujo de Auth

1. Usuario ingresa credenciales
2. Click en "Iniciar Sesión"
3. Validación (1 segundo)
4. Redirige al dashboard
5. Botón "Salir" disponible

### Personalizar Login

En `src/app/App.tsx`:

```typescript
const handleLogin = async (username: string, password: string) => {
  // Tu lógica de autenticación
  // Puede conectarse a Supabase Auth aquí
  
  if (/* validación exitosa */) {
    setIsLoggedIn(true);
    setCurrentUser(username);
  } else {
    throw new Error('Credenciales incorrectas');
  }
};
```

## 🎨 Personalización

### Cambiar Logo

Reemplaza `/src/imports/image.png` con tu logo y la app lo usará automáticamente.

### Cambiar Colores

Edita `/src/styles/theme.css`:

```css
:root {
  --mundial-purple: #TU_COLOR;
  --mundial-turquoise: #TU_COLOR;
  /* ... etc */
}
```

### Agregar Más Partidos

Edita el array `SEED_MATCHES` en `App.tsx`:

```typescript
{
  id: 7,
  equipo_a: "Brasil",
  equipo_b: "Argentina",
  fecha_hora: "2026-06-14T02:00:00Z",
  estadio: "MetLife Stadium",
  grupo: "C",
  goles_a: null,
  goles_b: null,
  estado: 'pendiente'
}
```

## 🚀 Próximos Pasos

### Integración con Supabase

1. **Instalar cliente**:
```bash
pnpm add @supabase/supabase-js
```

2. **Configurar autenticación**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// En handleLogin
const { data, error } = await supabase.auth.signInWithPassword({
  email: username,
  password: password
});
```

3. **Ejecutar schema SQL**:
Ver `SUPABASE_SCHEMA.sql` para la estructura completa.

## 📦 Dependencias Nuevas

```json
{
  "country-flag-icons": "1.6.17"  // Banderas SVG
}
```

## 🎉 Resumen de Mejoras

| Característica | Antes | Ahora |
|---------------|-------|-------|
| Tema | Dark mode | Light mode blanco ✨ |
| Colores | Genéricos | Paleta oficial Mundial 2026 🎨 |
| Banderas | Iniciales con gradiente | SVGs reales de países 🏴 |
| Logo | Ícono genérico | Logo oficial FIFA 2026 🏆 |
| Login | No existía | Pantalla completa funcional 🔐 |
| Gradientes | Sutiles (10% opacidad) | Vibrantes y festivos 🌈 |
| Sombras | Estándar | Personalizadas con colores 💫 |
| Top 3 | Íconos simples | Medallas oro/plata/bronce 🥇 |

## 💡 Tips de Uso

1. **Probar Login**: Usa `demo / demo123`
2. **Ver Banderas**: Navega a vista de Partidos
3. **Copiar Código**: Click en el botón de copiar en la tarjeta de liga
4. **Filtrar Fechas**: Click en cualquier fecha del carrusel
5. **Guardar Pronóstico**: Ingresa goles y click en "Guardar"
6. **Ver Top 3**: Navega a Clasificación para ver medallas

---

**🏆 Listo para el Mundial 2026**

¡Tu quiniela está lista con el estilo oficial del torneo!
