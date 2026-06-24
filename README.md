# El Código del amor — Biankita

Página web romántica personalizada para Biankita.

## Qué incluye

- Contador desde el **16 de mayo de 2026, 3:00 a.m.**
- Carta con texto que aparece poco a poco
- Corazón con rompecabezas (dos fotos en `assets/`)
- Fotos polaroid progresivas (`1.jpg` … `5.jpg`)
- Doodles salpicados (`a.png` … `k.png`)
- Animación final con corazones y cuadro rascable

## Ver en tu computadora

Opción 1 — doble clic en `index.html` (funciona, pero un servidor local es mejor).

Opción 2 — servidor local (recomendado):

```powershell
cd C:\Users\diegova\Desktop\Biankita
npx serve .
```

Abre la URL que muestra (por ejemplo `http://localhost:3000`).

---

## Publicar como página web (gratis)

El sitio es **100 % estático**: solo HTML, CSS, JS e imágenes. No necesita base de datos ni servidor especial.

### Opción A — GitHub Pages (recomendada)

1. Crea una cuenta en [GitHub](https://github.com) si no tienes.
2. Crea un repositorio **nuevo** (por ejemplo `biankita-amor`). Puede ser público.
3. Sube **toda** la carpeta `Biankita` al repo. Desde PowerShell:

```powershell
cd C:\Users\diegova\Desktop\Biankita

# Si aún no es tu repo, quita el remoto viejo y pon el tuyo:
# git remote remove origin
# git remote add origin https://github.com/TU_USUARIO/biankita-amor.git

git add .
git commit -m "Publicar El Código del amor para Biankita"
git branch -M main
git push -u origin main
```

4. En GitHub: **Settings → Pages**.
5. En **Build and deployment → Source**, elige **Deploy from a branch**.
6. Branch: `main`, carpeta: **/ (root)** → **Save**.
7. En 1–3 minutos tendrás una URL como:

   `https://TU_USUARIO.github.io/biankita-amor/`

8. Comparte ese enlace con Biankita (WhatsApp, QR, etc.).

> El archivo `.nojekyll` ya está incluido para que GitHub Pages sirva bien todas las imágenes.

### Opción B — Netlify Drop (sin Git)

1. Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastra la carpeta `Biankita` completa.
3. Netlify te da un enlace al instante (por ejemplo `https://algo-random.netlify.app`).
4. Opcional: en Netlify puedes cambiar el nombre del sitio en **Site settings → Domain management**.

### Opción C — Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New → Project** e importa el repo de GitHub, o sube la carpeta.
3. No hace falta configurar build: deja todo vacío y publica.
4. Obtienes una URL tipo `https://biankita-amor.vercel.app`.

---

## Archivos importantes

| Archivo / carpeta | Para qué sirve |
|-------------------|----------------|
| `index.html` | Página principal |
| `css/` | Estilos |
| `js/` | Animaciones, contador, corazón |
| `assets/foto1.jpg`, `assets/foto2.jpg` | Fotos del rompecabezas |
| `1.jpg` … `5.jpg` | Polaroids del mural |
| `a.png` … `k.png` | Doodles del fondo |

## Personalizar

- **Fecha del contador:** en `index.html`, busca `var together = new Date(2026, 4, 16, 3, 0, 0, 0);`  
  (mes 4 = mayo, porque enero es 0)
- **Texto de la carta:** dentro de `#code` en `index.html`
- **Fotos del corazón:** reemplaza `assets/foto1.jpg` y `assets/foto2.jpg`
- **Polaroids:** reemplaza `1.jpg` … `5.jpg`

## Compartir

Cuando tengas la URL publicada, puedes generar un QR gratis en [qr-code-generator.com](https://www.qr-code-generator.com/) pegando tu enlace.

---

Hecho con cariño por Diego.
