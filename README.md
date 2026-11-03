# Portafolio web de Samuel Arias

Portafolio dedicado a mostrar páginas web desarrolladas por Samuel Arias, publicado con **GitHub Pages**. Cada proyecto es una landing de un negocio ficticio, escrita a mano con **HTML, CSS y JavaScript sin frameworks ni dependencias de build**.

- Sitio en vivo: https://sagazarias.github.io/
- Demo de Café El Portón: https://sagazarias.github.io/cafe-el-porton/

## Proyectos incluidos

### 1. Taller Cadencia (`/index.html`)

Landing de un taller de bicicletas de ruta y gravel en Chapinero, Bogotá. Se sirve en la raíz del sitio, en un solo archivo con el CSS y el JS embebidos.

| Característica | Implementación |
|---|---|
| Calculadora de desarrollo | Sliders de plato, piñón y cadencia. Calcula la relación, el desarrollo (m) y la velocidad (km/h) con una rueda 700×28c (2,136 m). La fórmula se verifica con `console.assert`. |
| Transmisión animada | Engranajes SVG generados por código (dientes trapezoidales, araña de 5 brazos en el plato, tamaño proporcional al número de dientes). Giran con la **Web Animations API**, a una velocidad que sigue la cadencia y la relación. Tienen botón de pausa y empiezan pausados si el usuario tiene `prefers-reduced-motion`. |
| Secciones | Hero, tarifas de servicios, proceso, opiniones y reserva. |
| Formulario de reserva | Validación en el cliente: celular colombiano (`/^(57)?3\d{9}$/`), fecha desde hoy y sin domingos. Usa `aria-invalid` y mensajes de error accesibles. No hay backend: la confirmación se muestra en la misma página. |
| Diseño | Tipografías de Google Fonts (Archivo, Instrument Sans, JetBrains Mono), modo oscuro con `prefers-color-scheme`, *breakpoints* responsive, ajustes para `hover`/`pointer` y animaciones de entrada con `@keyframes`. |

### 2. Café El Portón (`/cafe-el-porton/`)

Landing de un café de una sola finca en Salento, Quindío. Está dividida en `index.html`, `styles.css` y `main.js`, más las imágenes y el video de `assets/`.

| Característica | Implementación |
|---|---|
| Secciones | Inicio, La casa, La carta (con navegación interna), Salento, Del árbol a la taza, Horarios y ubicación, y Reservar. |
| Estado abierto/cerrado en vivo | Calcula la hora de Colombia con `Intl.DateTimeFormat` (`America/Bogota`) y muestra "Abierto ahora · cerramos en…" o la siguiente apertura. Al cargar, la lógica se comprueba con una serie de casos de prueba. |
| Video | `<video>` WebM con poster y `preload="none"`. Se reproduce solo cuando está en pantalla (`IntersectionObserver`) y no se reproduce con movimiento reducido. |
| Animaciones | Revelado al hacer scroll (`data-reveal` + `IntersectionObserver`), desactivado con `prefers-reduced-motion`. |
| Galería | Un marco en arco en el que cambia la foto de Salento al tocarla, con su pie de foto. No rota sola. |
| Mapa | SVG inline del centro de Salento, con `<title>` accesible. |
| Reserva | Formulario en forma de "cupón". Las horas disponibles se generan según el horario del día elegido (los martes está cerrado) y la hora actual. Al enviar, arma el mensaje y abre `api.whatsapp.com/send` sin número fijo. |
| Diseño | Escala tipográfica fluida con `clamp()`, variables CSS, menú móvil (se cierra con Escape o con un clic fuera) y 6 media queries. |

## Cómo se construyó

- HTML semántico (`section` con `aria-labelledby`, `nav` con `aria-label`), CSS propio y JavaScript *vanilla* en IIFE. No hay frameworks, bundlers ni `package.json`.
- Mejora progresiva: Café El Portón agrega la clase `js` al `<html>` antes de pintar, y las funciones que necesitan `IntersectionObserver` comprueban primero que exista.
- Pequeñas autoverificaciones con `console.assert` en la lógica que no es trivial (cálculo de velocidad, validador de teléfono, horario).
- Despliegue: GitHub Pages sirve la rama del repositorio tal cual.

## Verlo localmente

No hace falta instalar nada. Clona el repositorio y abre `index.html`, o, mejor, levanta un servidor estático para que las rutas y el video se comporten igual que en producción:

```bash
git clone https://github.com/SagazArias/sagazarias.github.io.git
cd sagazarias.github.io
python -m http.server 8000
# http://localhost:8000/  y  http://localhost:8000/cafe-el-porton/
```

## Estructura

```
├── index.html              # Taller Cadencia (HTML + CSS + JS en un archivo)
└── cafe-el-porton/
    ├── index.html
    ├── styles.css
    ├── main.js
    └── assets/             # fotos, video .webm y poster, menu/
```

## Añadir un proyecto nuevo

1. Crea una carpeta con nombre en *kebab-case*, por ejemplo `mi-proyecto/`, con su `index.html` y sus recursos dentro. Usa rutas relativas (`assets/...`) para que funcione bajo `https://sagazarias.github.io/mi-proyecto/`.
2. Enlázalo desde un proyecto existente, como se hizo con Café El Portón en el pie de página de `index.html`:
   ```html
   <p>Otro proyecto del portafolio: <a href="mi-proyecto/">Mi proyecto</a></p>
   ```
3. Haz commit y push a la rama publicada. GitHub Pages lo sirve en uno o dos minutos.
4. Añade el proyecto a la sección "Proyectos incluidos" de este README.
