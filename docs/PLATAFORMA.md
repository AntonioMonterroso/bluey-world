# Plataforma: publicar, cuenta y sincronización

Estado: **publicada en GitHub Pages** → https://antoniomonterroso.github.io/bluey-world/ (se vuelve a publicar sola con cada `git push` a `main`). Lo de Cloudflare de abajo queda como alternativa. Lo que falta son pasos que solo puede hacer el dueño de las cuentas (crear la cuenta, revocar el token, subir el sitio). Esta guía los deja en orden.

## Qué ya está preparado

- `npm run build:static` genera la carpeta `out/` (sitio estático de 36 páginas, probado: navegación, sin internet y manifest).
- `npm run serve:static` la sirve en `http://localhost:3105` para probarla antes de subirla.
- `public/_headers` (Cloudflare Pages y Netlify) y `netlify.toml` ya están.
- El modo sin internet y la instalación como app funcionan en el sitio estático.
- La app sigue funcionando igual con `npm run dev` / `npm run build` (la publicación estática solo se activa con `NEXT_OUTPUT=export`).

## Paso 1. Publicar (Cloudflare Pages, recomendado)

1. Crea una cuenta gratis en Cloudflare y entra a **Workers y Pages → Crear → Pages**.
2. Dos caminos:
   - **Subir directo (más fácil):** en la carpeta `bluey-world` corre `npm run build:static` y arrastra la carpeta `out/` a "Cargar activos".
   - **Desde Git:** conecta el repositorio, carpeta raíz `bluey-world`, comando `npm run build:static`, carpeta de salida `out`.
3. Cloudflare te da un enlace `https://algo.pages.dev`. Ese es el enlace que se abre en el celular.
4. Los datos de Supabase (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) deben estar al construir. Si subes `out/` directo, se toman de `bluey-world/.env.local` al correr el comando. Si construye Cloudflare, agrégalos en **Variables de entorno**. La clave anon es pública por diseño; la seguridad la dan las reglas de la base (RLS).
5. En Netlify es igual: arrastra `out/` o conecta el repositorio (ya lee `netlify.toml`).

> Nunca pongas la clave `service_role` ni el token `sbp_` en variables de la app ni en el repositorio.

## Cuentas: solo tú las creas

La app pide entrar al abrirla. No tiene botón de «crear cuenta»: las cuentas las creas tú en Supabase.

1. Supabase → tu proyecto → **Authentication → Users → Add user → Create new user**.
2. **Email:** el usuario que quieras + `@bluey-world.app` (ejemplo: `ana@bluey-world.app`). En la app, esa persona escribe solo `ana`.
3. **Password:** mínimo 6 caracteres. Marca **Auto Confirm User**.
4. Después apaga los registros: **Authentication → Sign In / Providers → Allow new users to sign up** (desactivado). Las cuentas que crees tú siguen funcionando.

Cada cuenta ve solo sus datos (lo protege la base con RLS). Al tocar **Salir** en Ajustes, la app sube lo pendiente y borra los datos de ese dispositivo, para que la siguiente persona empiece limpia.

## Paso 2. Crear tu cuenta y probar la sincronización

(Lo haces tú: yo no puedo crear cuentas ni escribir contraseñas.)

1. Abre el enlace publicado, ve a **Inicio** (la tarjeta de cuenta) o a `/login`, elige usuario y contraseña y pulsa **Crear cuenta**.
2. Usa la app un momento: crea una receta, anota un gasto. Abajo a la izquierda debe decir "Al día".
3. En Supabase (Table Editor → tabla `records`) deben aparecer filas con tu `user_id`.
4. **Prueba con dos dispositivos:** entra con el mismo usuario en otro navegador o en el celular. Tus datos deben aparecer solos. Cambia algo en uno y comprueba que llega al otro.
5. **Prueba sin internet:** apaga el wifi, crea algo, vuelve a prenderlo: debe subir solo.

Si algo no baja o no sube, anota qué pasó y dímelo: la sincronización está construida pero nunca se probó con una cuenta real.

## Paso 3. Cerrar la puerta (hazlo después del Paso 2)

1. **Revocar el token `sbp_`** que pegaste en el chat: Supabase → tu avatar → **Account → Access Tokens** → revocar el token. Si quieres hacer más cosas con la API de gestión, se crea uno nuevo y no se pega en ningún chat.
2. **Desactivar nuevos registros:** proyecto → **Authentication → Sign In / Providers** → apagar **Allow new users to sign up**. Así nadie más puede crear cuentas; tu cuenta sigue funcionando.
3. Opcional: **Authentication → Rate limits** para limitar intentos.

## Paso 4. Instalar en el celular y probar de verdad

- **iPhone (Safari):** abrir el enlace → Compartir → **Agregar a pantalla de inicio**. Las notificaciones y la alarma exigen iOS 16.4 o más y abrir la app desde el ícono instalado.
- **Android (Chrome):** menú ⋮ → **Instalar app**.

Lista de pruebas (marca cada una):

- [ ] Abre desde el ícono, sin barra del navegador.
- [ ] Modo avión: abre y funcionan recetas, temporizadores, Sala de juegos y el día en Bluey Co.
- [ ] Temporizador con alarma: suena, vibra y avisa con la pantalla bloqueada (en iPhone, la limitación conocida es que sin la app abierta puede retrasarse).
- [ ] Sonidos del juego (interruptor en Jugar).
- [ ] Se ven bien Equipo, Mejoras, Vender y la Historia.
- [ ] Sincroniza con el otro dispositivo.

## Paso 5. Marca

"Bluey" y los personajes son de terceros: para uso privado y regalo está bien. Si el enlace se comparte en público, cambiar nombres en `src/lib/brand.ts` y `public/manifest.webmanifest`, y reemplazar las imágenes de `public/personajes/`.

## Alternativas de publicación (por si cambias de idea)

- **GitHub Pages:** la app quedaría en una subcarpeta y habría que adaptar rutas, el service worker y la instalación.
- **Tu servidor en casa:** sirve la carpeta `out/` (o `npm run serve:static`), pero necesita HTTPS y acceso desde fuera; sin HTTPS no se instala como app ni funciona la alarma.
