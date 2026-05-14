# 🗺️ MapTap Tracker

Webapp para registrar y comparar puntuaciones del desafío diario de [MapTap](https://www.maptap.gg) entre un grupo de amigos.

## Qué hace

- Cada jugador se identifica con su cuenta de Google (una sola vez)
- Pega el resultado del juego tal cual lo comparte en WhatsApp
- La app parsea el texto automáticamente y guarda el resultado en Google Sheets
- Dashboard con ranking de victorias, puntuación media, récords e historial

## Jugadores

Mewis · Gonzalo · Muñi · Arias · Moran

## Tecnología

- HTML/CSS/JS estático — sin frameworks, sin backend propio
- Google OAuth 2.0 para identificación
- Google Sheets API para almacenamiento y lectura de datos
- GitHub Pages para el hosting

## Estructura del repo

```
maptap-tracker/
├── index.html       # Webapp completa (entrada + dashboard + historial)
└── README.md
```

## Estructura de la Google Sheet

La sheet `datos` tiene las siguientes columnas:

| fecha | jugador | r1 | r2 | r3 | r4 | r5 | score | timestamp |
|---|---|---|---|---|---|---|---|---|
| 2026-05-14 | Moran | 100 | 99 | 100 | 95 | 99 | 981 | 2026-05-14T... |

## Setup inicial

### 1. Google Cloud — credenciales OAuth

1. Entra en [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (ej. `maptap-tracker`)
3. Activa la **Google Sheets API**: APIs y servicios → Biblioteca → busca "Google Sheets API" → Activar
4. Configura la pantalla de consentimiento OAuth: APIs y servicios → Pantalla de consentimiento → Externo → rellena nombre y email
5. Añade los emails de los jugadores como **usuarios de prueba**
6. Crea credenciales: APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth → Aplicación web
7. En **Orígenes de JavaScript autorizados** añade: `https://morann96.github.io`
8. En **URIs de redirección autorizados** añade: `https://morann96.github.io/maptap-tracker`
9. Guarda y copia el **Client ID**

### 2. Google Sheet

1. Crea una Google Sheet nueva
2. Renombra la hoja como `datos`
3. Añade esta fila de cabeceras en la fila 1:

```
fecha | jugador | r1 | r2 | r3 | r4 | r5 | score | timestamp
```

4. Copia el **ID de la sheet** desde la URL (la cadena entre `/d/` y `/edit`)

### 3. GitHub Pages

1. En el repo: Settings → Pages → Source: `main` branch → Save
2. La app quedará disponible en `https://morann96.github.io/maptap-tracker`

### 4. Configurar index.html

Abre `index.html` y actualiza estas dos constantes al principio del script:

```javascript
const CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com';
const SHEET_ID  = 'TU_SHEET_ID';
```

## Uso diario

1. Abrir `https://morann96.github.io/maptap-tracker`
2. La primera vez: identificarse con Google
3. Pegar el resultado del juego (el texto completo tal como aparece en MapTap)
4. Pulsar **Enviar resultado**

Formato esperado:

```
www.maptap.gg May 14
100🎯 99🎯 100🎯 95🏆 99🎯
Final score: 981
```

## Añadir un jugador nuevo

En `index.html`, localiza el objeto `PLAYER_MAP` y añade una entrada con el nombre (o parte del nombre/email) que usa ese jugador en su cuenta de Google:

```javascript
const PLAYER_MAP = {
  'moran':   'Moran',
  'gonzalo': 'Gonzalo',
  // añadir aquí
  'nuevojugador': 'NombreEnRanking',
};
```

Y añade sus colores en `PLAYER_COLORS`:

```javascript
const PLAYER_COLORS = {
  // ...
  'NombreEnRanking': { bg: '#1a2a3a', fg: '#60a5fa' },
};
```
