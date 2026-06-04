# ⚽ Quiniela Mundial 2026 - MVP Frontend

Aplicación web completa para una quiniela deportiva del Mundial 2026 con estilo "Bento Box" y diseño Fintech minimalista.

## 🎨 Sistema de Diseño

### Paleta de Colores (Mundial 2026)

- **Background Base**: `#0A0E17` (Azul Marino Profundo)
- **Tarjetas Bento Box**: `#141A29` (Gris Azulado Translúcido)
- **Acentos**:
  - Morado Eléctrico: `#9333EA`
  - Verde Neón: `#10B981`
  - Fucsia: `#E11D48`
  - Cian: `#06B6D4`

### Tipografía

- **UI General**: Plus Jakarta Sans (nombres, menús, etiquetas)
- **Marcadores y Puntos**: Teko (números grandes y llamativos)

### Características Visuales

- ✅ Dark Mode estricto
- ✅ Glassmorphism (backdrop-blur)
- ✅ Border Radius: 24px - 32px
- ✅ Gradientes sutiles (10-15% opacidad)
- ✅ Mobile-first responsive

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── App.tsx                 # Componente principal con routing
│   └── components/
│       ├── Layout.tsx          # Layout con navegación mobile/desktop
│       ├── MatchCard.tsx       # Tarjeta de partido con Regla T-30
│       ├── Leaderboard.tsx     # Tabla de clasificación
│       ├── DateNav.tsx         # Carrusel de fechas
│       └── LeagueManager.tsx   # Crear/Unirse a ligas
├── styles/
│   ├── theme.css              # Sistema de colores Mundial 2026
│   └── fonts.css              # Importación de fuentes
└── imports/
    └── pasted_text/
        └── mundial-2026-quiniela.md  # Especificaciones originales
```

## 📋 Reglas de Negocio

### Sistema de Puntuación (Evaluación en Cascada)

Por cada partido, el usuario recibe puntos según:

1. **5 puntos** - Resultado exacto (Ej: Pronóstico 2-1, Real 2-1)
2. **4 puntos** - Acierta ganador + goles exactos de 1 equipo
3. **2 puntos** - Acierta ganador o acierta empate con marcador distinto
4. **2 puntos** - Acierta goles de 1 equipo (sin acertar ganador)
5. **0 puntos** - Todo incorrecto

### Regla T-30 (Bloqueo Dinámico)

- Los usuarios pueden editar pronósticos ilimitadamente
- **30 minutos antes** del partido, la tarjeta se bloquea automáticamente
- Muestra candado rojo y deshabilita inputs
- Una vez bloqueado, no se permiten más cambios

### Zonas Horarias

- Base de datos: **UTC**
- Frontend: **UTC-5 (America/Lima)** - Todo se renderiza en hora peruana

### Ligas Privadas

- Código alfanumérico único (Ej: `MUND-X7B9`)
- Los usuarios se unen mediante código
- Ranking filtrado por `league_id`

## 🧩 Componentes Principales

### MatchCard

Tarjeta interactiva para realizar pronósticos:

- Header: Hora (UTC-5), Estadio, Grupo
- Body: Banderas circulares + Inputs grandes para goles
- Footer: Botón "Guardar" con estados (Loading, Guardado, Bloqueado)
- Lógica T-30 integrada
- Muestra puntos obtenidos si el partido finalizó

### Leaderboard

Tabla de posiciones con:

- Avatares circulares (con iniciales si no hay imagen)
- Puntaje total (font-score gigante)
- Flechas de movimiento (subió/bajó de posición)
- Destacado del usuario actual
- Top 3 con íconos especiales (trofeo, medallas)

### DateNav

Carrusel horizontal de fechas:

- Píldoras con día, número y mes
- Scroll horizontal suave
- Gradientes laterales para indicar más contenido
- Fecha seleccionada destacada con gradiente

### Layout

Navegación adaptativa:

- Desktop: Navbar superior con tabs
- Mobile: Bottom navigation (3 tabs)
- Código de liga siempre visible
- Menu hamburguesa en mobile

### LeagueManager

Gestión de ligas:

- Ver liga actual con código
- Copiar código al portapapeles
- Crear nueva liga
- Unirse con código

## 🗄️ Esquema de Base de Datos

Ver archivo: `SUPABASE_SCHEMA.sql`

### Tablas Principales

1. **users** - Usuarios de la aplicación
2. **leagues** - Ligas privadas
3. **league_members** - Relación usuarios-ligas
4. **matches** - Partidos del Mundial
5. **predictions** - Pronósticos de usuarios

### Características Destacadas

- ✅ Triggers automáticos para calcular puntos
- ✅ Row Level Security (RLS) configurado
- ✅ Función de cálculo de puntos en PL/pgSQL
- ✅ Generador de códigos únicos de invitación
- ✅ 6 partidos seed ya incluidos

## 🚀 Próximos Pasos (Integración Backend)

Para convertir este frontend funcional en una aplicación completa:

### 1. Configurar Supabase

```bash
# 1. Crear proyecto en supabase.com
# 2. Ejecutar SUPABASE_SCHEMA.sql en SQL Editor
# 3. Habilitar Authentication > Email/Password
# 4. Copiar Project URL y Anon Key
```

### 2. Instalar Cliente Supabase

```bash
pnpm add @supabase/supabase-js
```

### 3. Crear Cliente Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. Implementar Autenticación

Reemplazar datos mock en `App.tsx` con:

```typescript
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

// Obtener usuario actual
const [user, setUser] = useState(null);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### 5. Conectar Match Cards con Supabase

```typescript
// Cargar partidos
const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .order('fecha_hora');

// Guardar predicción
const { error } = await supabase
  .from('predictions')
  .upsert({
    user_id: user.id,
    match_id: matchId,
    goles_a: golesA,
    goles_b: golesB
  });
```

### 6. Implementar Realtime (Leaderboard)

```typescript
// Suscripción a cambios en tiempo real
supabase
  .channel('predictions')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'predictions' },
    (payload) => {
      // Actualizar leaderboard
    }
  )
  .subscribe();
```

## 📱 Datos de Prueba (Mock)

El frontend actual incluye:

- ✅ 6 partidos del Mundial 2026
- ✅ 5 jugadores mock en leaderboard
- ✅ 1 liga de ejemplo (MUND-X7B9)
- ✅ Sistema de predicciones local (sin persistencia)

## 🎯 Características Implementadas

### Frontend Completo ✅

- [x] Sistema de diseño Mundial 2026
- [x] Componente MatchCard con Regla T-30
- [x] Leaderboard dinámico
- [x] Navegador de fechas
- [x] Layout mobile-first
- [x] Gestión de ligas
- [x] Conversión de zonas horarias
- [x] Estados de carga y guardado
- [x] Responsive en todos los breakpoints

### Pendiente (Backend) ⏳

- [ ] Autenticación de usuarios
- [ ] Persistencia en Supabase
- [ ] Actualización en tiempo real
- [ ] Gestión de sesiones
- [ ] Carga de datos desde DB
- [ ] Cálculo automático de puntos
- [ ] Notificaciones push

## 💡 Notas de Desarrollo

### Conversión de Zonas Horarias

Todos los partidos se almacenan en UTC en la DB:

```typescript
// En MatchCard.tsx
const matchDate = new Date(match.fecha_hora); // UTC
// date-fns automáticamente convierte a la zona local del navegador
// Para forzar UTC-5, se puede usar date-fns-tz
```

### Prevención de Edición (Regla T-30)

```typescript
const diffMinutes = Math.floor(
  (matchDate.getTime() - now.getTime()) / (1000 * 60)
);
const isLocked = diffMinutes <= 30 || match.estado !== 'pendiente';
```

### Iniciales de País

Los placeholders de banderas usan las iniciales del nombre del país:

```typescript
const getCountryInitials = (country: string) => {
  return country
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
```

## 🎨 Personalización

### Cambiar Colores

Editar `/src/styles/theme.css`:

```css
--purple-electric: #9333EA; /* Tu color */
--green-neon: #10B981;
--fuscia: #E11D48;
--cyan: #06B6D4;
```

### Agregar Más Partidos

Insertar en Supabase o agregar al array `SEED_MATCHES` en `App.tsx`:

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

## 📞 Soporte

Para dudas o problemas:

1. Revisar `SUPABASE_SCHEMA.sql` para la estructura de DB
2. Verificar zona horaria en conversiones
3. Asegurar que date-fns esté instalado: `pnpm list date-fns`

---

**Hecho con ⚡ para el Mundial 2026**
