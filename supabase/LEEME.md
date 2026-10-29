# Conectar Bluey World con Supabase

1. En supabase.com crea un proyecto **nuevo** (no uses el de otras apps).
2. Authentication → Sign In / Providers → Email: deja activado el correo, pero **desactiva "Confirm email"**.
3. SQL Editor → pega y ejecuta todo `supabase/schema.sql` (se puede correr varias veces sin problema).
4. Project Settings → API: copia **Project URL** y la clave **anon public**.
5. En `bluey-world/` copia `.env.example` a `.env.local` y pega ambos valores.
6. Reinicia el servidor, abre `/login` y crea la cuenta (usuario + contraseña).
7. Cuando exista la cuenta, en Authentication → Sign In / Providers desactiva **"Allow new users to sign up"** para que nadie más pueda registrarse.

Nunca pegues la clave `service_role` en la app.
