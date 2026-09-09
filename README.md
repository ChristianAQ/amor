# ❤ Llegamos tarde a la cita

Mini videojuego web de **pixel art 2D con desplazamiento lateral**, retro y de un solo
nivel, hecho como regalo. Christian y Melissa llegan tarde a su cita en un restaurante
de Madrid: hay que esquivar obstáculos y llegar **a tiempo**, atravesando nueve
escenarios que son nueve recuerdos de viaje.

**Egipto → Londres → Rumanía → Ecuador → México → Italia → París → Marruecos → Madrid**

Eliges a uno de los dos personajes y **el otro te acompaña siempre**: corre detrás de ti
e imita tus saltos.

---

## Cómo se juega
 
| | Saltar | Agacharse |
|---|---|---|
| **Móvil** | toca la **mitad derecha** de la pantalla (o el botón ▲) | toca la **mitad izquierda** (o el botón ▼) |
| **PC** | `ESPACIO`, `↑` o `W` | `↓` o `S` |

- Los obstáculos del **suelo** se saltan; los que **vuelan** (pájaros, globos, ropa
  tendida) se esquivan agachándose.
- Cada golpe cuesta **3 segundos**. Cada **corazón** que recoges suma **3 segundos**.
- Ganas si llegas a la casa de Madrid antes de que se acabe el tiempo.
- `M` silencia el sonido. `ENTER` reinicia al terminar.

---

## Publicar en GitHub Pages

El repositorio ya incluye el flujo de trabajo `.github/workflows/deploy-pages.yml`,
pero GitHub **no deja que una acción active Pages por primera vez** (hace falta un
permiso que el token automático no tiene). Es un único clic manual:

1. Ve a **Settings → Pages** del repositorio.
2. En **Source**, elige **GitHub Actions** y guarda.
3. Ve a **Actions → Desplegar en GitHub Pages** y pulsa **Re-run jobs**
   en la última ejecución (o haz cualquier push).

A partir de ahí, cada push a esta rama vuelve a publicar el juego solo.

El juego quedará publicado en:

```
https://christianaq.github.io/amor/
```

> Si prefieres no usar Actions, también funciona con **Source: Deploy from a branch**,
> eligiendo la rama y la carpeta `/ (root)`: el sitio es HTML/CSS/JS estático, sin
> compilación ni dependencias.

### Probarlo en local

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

---

## Personalizarlo

Todo está pensado para que puedas cambiarlo sin saber programar.

### 1. La cara y la ropa de los personajes

En **`assets/js/sprites.js`**, arriba del todo, está el bloque `LOOKS`. Cambia los
colores (en hexadecimal) para que se parezcan más a vosotros:

```js
christian: {
  palette: {
    h: '#2f2018', // pelo
    s: '#e7b088', // piel
    m: '#3b2a1f', // barba
    b: '#3f7cb4', // camiseta
    p: '#2f3446', // pantalón
    o: '#efefef'  // zapatillas
  }
}
```

Melissa tiene además `d` (vestido) y `D` (sombra del vestido).

Los dibujos también son editables: cada personaje es una rejilla de letras
(`C_TOP`, `M_TOP`, `C_LEGS`, …) donde `.` es transparente y cada letra es un color
de la paleta. Puedes cambiar píxeles a mano.

### 2. Los textos y los recuerdos

- La dedicatoria final y la dificultad están en `CONFIG`, al principio de
  **`assets/js/game.js`** (`TIME_LIMIT`, `HIT_PENALTY`, `HEART_BONUS`).
- La frase de cada país está en **`assets/js/scenes.js`**, en el campo `memory` de
  cada escena. Cámbialas por vuestros recuerdos reales.
- El texto grande de la pantalla de victoria está en `index.html`
  (`<p class="letter">`).

### 3. La dificultad

En `CONFIG` (`assets/js/game.js`):

```js
TIME_LIMIT: 95,   // más segundos = más fácil
HIT_PENALTY: 3,   // menos penalización = más fácil
HEART_BONUS: 3
```

---

## Estructura

```
index.html                 página y pantallas de menú
assets/css/style.css       estilos, controles táctiles, adaptación a móvil
assets/js/sprites.js       pixel art de Christian y Melissa (editable)
assets/js/scenes.js        los 9 escenarios y todos los obstáculos
assets/js/game.js          motor: física, colisiones, tiempo, HUD, sonido
.github/workflows/         despliegue automático en GitHub Pages
```

Sin librerías, sin dependencias, sin build: HTML, CSS y JavaScript puro sobre un
`<canvas>` de 480×270 píxeles escalado con `image-rendering: pixelated`.
