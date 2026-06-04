# ⚽ Quiniela Mundial 2026 - Versión 2.0

## 🎉 ¡Nueva Experiencia!

### ✨ Mejoras Principales (V2)

#### 🎨 **Colores Auténticos del Mundial**
- ❌ Eliminado: Morado y azul/turquesa
- ✅ Nuevo: Colores oficiales vibrantes
  - **Verde Lima**: `#BFFF00` (color principal)
  - **Amarillo**: `#FFD600` (acentos)
  - **Verde**: `#00C853` (botones/textos)
  - **Rosa/Coral**: `#FF6B6B`, `#FF1744` (alertas)

#### 📅 **Timeline Vertical (Sin Selector de Fechas)**
- Las fechas se muestran horizontalmente en pequeñas píldoras
- Los partidos aparecen organizados por día
- **Auto-scroll** a la fecha actual o próxima
- Scroll hacia arriba para ver pronósticos pasados
- Mucho menos espacio ocupado
- Colores dinámicos:
  - **Verde Lima**: Hoy
  - **Amarillo**: Próximos partidos
  - **Gris**: Partidos pasados

#### ➕ **Inputs Mejorados (+/-)**
- Botones **+** y **-** para incrementar/decrementar goles
- Números grandes y claros en el centro
- Botón **+** verde lima (incrementar)
- Botón **-** rosa coral (decrementar)
- Más fácil en móvil (no más teclado numérico)

## 🎯 Cómo Usar

### 1. Inicio de Sesión
```
Usuario: demo
Contraseña: demo123
```

### 2. Vista de Partidos (Timeline)

**Experiencia:**
- La app te lleva automáticamente a los partidos de HOY
- Scroll hacia abajo para ver partidos futuros
- Scroll hacia arriba para ver tus pronósticos pasados y puntos

**Ingresar Pronósticos:**
1. Click en **+** para aumentar goles
2. Click en **-** para disminuir goles
3. Click en "Guardar Pronóstico"
4. ¡Listo! El sistema guarda tu predicción

**Badge de Fecha:**
- 🟢 **Verde Lima** = Partidos de HOY
- 🟡 **Amarillo** = Partidos próximos
- ⚪ **Gris** = Partidos finalizados

### 3. Vista de Clasificación

Top 3 con medallas especiales:
- 🥇 **Oro** - Primer lugar
- 🥈 **Plata** - Segundo lugar
- 🥉 **Bronce** - Tercer lugar

### 4. Vista de Ligas

- Ver código de tu liga actual
- Copiar código al portapapeles
- Crear nuevas ligas
- Unirse a ligas con código

## 🎨 Paleta de Colores V2

### Colores Principales

```css
/* NUEVOS Colores del Mundial 2026 */
--mundial-lime: #BFFF00;      /* ⭐ Principal */
--mundial-yellow: #FFD600;     /* ⭐ Acentos */
--mundial-green: #00C853;      /* ⭐ Textos/Botones */
--mundial-pink: #FF1744;       /* Alertas/Bloqueado */
--mundial-coral: #FF6B6B;      /* Decrementar */
--mundial-orange: #FF9800;     /* Variante */
```

### Gradientes Actualizados

```css
/* Gradiente principal (botones, badges) */
background: linear-gradient(135deg, #BFFF00, #FFD600);

/* Gradiente texto (títulos) */
background: linear-gradient(135deg, #BFFF00, #FFD600, #FF6B6B);
```

## 📱 Componentes Nuevos

### MatchesTimeline
Reemplaza al DateNav + Grid de partidos

**Características:**
- Agrupa partidos por fecha automáticamente
- Auto-scroll a fecha actual
- Badges coloridos según estado
- Responsive (1 columna mobile, 2 desktop)

```tsx
<MatchesTimeline
  matches={SEED_MATCHES}
  predictions={predictions}
  onSavePrediction={handleSavePrediction}
/>
```

### MatchCard V2
Inputs mejorados con +/-

**Cambios:**
- Botones + arriba, - abajo
- Número grande en el centro
- Sin input de teclado
- Colores:
  - Botón +: Verde lima
  - Botón -: Rosa coral (solo si goles > 0)
  - Display: Fondo lime/yellow suave

```tsx
<MatchCard
  match={match}
  prediction={predictions[match.id]}
  onSavePrediction={handleSavePrediction}
/>
```

## 🔄 Cambios desde V1

| Característica | V1 | V2 |
|---------------|----|----|
| **Colores** | Morado + Azul | Verde Lima + Amarillo ✅ |
| **Navegador de Fechas** | Carrusel grande | Badges discretos ✅ |
| **Inputs de Goles** | Input numérico | Botones +/- ✅ |
| **Vista de Partidos** | Filtro manual | Timeline auto-scroll ✅ |
| **Espacio ocupado** | Mucho | Optimizado ✅ |

## 🚀 Flujo de Usuario

1. **Login** con demo/demo123
2. **Partidos de HOY** aparecen primero (auto-scroll)
3. **Click +/-** para ingresar goles
4. **Guardar** pronóstico (botón verde lima-amarillo)
5. **Scroll** para ver más fechas
6. **Ver Clasificación** para ver tu posición
7. **Ligas** para compartir código

## 💡 Tips de UX

### Ingresar Pronósticos
- Toca **+** varias veces para llegar al número deseado
- Si te pasas, usa **-** para retroceder
- El botón **-** se desactiva en 0 (no puedes tener goles negativos)

### Navegación de Fechas
- **NO necesitas** seleccionar fechas manualmente
- La app siempre te lleva a los partidos relevantes
- Scroll natural hacia arriba/abajo

### Partidos Bloqueados
- Badge rojo "Bloqueado"
- Inputs desactivados (gris)
- 30 minutos antes del partido

## 🎯 Datos Seed

Los 6 partidos de prueba:

```javascript
1. México vs Sudáfrica - 11 Jun 19:00
2. República de Corea vs República Checa - 12 Jun 02:00
3. Canadá vs Bosnia - 12 Jun 19:00
4. Estados Unidos vs Paraguay - 13 Jun 01:00
5. Australia vs Turquía - 13 Jun 04:00
6. Catar vs Suiza - 13 Jun 19:00
```

## 📦 Archivos Nuevos

```
src/app/components/
├── MatchesTimeline.tsx   # ⭐ NUEVO - Timeline vertical
├── MatchCard.tsx         # ✏️ REDISEÑADO - Inputs +/-
├── Login.tsx             # ✏️ Colores actualizados
├── Layout.tsx            # ✏️ Colores actualizados
├── Leaderboard.tsx       # ✏️ Colores actualizados
└── LeagueManager.tsx     # ✏️ Colores actualizados
```

## 🎨 Ejemplos de Código

### Botón con Gradiente Verde Lima
```tsx
<button
  style={{
    background: 'linear-gradient(135deg, var(--mundial-lime), var(--mundial-yellow))',
    color: '#1A1A1A'
  }}
>
  Guardar Pronóstico
</button>
```

### Badge de Fecha
```tsx
<div
  style={{
    background: 'var(--mundial-lime)',
    color: '#1A1A1A',
    borderColor: 'var(--mundial-green)'
  }}
>
  Hoy
</div>
```

### Texto con Gradiente
```tsx
<h1 className="text-gradient-mundial">
  Quiniela Mundial
</h1>
```

## 🐛 Solución de Problemas

### Los partidos no aparecen en orden
✅ El timeline ordena automáticamente por fecha

### No veo los partidos de hoy
✅ El auto-scroll te lleva ahí al cargar

### Los inputs no funcionan
✅ Verifica que no esté bloqueado (T-30)

### Los colores se ven diferentes
✅ Asegúrate de tener la V2 (verde lima, no morado)

## 🚀 Próximos Pasos

Para conectar con Supabase:
1. Ver `SUPABASE_SCHEMA.sql`
2. Ejecutar el schema
3. Conectar cliente Supabase
4. Reemplazar handlers mock con queries reales

## 🎉 ¡Disfruta!

La V2 está optimizada para una experiencia más fluida, con colores auténticos del Mundial y una UX mejorada para ingresar pronósticos.

**¡A jugar!** ⚽🏆
