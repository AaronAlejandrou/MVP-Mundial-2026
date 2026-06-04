Actúa como un Desarrollador Full-Stack, Arquitecto de Software y Diseñador UI/UX Senior. Tu objetivo es generar el código completo para el MVP funcional de una "Polla / Quiniela Deportiva" web para el Mundial 2026.

STACK TECNOLÓGICO:
- Frontend: Next.js (App Router), React, TailwindCSS, TypeScript, Lucide Icons.
- Backend/BBDD: Supabase (PostgreSQL, Autenticación, WebSockets para Realtime).
- Despliegue objetivo: Vercel.

1. SISTEMA DE DISEÑO (UI/UX)
El estilo visual debe ser "Bento Box" combinado con "Minimalismo Fintech" (similar a la UI de Apple Card o neobancos), pero con los colores oficiales del Mundial 2026.
- Tema: Dark Mode estricto. Fondo base: Azul Marino Profundo (#0A0E17). 
- Tarjetas (Bento Box): Fondo Gris Azulado Translúcido (#141A29), border-radius de 24px a 32px, sutil efecto backdrop-blur (glassmorphism).
- Acentos (Branding Mundial 26): Morado Eléctrico, Verde Neón, Fucsia y Cian. Úsalos como gradientes muy suaves (10%-15% opacidad) en los fondos de las tarjetas de partidos y en botones primarios.
- Tipografía: 'Plus Jakarta Sans' o 'Montserrat' para UI general. 'Teko' o 'Bebas Neue' (gigante, en negrita) estrictamente para los inputs de marcadores y puntajes totales.
- Banderas: Utiliza SVGs circulares (puedes simularlos con íconos o placeholders redondos de colores por ahora, pero la estructura debe ser redonda y limpia).
- Layout: Mobile-first. En móvil es una sola columna. En desktop, usar CSS Grid para un Dashboard expansivo.

2. REGLAS DE NEGOCIO Y LÓGICA CORE
- Zona Horaria: La base de datos almacena en UTC. El frontend renderiza TODO obligatoriamente en UTC-5 (America/Lima).
- Sistema de Puntos (Evaluación en cascada por partido):
  * 5 puntos: Resultado exacto (Ej: Pronóstico 2-1, termina 2-1).
  * 4 puntos: Acierta ganador + goles exactos de 1 solo equipo.
  * 2 puntos: Acierta ganador o acierta un empate con marcador distinto.
  * 2 puntos: Acierta solo los goles de 1 equipo (sin acertar ganador).
  * 0 puntos: Todo incorrecto.
- Regla T-30 (Bloqueo Dinámico): Un usuario puede editar su predicción ilimitadas veces. Sin embargo, cuando faltan <= 30 minutos para el 'fecha_hora' del partido, los inputs numéricos se deshabilitan, el botón desaparece y se muestra un ícono de candado rojo.
- Ligas Privadas: Los usuarios se unen a "Ligas" mediante un 'codigo_invitacion' alfanumérico (ej: MUND-X7B9). El ranking se filtra por el 'league_id' del usuario.

3. ESQUEMA DE BASE DE DATOS (Supabase SQL)
Genera el código SQL para crear estas tablas (incluye RLS policies básicas):
- users: id (uuid), nombre, avatar_url, created_at.
- leagues: id (uuid), nombre, codigo_invitacion (unique), admin_id (fk users).
- league_members: user_id (fk), league_id (fk), puntaje_total (int, default 0).
- matches: id (int), equipo_a (varchar), equipo_b (varchar), fecha_hora (timestamptz), goles_a (int, null), goles_b (int, null), estado (varchar: 'pendiente', 'en_juego', 'finalizado').
- predictions: id (uuid), user_id (fk), match_id (fk), goles_a (int), goles_b (int), puntos_obtenidos (int, default 0). Unique constraint (user_id, match_id).

4. COMPONENTES A DESARROLLAR (MVP UI)
Genera el código para los siguientes componentes y vistas:
A. Layout Principal: Navbar superior e inferior (mobile) minimalista.
B. Dashboard / Leaderboard: Tabla de posiciones de la liga actual. Lista de usuarios, avatar, puntaje total.
C. Selector de Fechas (Date Nav): Carrusel horizontal de píldoras (Ej: "Jue 11 Jun"). Controla qué partidos se muestran abajo.
D. Match Card (Componente interactivo): 
   - Contenedor Bento Box.
   - Header: Hora (UTC-5), Estadio y Grupo/Fase.
   - Body: Bandera A - Input Number (Goles A) - Separador - Input Number (Goles B) - Bandera B. Los inputs deben ser grandes y fáciles de tocar.
   - Footer/Acción: Botón "Guardar". Animación de estado (Cargando -> Guardado con check verde). Si está bloqueado (Regla T-30), mostrar candado.

5. DATOS SEMILLA (Seed Data)
Crea un script o array de configuración inicial en TypeScript (seed data) para poblar la tabla 'matches' con los primeros 6 partidos del fixture oficial para probar la UI. Usa esta información (asume año 2026):
[
  { id: 1, equipo_a: "México", equipo_b: "Sudáfrica", fecha_hora: "2026-06-11T19:00:00Z", estadio: "Estadio Ciudad de México", grupo: "A" },
  { id: 2, equipo_a: "República de Corea", equipo_b: "República Checa", fecha_hora: "2026-06-12T02:00:00Z", estadio: "Estadio Guadalajara", grupo: "A" },
  { id: 3, equipo_a: "Canadá", equipo_b: "Bosnia", fecha_hora: "2026-06-12T19:00:00Z", estadio: "Toronto Stadium", grupo: "B" },
  { id: 4, equipo_a: "Estados Unidos", equipo_b: "Paraguay", fecha_hora: "2026-06-13T01:00:00Z", estadio: "Los Angeles Stadium", grupo: "D" },
  { id: 5, equipo_a: "Australia", equipo_b: "Turquía", fecha_hora: "2026-06-13T04:00:00Z", estadio: "BC Place Vancouver", grupo: "D" },
  { id: 6, equipo_a: "Catar", equipo_b: "Suiza", fecha_hora: "2026-06-13T19:00:00Z", estadio: "San Francisco Bay Area Stadium", grupo: "B" }
]
Nota: Las horas en el array JSON están en UTC para que el frontend haga la conversión a UTC-5 correctamente según las reglas estipuladas.

Instrucción final: Comienza generando el archivo de esquema SQL de Supabase y luego pasa a los componentes de React/Tailwind para el Dashboard y la Match Card. El código debe ser limpio, modular y listo para copiar y pegar.