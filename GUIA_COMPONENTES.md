# 📚 Guía de Uso de Componentes

## 🎯 MatchCard

Componente principal para realizar pronósticos de partidos.

### Props

```typescript
interface MatchCardProps {
  match: Match;                    // Datos del partido
  prediction?: Prediction;          // Pronóstico existente (opcional)
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
}
```

### Uso

```tsx
<MatchCard
  match={{
    id: 1,
    equipo_a: "México",
    equipo_b: "Sudáfrica",
    fecha_hora: "2026-06-11T19:00:00Z",
    estadio: "Estadio Ciudad de México",
    grupo: "A",
    estado: 'pendiente'
  }}
  prediction={{ goles_a: 2, goles_b: 1 }}
  onSavePrediction={async (id, a, b) => {
    await saveToDatabase(id, a, b);
  }}
/>
```

### Estados Visuales

- **Normal**: Inputs editables, botón "Guardar Pronóstico"
- **Guardando**: Spinner + texto "Guardando..."
- **Guardado**: Check verde + texto "Guardado" (2 seg)
- **Bloqueado**: Candado rojo + inputs deshabilitados (T-30)

### Regla T-30

El componente automáticamente:
- Calcula minutos hasta el partido
- Bloquea inputs 30 minutos antes
- Deshabilita el botón de guardar
- Muestra ícono de candado rojo

---

## 🏆 Leaderboard

Tabla de clasificación con avatares y puntajes.

### Props

```typescript
interface LeaderboardProps {
  players: LeaderboardPlayer[];    // Array de jugadores
  currentUserId?: string;          // ID del usuario actual (opcional)
}
```

### Uso

```tsx
<Leaderboard
  players={[
    {
      id: '1',
      nombre: 'Carlos Rodríguez',
      puntaje_total: 45,
      posicion_anterior: 2,  // Posición en ronda anterior
      avatar_url: 'https://...'  // Opcional
    },
    // ... más jugadores
  ]}
  currentUserId="1"  // Destaca al usuario actual
/>
```

### Características

- **Top 3**: Íconos especiales (trofeo oro, plata, bronce)
- **Avatares**: Imagen o iniciales en círculo con gradiente
- **Flechas**: 🔼 subió, 🔽 bajó, ➖ sin cambios
- **Highlight**: Borde especial para usuario actual
- **Font Score**: Números gigantes en tipografía Teko

---

## 📅 DateNav

Carrusel horizontal de fechas para filtrar partidos.

### Props

```typescript
interface DateNavProps {
  dates: Date[];              // Array de fechas únicas
  selectedDate: Date | null;  // Fecha seleccionada actual
  onDateSelect: (date: Date) => void;  // Callback al seleccionar
}
```

### Uso

```tsx
const uniqueDates = [
  new Date('2026-06-11'),
  new Date('2026-06-12'),
  new Date('2026-06-13')
];

<DateNav
  dates={uniqueDates}
  selectedDate={selectedDate}
  onDateSelect={(date) => setSelectedDate(date)}
/>
```

### Características

- Scroll horizontal suave
- Botones de navegación izq/der
- Gradientes laterales (indicador de más contenido)
- Píldora seleccionada con gradiente vibrante
- Formato: "Jue 11 Jun"

---

## 🏗️ Layout

Layout principal con navegación responsive.

### Props

```typescript
interface LayoutProps {
  children: ReactNode;
  currentView: 'matches' | 'leaderboard' | 'leagues';
  onViewChange: (view: 'matches' | 'leaderboard' | 'leagues') => void;
  leagueCode?: string;  // Código de liga actual (opcional)
}
```

### Uso

```tsx
<Layout
  currentView="matches"
  onViewChange={(view) => setCurrentView(view)}
  leagueCode="MUND-X7B9"
>
  {/* Contenido de la vista actual */}
  <MatchList />
</Layout>
```

### Adaptabilidad

**Desktop** (md+):
- Navbar superior con tabs
- Logo + título a la izquierda
- Código de liga en el centro
- Tabs de navegación a la derecha

**Mobile** (< md):
- Navbar superior minimalista
- Menu hamburguesa
- Bottom navigation fija (3 tabs)
- Safe area para iOS

---

## 🎮 LeagueManager

Gestión de ligas: crear, unirse, ver actual.

### Props

```typescript
interface LeagueManagerProps {
  currentLeague?: League;
  onCreateLeague?: (nombre: string) => Promise<void>;
  onJoinLeague?: (codigo: string) => Promise<void>;
}
```

### Uso

```tsx
<LeagueManager
  currentLeague={{
    id: '1',
    nombre: 'Liga de Amigos',
    codigo_invitacion: 'MUND-X7B9',
    admin_id: '1',
    member_count: 5
  }}
  onCreateLeague={async (nombre) => {
    const code = generateUniqueCode();
    await supabase.from('leagues').insert({ nombre, codigo_invitacion: code });
  }}
  onJoinLeague={async (codigo) => {
    const league = await supabase.from('leagues').select().eq('codigo_invitacion', codigo).single();
    await supabase.from('league_members').insert({ user_id, league_id: league.id });
  }}
/>
```

### Funcionalidades

1. **Ver Liga Actual**:
   - Nombre y número de participantes
   - Código de invitación grande
   - Botón para copiar código

2. **Crear Liga**:
   - Input para nombre
   - Genera código único automático
   - Validación

3. **Unirse a Liga**:
   - Input con formato MUND-XXXX
   - Convierte a mayúsculas automáticamente
   - Validación de código

---

## 🎨 Tokens de Diseño

### Colores CSS (variables)

```css
/* Uso en componentes */
background: var(--blob-purple);     /* Gradiente morado */
background: var(--blob-green);      /* Gradiente verde */
background: var(--blob-fuscia);     /* Gradiente fucsia */
background: var(--blob-cyan);       /* Gradiente cian */

color: var(--primary);              /* #9333EA - Morado */
color: var(--secondary);            /* #10B981 - Verde */
color: var(--accent);               /* #06B6D4 - Cian */
color: var(--destructive);          /* #E11D48 - Fucsia/Rojo */
```

### Clases Tailwind Personalizadas

```tsx
// Border Radius Bento Box
className="rounded-[32px]"  // Cards principales
className="rounded-2xl"     // Botones y elementos internos

// Backdrop Blur (Glassmorphism)
style={{ backdropFilter: 'blur(16px)' }}

// Font Score (Teko)
className="font-score text-5xl font-bold"  // Marcadores
```

---

## 🔧 Utilidades TypeScript

### Cálculo de Puntos

```typescript
import { calculatePoints } from './types';

const points = calculatePoints(
  { goles_a: 2, goles_b: 1 },  // Pronóstico
  { goles_a: 2, goles_b: 1 }   // Resultado
);
// points = 5 (resultado exacto)
```

### Verificar Bloqueo (T-30)

```typescript
import { isMatchLocked } from './types';

const locked = isMatchLocked(
  '2026-06-11T19:00:00Z',  // Fecha del partido
  'pendiente'               // Estado
);
// locked = true si faltan <= 30 minutos
```

### Generar Código de Liga

```typescript
import { generateLeagueCode, isValidLeagueCode } from './types';

const code = generateLeagueCode();
// code = "MUND-X7B9" (random)

const valid = isValidLeagueCode("MUND-ABC1");
// valid = true
```

---

## 📊 Flujo de Datos

### 1. Cargar Partidos

```typescript
// Desde Supabase
const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .order('fecha_hora');

// Extraer fechas únicas
const uniqueDates = Array.from(
  new Set(matches.map(m => startOfDay(parseISO(m.fecha_hora))))
);
```

### 2. Filtrar por Fecha

```typescript
const filteredMatches = matches.filter(match =>
  selectedDate
    ? isSameDay(parseISO(match.fecha_hora), selectedDate)
    : true
);
```

### 3. Guardar Pronóstico

```typescript
const handleSave = async (matchId: number, golesA: number, golesB: number) => {
  // Upsert (insert or update)
  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: currentUser.id,
      match_id: matchId,
      goles_a: golesA,
      goles_b: golesB
    }, {
      onConflict: 'user_id,match_id'  // Unique constraint
    });

  if (error) throw error;
};
```

### 4. Actualizar Leaderboard (Realtime)

```typescript
useEffect(() => {
  const channel = supabase
    .channel('predictions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'predictions'
      },
      (payload) => {
        // Recargar leaderboard
        fetchLeaderboard();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🐛 Debugging

### Ver Estado de Match Card

```tsx
console.log({
  matchId: match.id,
  minutesUntil,
  isLocked,
  formattedTime,
  currentPrediction: prediction
});
```

### Verificar Zona Horaria

```typescript
const matchDate = new Date('2026-06-11T19:00:00Z');
console.log('UTC:', matchDate.toISOString());
console.log('Local:', matchDate.toLocaleString());
console.log('Peru:', matchDate.toLocaleString('es-PE', { timeZone: 'America/Lima' }));
```

### Simular Bloqueo T-30

```typescript
// Temporalmente cambiar la fecha del partido a 25 min en el futuro
const testMatch = {
  ...match,
  fecha_hora: new Date(Date.now() + 25 * 60 * 1000).toISOString()
};
// Debería aparecer bloqueado
```

---

## ✅ Checklist de Integración

Cuando conectes con Supabase:

- [ ] Reemplazar `SEED_MATCHES` con fetch desde DB
- [ ] Reemplazar `MOCK_PLAYERS` con query a `league_members`
- [ ] Implementar `handleSavePrediction` con upsert real
- [ ] Implementar `handleCreateLeague` con insert
- [ ] Implementar `handleJoinLeague` con validación de código
- [ ] Agregar suscripción realtime al leaderboard
- [ ] Implementar autenticación (login/signup)
- [ ] Cargar usuario actual desde session
- [ ] Agregar loading states
- [ ] Agregar error handling con toast/alert

---

## 🎓 Ejemplos de Integración

### Login Simple

```tsx
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  // Usuario autenticado en data.user
};
```

### Cargar Predicciones del Usuario

```tsx
const loadUserPredictions = async (userId: string) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  // Convertir a Record<matchId, prediction>
  const predictionsMap = {};
  data.forEach(p => {
    predictionsMap[p.match_id] = p;
  });

  return predictionsMap;
};
```

### Actualizar Puntaje Total

```tsx
// Trigger automático en Supabase hace esto
// Pero si quieres forzar recálculo manual:
const recalculateUserScore = async (userId: string) => {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('puntos_obtenidos')
    .eq('user_id', userId);

  const total = predictions.reduce((sum, p) => sum + (p.puntos_obtenidos || 0), 0);

  await supabase
    .from('league_members')
    .update({ puntaje_total: total })
    .eq('user_id', userId);
};
```

---

**Hecho con 💜 para tu quiniela**
