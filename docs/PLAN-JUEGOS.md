# Plan: los dos juegos de Bluey World

Estado: **aprobado el 22 de octubre de 2026. Fases A, B y C hechas (cimientos, venta 2.0 en /jugar/venta, sala de juegos en /jugar/sala); Útil bloque 1 hecho (/mi-cocina); pulido móvil hecho; pendientes viejos hechos (metas de ahorro, importar recetas, escala por molde). Fase D hecha (Modo Historia, Acto I: /jugar/historia, capítulos 1 a 5). Fase E hecha (Historia completa: 12 capítulos, 3 actos, final con epílogo según tus decisiones). Fase F hecha (pulido: 34 rutas revisadas en celular, sin internet probado con el servidor apagado, tope diario de la sala bajado a 30 monedas / 40 XP). Plataforma preparada (publicación estática probada, guía en docs/PLATAFORMA.md); faltan los pasos del dueño: publicar en Cloudflare Pages, crear la cuenta y probar la sincronización, revocar el token sbp_ y cerrar registros, probar en celular real.**
Decisiones: rehacer el modo venta, vista de lado, tono tierno y gracioso, orden mezclado. Pendiente que me cuentes los detalles personales para la historia, si los pedidos reales cuentan como metas y qué minijuegos agregar o quitar (no hacen falta hasta las fases C y D).
Fecha: 22 de octubre de 2026.

## 1. Lo que ya existe (para no repetirlo)

| Ya hecho | Dónde |
|---|---|
| Recetario, Modo Cocinar, temporizadores con alarma, videos de YouTube | `/recetas`, `/cocinar`, `/temporizadores` |
| Presupuesto, precios del súper, costo de recetas, lista de compras | `/presupuesto` |
| XP, niveles, monedas, Bingo semanal, misiones, insignias, tienda | `/bingo`, `/logros`, `/tienda` |
| Vestuario de 22 personajes con probador y looks | `/vestuario` |
| Bluey Co.: local decorable, menú, **turno de venta de 75 s**, equipo, mejoras, eventos, ganancias | `/pasteleria/*` |

Importante: **ya hay un modo venta básico** (clientes que piden, servir, cobrar). Lo que propongo es **rehacerlo en grande**
(preparar → decorar → vender → cierre, con clientes animados y pedidos especiales), no hacer un segundo juego igual.

## 2. Visión en una frase

> Cocinas de verdad → llenas tu vitrina → decoras y preparas tu pastelería → atiendes clientes → creces. Y una historia
> te va llevando de la mano por todo eso, con minijuegos en el camino.

Regla de oro (se mantiene): **lo que vendes y lo que avanzas sale de lo que haces de verdad** (cocinar, anotar gastos,
guardar recetas). El juego nunca reemplaza a la cocina; la hace más divertida.

## 3. Juego 1: Modo Venta 2.0, "Un día en Bluey Co."

Una pantalla de juego a pantalla completa (`/jugar/venta`) con 4 momentos:

### 3.1 Preparar (la mañana)
- **Pizarra del día:** eliges qué postres van en la vitrina (hasta 6) y sus precios.
- **Tu stock real:** lo que cocinaste de verdad. Para postres inventados, **hornear** con un minijuego de tiempo (sacar del horno en el punto dorado): la calidad (★) sube el precio.
- **Pedidos especiales del día:** clientes que pidieron una torta personalizada (ver Decorar).
- **Equipo y clima/evento:** quién trabaja hoy, qué fiesta hay, qué postres se van a pedir más.

### 3.2 Decorar (que se vea hermoso)
- **Decorar el local:** hoy eliges una pieza por ranura; pasa a **colocar piezas en lugares** (vitrina, mesas, entrada, ventana) tocando un lugar y eligiendo la pieza.
- **Atractivo del local (0 a 100):** suma decoración, plantas, luces, orden, mesas y la fiesta del momento. **Más atractivo = más clientes y más propina.**
- **Decorar pedidos especiales:** el minijuego "Decora la torta" (sección 5). La calidad cambia lo que pagan.

### 3.3 Vender (el turno)
- **Clientes animados** que entran por la puerta, hacen fila, piden con globo de pensamiento y se sientan o se llevan su postre.
- **Mesas:** si tienes mesas, el cliente se sienta, come más tiempo y deja más propina.
- **Clientes con personalidad:** cada uno tiene un postre favorito, paciencia propia y manera de dar propina.
- **Frecuentes:** quienes quedan contentos vuelven y piden su favorito. Álbum de clientes frecuentes.
- **Combos:** café + postre paga extra.
- **Horas pico:** el turno se divide en mañana, mediodía y tarde con oleadas de clientes. Turno de 2 a 3 minutos (hoy es 75 s).
- **Equipo, crítico y fiestas:** todo lo que ya existe se queda.
- Efectos: campanita de puerta, caja registradora, monedas que saltan, luz que cambia durante el día. Todo sintetizado en el navegador (sin archivos).

### 3.4 Cierre
- Ventas, propinas, ganancia, **reseñas** escritas según lo que pasó ("La torta de zanahoria estaba esponjosa, pero esperé mucho").
- Subida de reputación, clientes frecuentes nuevos, avance de metas de eventos y de la historia.
- Consejo para mañana ("Se acaban las galletas: cocina más").

### 3.5 Qué se reutiliza y qué es nuevo
- Se reutiliza: stock desde recetas cocinadas, menú, equipo, mejoras, eventos, ganancias, escena, vestuario, tienda.
- Nuevo: fases de preparar/decorar/cerrar, clientes animados, mesas, frecuentes, pedidos especiales, atractivo, reseñas, sonidos.
- `/pasteleria/*` queda como la **administración** (menú, equipo, mejoras, eventos, ganancias). `/pasteleria/vender` se reemplaza por el nuevo flujo.

## 4. Juego 2: Modo Historia, "La Esquina de Dulce Villa"

**Historia original** (no copia ningún episodio): heredas una pastelería vieja y empolvada en la esquina de Dulce Villa y la
vuelves la favorita del barrio. Tu personaje es el protagonista y todo se dice **con tu nombre**. Los personajes que ya
tienes son los vecinos y amigos (los papeles son una propuesta; los puedes cambiar):

| Personaje | Papel propuesto |
|---|---|
| Chilli | La vecina que te enseña a organizar el negocio |
| Bandit | El amigo parrillero que "compite" con sus recetas saladas |
| Bluey y Bingo | Ayudantes alegres que inventan juegos en la pastelería |
| Muffin y Socks | Clientitas fieles, con pedidos especiales |
| Mackenzie | El repartidor puntual |
| Judo | La inspectora de calidad |
| Coco | La dueña de la boutique de ropa (conecta con el vestuario) |
| Lucky, Winton, Buddy... | Clientes frecuentes y empleados futuros |

### Estructura: 3 actos, 12 capítulos
Cada capítulo dura unos 5 a 8 minutos, con diálogo, una o dos **tareas de la vida real** y a veces un minijuego.

**Acto I. Abrir la puerta**
1. La llave y el polvo: tu nombre, tu personaje, el nombre del letrero.
2. El primer horno: **cocina una receta de verdad** y llena la vitrina.
3. Primer cliente: tutorial del turno de venta.
4. Las cuentas claras: **anota un gasto** y fija un tope.
5. Un amigo en el mostrador: **contrata a tu primer empleado**.

**Acto II. Crecer**
6. La receta de la abuela: **guarda una receta con tu secreto** y foto.
7. La feria del barrio: decora el local para el evento.
8. El crítico misterioso: turno con visita del crítico.
9. Precios que suben: **actualiza un precio** y mira cómo cambia el costo de tus recetas.
10. Tarde de pedidos: pedidos especiales y el minijuego de decorar tortas.

**Acto III. La mejor del barrio**
11. La gran inauguración: equipo, mejoras y decoración a tope.
12. La estrella de Dulce Villa: reto final (3 minijuegos seguidos + reputación alta) y final con **epílogo personalizado**.

Después: **capítulos de temporada** (Navidad, Halloween...) ligados a los eventos que ya existen.

### Cómo funciona por dentro
- Estilo **novela visual**: fondo (tu local decorado o escenas), personajes con globo de diálogo, texto que aparece letra por letra, toque para seguir, botón para saltar. Con tu ropa puesta.
- Decisiones con 2 o 3 opciones que cambian diálogos y pequeños premios (no hay finales rotos).
- Las tareas de la vida real **se marcan solas** mirando tus datos (igual que el Bingo): no hay que declararlas.
- Los capítulos son **datos** (archivos de texto), no código: se pueden corregir o agregar sin tocar el juego.
- Todo se guarda y funciona **sin internet**.
- Accesible: letra grande, velocidad de texto, "saltar", sin depender del color ni del sonido.

## 5. Minijuegos (sala de juegos y dentro de los otros dos)

| Minijuego | Cómo se juega | Dónde aparece |
|---|---|---|
| **Decora la torta** | Pides base, color y adornos; los colocas en la torta y se compara con el pedido | Pedidos especiales, historia cap. 10 y 12 |
| **Ordena los pasos** | Pones en orden los pasos de **tus propias recetas** | Historia, sala de juegos |
| **Memoria de ingredientes** | Parejas con ingredientes de tus recetas | Sala de juegos |
| **Horno perfecto** | Detienes la barra en el punto dorado | Preparar postres inventados |
| **Adivina el postre** | Pistas de ingredientes de tus recetas | Sala de juegos |

Premios con **tope diario** para que jugar no pague más que cocinar de verdad.

## 6. Cómo se conectan los juegos y la app

```
Cocinar de verdad ─► stock de la vitrina ─► Modo Venta ─► monedas y XP ─┐
        │                                      ▲                         ├► tienda, vestuario,
        └► tareas de la Historia ──────────────┴─── Historia ◄──────────┘   decoración, equipo
```
- Una sola cartera (monedas y XP) y un solo registro de premios, como hoy.
- La Historia **te enseña la app**: cada capítulo te lleva a usar una función real.

## 7. Arquitectura técnica

- **Mismo stack** (Next.js, Dexie, Supabase, SVG/CSS y `motion`). **Sin motor de juegos pesado**: se mantiene accesible, ligero y funciona sin internet.
- **Lógica pura y probada con simulaciones** (como el motor de ventas y de eventos): `src/lib/game/venta2/`, `story/`, `minigames/`.
- **Rutas:** `/jugar` (portada con las tres opciones), `/jugar/venta`, `/jugar/historia`, `/jugar/minijuegos?juego=...`.
- **Tablas nuevas** (viajan a Supabase como lo demás): `story_progress`, `regulars` (clientes frecuentes), `special_orders`, `minigame_scores`, `shop_layout` (lugares de decoración).
- **Sonido:** sintetizado en el navegador; si quieres música, necesito que me pases archivos con permiso de uso.
- **Pruebas:** simulaciones con números en cada módulo y recorridos en el navegador, como hasta ahora.

## 8. Hoja de ruta (cada fase termina en algo que puedes jugar)

| Fase | Qué entrega | Se puede jugar |
|---|---|---|
| **A. Cimientos** (HECHA) | Portada `/jugar`, 6 tipos de cliente con personalidad, clientes frecuentes y álbum, reseñas, sonidos con interruptor, clientes animados y luz del día en la escena | Portada, turno con clientes animados, álbum |
| **B. Modo Venta 2.0** | Preparar → Decorar → Vender → Cierre, mesas, atractivo, reseñas, pedidos especiales | Un día completo |
| **C. Minijuegos** | Decora la torta, Ordena pasos, Memoria, Horno perfecto, Adivina el postre | Sala de juegos |
| **D. Historia, Acto I** | Motor de novela visual + capítulos 1 a 5 | Primeras 5 capítulos |
| **E. Historia, Actos II y III** | Capítulos 6 a 12 y final | Historia completa |
| **F. Pulido** | Probar en celular y sin internet, balance, accesibilidad, sonido | Todo junto |

## 9. Pendientes que NO se olvidan

### La parte útil de la app (todavía sin hacer)
1. **Pedidos de clientes reales:** libreta con fecha de entrega, anticipo, estado, ganancia y recordatorios.
2. **Metas de ahorro** del presupuesto.
3. **Despensa:** qué tienes en casa, caducidades y "qué puedo cocinar hoy".
4. **Diario de postres:** galería y línea de tiempo (ya se guardan los datos, falta la pantalla).
5. **Plan semanal y calendario** con recordatorios.
6. **Herramientas:** conversor de medidas, calculadora de moldes, sustitutos de ingredientes, glosario.
7. **Videoteca de YouTube:** listas, etiquetas, "ver después", marcadores de minuto, picture-in-picture.
8. **Inspiración:** tableros con fotos y enlaces.
9. **Respaldo y compartir:** exportar e importar todo, tarjeta bonita de una receta, importar recetas desde texto o enlace.
10. **Escalar recetas por tamaño de molde.**

### Cosas del juego que quedaron a medias
11. **Bingo bailando** con un GIF o WebM tuyo (hoy es una animación de rebote).
12. Imágenes de **Muffin, Rusty e Indy en baja resolución** (si tienes versiones más grandes, las cambio).
13. **Lentes y ropa en personajes que miran de lado** (ajustes finos por personaje).
14. Empleados con ropa propia y **sucursales** (ideas del plan original).

### Pendiente del usuario (aplazado el 2026-10-28)
- **Detalles personales para la historia:** nombre real de la pastelería, apodos, postre favorito, bromas de familia, personas reales, cosas que evitar, trato (tú o vos). Cuando los dé: reescribir `src/lib/game/story/chapters.ts` y repasar la historia completa.

### Vestuario: más personalización (HECHO el 2026-10-28)
- Colores de cada prenda (paleta por prenda).
- Mover y ajustar prendas (subir, bajar, agrandar, girar) por personaje.
- Más ranuras y más prendas.
- Looks y clóset: más looks con nombre, favoritos, look del día, vestir al equipo de Bluey Co.

### Plataforma y calidad (nunca se probó de verdad)
15. **Crear tu cuenta en `/login` y probar la sincronización con Supabase** de punta a punta (todo está construido, pero nunca se probó con una cuenta real).
16. **Revocar el token `sbp_`** que pegaste en el chat y **desactivar el registro de cuentas nuevas** después de crear la tuya.
17. **Probar en tu celular:** instalar como app, alarma con pantalla bloqueada, notificaciones, sonido real y que Equipo, Mejoras y Vender se vean bien.
18. **Dónde va a vivir la app** (publicarla): GitHub Pages u otro. Pendiente de decidir.
19. Revisión de accesibilidad y rendimiento de toda la app.
20. **Marca:** "Bluey" es marca de terceros; para uso privado está bien. Si algún día se publica, hay que cambiar nombres e imágenes (todo está en un solo archivo para eso).

### Cómo se mezclan con los juegos (orden recomendado)
Fase A → Fase B → **Útil, bloque 1 (pedidos reales, diario, despensa)** → Fase C → Fase D → **Útil, bloque 2 (plan semanal, herramientas, videoteca, respaldo)** → Fase E → Fase F → **Plataforma (15 a 20)**.
Así la historia puede enseñar funciones que ya existen y tú vas usando la app de verdad mientras crece el juego.

## 10. Riesgos y límites (sin adornos)

- **Es un proyecto grande**: son varias fases largas; por eso cada una termina en algo jugable y probado.
- **Arte:** los personajes son imágenes fijas. Se animan con movimientos (rebotes, caminar deslizándose, ropa), pero no tienen expresiones ni ciclos de caminata. Si consigues más poses o GIFs, el juego se verá mucho mejor.
- **Equilibrio:** si el juego da demasiado, cocinar de verdad pierde sentido. Por eso hay topes diarios y el stock sale de recetas reales.
- **La historia necesita tu voz:** puedo escribir todo, pero será mejor si me cuentas detalles personales (apodos, el nombre real de su pastelería, postres favoritos, bromas de familia).
- **Música:** solo efectos sintetizados salvo que me pases archivos con derechos.
- Estimaciones de tiempo: no las doy porque dependen de cuánto quieras revisar en cada fase.

## 11. Decisiones que necesito de ti

1. ¿Apruebas **rehacer el modo venta** (en vez de dejar el actual y agregar otro)?
2. ¿Vista **de lado** como la pastelería actual (recomendado, mantiene tu decoración y vestuario) o desde arriba?
3. **Tono de la historia:** ¿tierno y gracioso de barrio (propuesto), aventura o comedia?
4. **Detalles personales** para la historia (nombre real de su pastelería, apodos, postre favorito, algo que la haga reír).
5. **Orden:** ¿mezclado como en la sección 9 (recomendado), primero todos los juegos, o primero lo útil?
6. ¿Quieres que los **pedidos de clientes reales** también aparezcan como metas dentro del juego?
7. ¿Hay algún **minijuego** que quieras agregar o quitar?
