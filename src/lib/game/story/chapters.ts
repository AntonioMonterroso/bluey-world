import type { Chapter } from "./types";
import { BARRIO, TEMPORADA } from "./side";

// Acto I: Abrir la puerta. Tono tierno y gracioso de barrio. {nombre} y {local} se reemplazan al jugar.

export const CHAPTERS: Chapter[] = [
  {
    n: 1, act: 1, title: "La llave y el polvo", blurb: "Heredas una pastelería vieja y le pones nombre.",
    reward: { xp: 40, coins: 30 },
    nodes: [
      { k: "say", who: "narrador", text: "Una llave oxidada. Una puerta que chirría como si tuviera opiniones. Y detrás, una nube de polvo con muchas ganas de estornudar." },
      { k: "say", who: "yo", text: "¡Achís! Bueno... Esto es lo que me dejaron. Una pastelería. Con telarañas. Muy decorada, eso sí." },
      { k: "say", who: "chilli", text: "¡Buenos días, vecina nueva! Soy Chilli, vivo en la casa de enfrente. Vi la puerta abierta y pensé: o hay una dueña nueva o un oso muy educado.", stage: ["chilli", "yo"] },
      { k: "say", who: "chilli", text: "Esta esquina fue la favorita de todo Dulce Villa. Hace años que nadie enciende el horno. Pero se puede arreglar. Siempre se puede arreglar.", stage: ["chilli", "yo"] },
      { k: "say", who: "chilli", text: "Antes de empezar: ¿cómo te llamo? ¿Y cómo se va a llamar este lugar?", stage: ["chilli", "yo"] },
      { k: "name" },
      { k: "say", who: "chilli", text: "{nombre}. Me gusta cómo suena. Y {local} suena a un lugar donde siempre huele rico.", stage: ["chilli", "yo"] },
      {
        k: "choice", who: "chilli", prompt: "Entonces, {nombre}, ¿qué hacemos primero?",
        options: [
          { label: "Limpiar el polvo", flag: ["primero", "limpiar"], reply: [
            { k: "say", who: "yo", text: "Me pongo el pañuelo y la escoba. El polvo no sabe con quién se metió." },
            { k: "say", who: "narrador", text: "Veinte minutos después, el polvo se había mudado a la casa de enfrente. Chilli no dijo nada, pero estornudó dos veces." },
          ] },
          { label: "Probar el horno", flag: ["primero", "horno"], reply: [
            { k: "say", who: "yo", text: "Voy directo al horno. Si funciona, lo demás es decoración." },
            { k: "say", who: "narrador", text: "El horno tosió, soltó una nubecita gris y se encendió. Chilli aplaudió. Fue una tos de buena suerte." },
          ] },
          { label: "Tomar un té con Chilli", flag: ["primero", "te"], reply: [
            { k: "say", who: "yo", text: "Primero un té. Las grandes decisiones se toman con algo caliente en las manos." },
            { k: "say", who: "chilli", text: "Esa es mi filosofía exacta. Voy por las tazas.", stage: ["chilli", "yo"] },
          ] },
        ],
      },
      { k: "say", who: "chilli", text: "Tu letrero ya dice {local}. Cuando termines de limpiar, esta esquina va a ser otra. Yo vengo a ayudarte mañana. Ah, y trae hambre.", stage: ["chilli", "yo"] },
      { k: "say", who: "narrador", text: "Y así, {local} abrió los ojos por primera vez en muchos años." },
    ],
  },
  {
    n: 2, act: 1, title: "El primer horno", blurb: "Cocina una receta de verdad y llena la vitrina.",
    reward: { xp: 50, coins: 35 },
    nodes: [
      { k: "say", who: "narrador", text: "La mañana siguiente, {local} olía a jabón. Pero una pastelería que huele a jabón, tarde o temprano, tiene que oler a otra cosa." },
      { k: "say", who: "bluey", text: "¡{nombre}! ¡Hola! Vinimos a ayudar. Yo soy Bluey, ella es Bingo, y las dos somos expertas en... todo.", stage: ["bluey", "bingo", "yo"] },
      { k: "say", who: "bingo", text: "Yo soy experta en abrir cajones y decir «ooooh».", stage: ["bluey", "bingo", "yo"] },
      { k: "say", who: "chilli", text: "Una pastelería sin pasteles es solo una sala con mostrador. Hoy toca encender el horno de verdad.", stage: ["chilli", "yo"] },
      { k: "say", who: "chilli", text: "Elige una receta tuya y cocínala con el Modo Cocinar. Lo que prepares se convierte en lo que vendes en la vitrina.", stage: ["chilli", "yo"] },
      { k: "task", id: "cook", text: "Cocina una receta de verdad con el Modo Cocinar.", href: "/cocinar", cta: "Ir a cocinar" },
      { k: "say", who: "bingo", text: "¡Huele a victoria con mantequilla! Voy a bailar para celebrar.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "bluey", text: "Bingo, estás bailando encima de la harina.", stage: ["bluey", "bingo", "yo"] },
      { k: "say", who: "bingo", text: "Es una harina muy cómoda.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "chilli", text: "Mira la vitrina: cada porción que cocinas queda guardada ahí para vender. Cocinar de verdad es lo que llena el mostrador, {nombre}.", stage: ["chilli", "yo"] },
    ],
  },
  {
    n: 3, act: 1, title: "Primer cliente", blurb: "Abre el local y atiende tu primer turno.",
    reward: { xp: 50, coins: 40 },
    nodes: [
      { k: "say", who: "narrador", text: "Ding, ding. La campanita de la puerta sonó por primera vez en años. Sonó un poco desafinada, pero con cariño." },
      { k: "say", who: "muffin", text: "¡Hola! ¿Es verdad que aquí venden cosas dulces? Mi mamá dijo que no podía pedir más de dos. Yo le dije que lo iba a pensar.", stage: ["muffin", "socks", "yo"] },
      { k: "say", who: "socks", text: "Yo vengo de acompañante. Pero si sobra algo, también opino.", stage: ["socks", "muffin", "yo"] },
      { k: "say", who: "chilli", text: "Un turno funciona así: llegan clientes con un pedido. Les sirves tocando el postre que piden y, cuando el pedido está completo, cobras.", stage: ["chilli", "yo"] },
      { k: "say", who: "chilli", text: "Si tardas mucho, se impacientan. Si atiendes rápido, dejan propina. Y si llega la hora pico, respira hondo.", stage: ["chilli", "yo"] },
      { k: "task", id: "shift", text: "Abre el local y atiende un turno completo.", href: "/jugar/venta", cta: "Abrir el local" },
      { k: "say", who: "muffin", text: "Estaba buenísimo. Le pongo cuatro estrellas. Cinco si me regalas una galleta para el camino.", stage: ["muffin", "socks", "yo"] },
      { k: "say", who: "socks", text: "Le pongo las mismas estrellas que Muffin. Sobre todo si hay galleta.", stage: ["socks", "muffin", "yo"] },
      { k: "say", who: "narrador", text: "Dulce Villa tiene buena memoria: ya empezaron a contar que {local} volvió." },
    ],
  },
  {
    n: 4, act: 1, title: "Las cuentas claras", blurb: "Anota un gasto y fija un tope de presupuesto.",
    reward: { xp: 60, coins: 40 },
    nodes: [
      { k: "say", who: "chilli", text: "{nombre}, vengo con una libreta y cara de seria. Es hora de hablar de dinero. No te asustes: el dinero es solo un amigo que a veces se hace el distraído.", stage: ["chilli", "yo"] },
      { k: "say", who: "yo", text: "Compré harina, mantequilla y huevos. Y un trapo nuevo. Y un lazo bonito que no tenía por qué comprar." },
      { k: "say", who: "chilli", text: "Por eso hay que anotarlo todo. Así sabes cuánto te cuesta cada postre y cuánto ganas de verdad.", stage: ["chilli", "yo"] },
      { k: "task", id: "expense", text: "Anota un gasto de tu cocina (el lazo cuenta).", href: "/dinero/movimientos", cta: "Anotar un gasto" },
      { k: "say", who: "chilli", text: "Muy bien. Segunda parte: un tope. Es una frase corta con números: «este mes no gasto más de tanto en ingredientes».", stage: ["chilli", "yo"] },
      { k: "task", id: "budget", text: "Fija un tope mensual para una categoría de gastos.", href: "/dinero/presupuesto", cta: "Fijar un tope" },
      {
        k: "choice", who: "chilli", prompt: "¿Cómo te sientes con tus cuentas?",
        options: [
          { label: "Con el control total", flag: ["cuentas", "control"], reply: [{ k: "say", who: "chilli", text: "Perfecto. Mañana me presentas el balance con corbata.", stage: ["chilli", "yo"] }] },
          { label: "Un poco mareada", flag: ["cuentas", "mareada"], reply: [{ k: "say", who: "chilli", text: "Es normal. Un gasto a la vez. El truco es no mirarlos todos juntos.", stage: ["chilli", "yo"] }] },
        ],
      },
      { k: "say", who: "narrador", text: "Chilli cerró la libreta con un clic satisfecho. {local} ya tiene cuentas claras. Lo demás es cuestión de hornear." },
    ],
  },
  {
    n: 5, act: 1, title: "Un amigo en el mostrador", blurb: "Contrata a tu primer empleado.",
    reward: { xp: 70, coins: 50 },
    nodes: [
      { k: "say", who: "narrador", text: "A mediodía, un olor a carbón con especias entró por la ventana. Alguien estaba asando algo en la acera." },
      { k: "say", who: "bandit", text: "¡Buenas! Soy Bandit. Vengo a ofrecer mis servicios y mi parrilla. Mis recetas son saladas, pero tengo un corazón dulce. ¿Eso cuenta?", stage: ["bandit", "yo"] },
      { k: "say", who: "yo", text: "Cuenta, pero primero tengo que ver cómo funciona el equipo." },
      { k: "say", who: "chilli", text: "Cada puesto ayuda distinto: caja, atención, repostería o decoración. Alguien a tu lado atiende más rápido, pero cobra un sueldito por turno.", stage: ["chilli", "bandit", "yo"] },
      { k: "say", who: "bandit", text: "Y si lo trabajas demasiado se cansa. Es lo que le pasa a un perro con la pelota.", stage: ["bandit", "yo"] },
      { k: "task", id: "hire", text: "Contrata a tu primer empleado en Equipo.", href: "/pasteleria/equipo", cta: "Armar el equipo" },
      {
        k: "choice", who: "bandit", prompt: "¿Y yo qué hago por aquí, jefa?",
        options: [
          { label: "Tú me haces la parrilla de los viernes", flag: ["bandit", "parrilla"], reply: [{ k: "say", who: "bandit", text: "Trato hecho. Los viernes huele a humo y a gloria.", stage: ["bandit", "yo"] }] },
          { label: "Tú atiendes con tu mejor sonrisa", flag: ["bandit", "sonrisa"], reply: [{ k: "say", who: "bandit", text: "Mi sonrisa es mi arma secreta. Y mis chistes de papá.", stage: ["bandit", "yo"] }] },
        ],
      },
      { k: "say", who: "mackenzie", text: "Perdón, ¿{local}? Traigo una carta urgente. Es de la inspectora de calidad. Dice «pronto nos vemos».", stage: ["mackenzie", "yo"] },
      { k: "say", who: "narrador", text: "Y así termina el primer día de {local} como equipo. Lo que viene después es otra historia. Pero esa será para el Acto II." },
    ],
  },
  // ---------------------------------------------------------------- ACTO II: Crecer
  {
    n: 6, act: 2, title: "La receta de la abuela", blurb: "Guarda una receta con tu secreto y una foto.",
    reward: { xp: 80, coins: 55 },
    nodes: [
      { k: "say", who: "narrador", text: "Limpiando el último cajón del mostrador, {nombre} encontró una tarjeta amarilla con una mancha de chocolate. Y una letra que parecía bailar." },
      { k: "say", who: "yo", text: "«Para el que se atreva: no digas el secreto, pero guárdalo bien». Ay, abuela. Siempre con misterio." },
      { k: "say", who: "chilli", text: "Todo buen postre tiene un secreto. Una pizca de algo, un truco, una cucharada que no se cuenta. Y ese secreto merece una foto: la receta se vuelve un recuerdo.", stage: ["chilli", "yo"] },
      { k: "say", who: "bandit", text: "En mi casa el secreto siempre es el carbón. Pero el tuyo seguro es mejor.", stage: ["bandit", "chilli", "yo"] },
      { k: "task", id: "secret", text: "Guarda una receta con tu «secreto» y una foto del resultado.", href: "/recetas/nueva", cta: "Escribir una receta" },
      {
        k: "choice", who: "chilli", prompt: "¿De dónde viene tu secreto?",
        options: [
          { label: "De la abuela", flag: ["secreto", "abuela"], reply: [{ k: "say", who: "chilli", text: "Entonces ya sabemos quién manda en esta cocina, aunque no esté.", stage: ["chilli", "yo"] }] },
          { label: "De mis propias pruebas", flag: ["secreto", "propio"], reply: [{ k: "say", who: "chilli", text: "Esos son los mejores: salen de un montón de intentos y un par de desastres.", stage: ["chilli", "yo"] }] },
          { label: "No lo digo, es secreto", flag: ["secreto", "callado"], reply: [{ k: "say", who: "bandit", text: "Respeto. Yo tampoco digo cuánto pimentón le pongo.", stage: ["bandit", "yo"] }] },
        ],
      },
      { k: "say", who: "narrador", text: "La tarjeta amarilla se quedó pegada al lado de la caja registradora. Con la mancha de chocolate y todo." },
    ],
  },
  {
    n: 7, act: 2, title: "La feria del barrio", blurb: "Decora el local para la feria.",
    reward: { xp: 80, coins: 60 },
    nodes: [
      { k: "say", who: "mackenzie", text: "¡Aviso, aviso! Este fin de semana es la feria de Dulce Villa. Todos los puestos van a estar decorados. Ni un puesto sin globos.", stage: ["mackenzie", "yo"] },
      { k: "say", who: "coco", text: "Y vengo yo, con mi boutique y mis opiniones. Esta pastelería necesita un poquito de glamour. Un poquito. Prometo que no exagero... mucho.", stage: ["coco", "yo"] },
      { k: "say", who: "yo", text: "Tengo adornos para el techo, para el mostrador, para la entrada y para las mesas. ¿Por dónde empiezo?" },
      { k: "say", who: "coco", text: "Por el techo. Todo el mundo mira hacia arriba cuando entra, aunque no lo admita. Luego el mostrador. Y no olvides la entrada: es tu sonrisa.", stage: ["coco", "yo"] },
      { k: "task", id: "decor", text: "Pon un adorno nuevo en tu local (antes de abrir, en el paso Decorar).", href: "/jugar/venta", cta: "Ir a decorar" },
      { k: "say", who: "coco", text: "Eso sí es un local con carácter. ¿Y tú? Hoy tu personaje también puede ir elegante. El vestuario está a tu disposición.", stage: ["coco", "yo"] },
      { k: "say", who: "mackenzie", text: "Los vecinos dicen que {local} es el puesto más bonito de la feria. Yo solo cuento lo que oigo. Y lo que oigo es: bonito.", stage: ["mackenzie", "yo"] },
    ],
  },
  {
    n: 8, act: 2, title: "El crítico misterioso", blurb: "Atiende un turno con visita del crítico.",
    reward: { xp: 90, coins: 65 },
    nodes: [
      { k: "say", who: "judo", text: "Buenos días. Soy Judo, inspectora de calidad. Vengo a decirle que hoy alguien muy importante podría visitar su local. No diré quién. Es confidencial.", stage: ["judo", "yo"] },
      { k: "say", who: "yo", text: "¿Cómo lo reconozco?" },
      { k: "say", who: "judo", text: "Lleva una libreta, un bigote que parece de mentira y una cara de «todo me parece regular». Si lo atiende bien y rápido, saldrá encantado.", stage: ["judo", "yo"] },
      { k: "say", who: "jean-luc", text: "Hola. Soy un cliente normal. Me gusta la repostería. No tengo ninguna libreta. Esto es solo una servilleta con muchas notas.", stage: ["jean-luc", "yo"] },
      { k: "say", who: "narrador", text: "Judo dio dos pasos atrás para no reírse. Jean-Luc ajustó su bigote, que se había despegado un poquito." },
      { k: "task", id: "critic", text: "Atiende un turno cuando venga el crítico (aparece en la fiesta de la semana).", href: "/jugar/venta", cta: "Abrir el local", skippable: "Esta semana no vino el crítico: seguir igual" },
      { k: "say", who: "jean-luc", text: "Siempre pido lo mismo: una porción de honestidad. Y hoy la encontré. Le pongo cinco estrellas y un bigote nuevo.", stage: ["jean-luc", "yo"] },
      { k: "say", who: "judo", text: "Oficialmente, {local} pasó la inspección. Extraoficialmente, quiero repetir la próxima semana.", stage: ["judo", "yo"] },
    ],
  },
  {
    n: 9, act: 2, title: "Precios que suben", blurb: "Actualiza un precio y mira cómo cambia el costo de tus recetas.",
    reward: { xp: 90, coins: 65 },
    nodes: [
      { k: "say", who: "mackenzie", text: "Reparto de insumos. Pero antes, una advertencia: la harina subió. Y la mantequilla subió. Y yo subí tres escalones para llegar hasta aquí. Todo sube.", stage: ["mackenzie", "yo"] },
      { k: "say", who: "chilli", text: "Cuando suben los precios, tus postres cuestan más de hacer. Si no lo anotas, ganas menos sin darte cuenta. Es el ladrón más callado del negocio.", stage: ["chilli", "yo"] },
      { k: "say", who: "chilli", text: "En Precios puedes poner lo que pagaste hoy. La app recalcula el costo de todas las recetas que usan ese producto, y te avisa de las alzas.", stage: ["chilli", "yo"] },
      { k: "task", id: "price", text: "Actualiza el precio de un producto en Precios.", href: "/mi-cocina/precios", cta: "Ir a Precios" },
      {
        k: "choice", who: "chilli", prompt: "Con el costo nuevo, ¿qué haces?",
        options: [
          { label: "Subo un poquito mis precios", flag: ["precios", "subir"], reply: [{ k: "say", who: "chilli", text: "Con calma y con razón. Los clientes que te quieren lo entienden.", stage: ["chilli", "yo"] }] },
          { label: "Busco un proveedor más barato", flag: ["precios", "buscar"], reply: [{ k: "say", who: "mackenzie", text: "Conozco tres. Uno de ellos me debe un favor. El favor es una bolsa de azúcar.", stage: ["mackenzie", "yo"] }] },
          { label: "Me lo como yo, por ahora", flag: ["precios", "asumir"], reply: [{ k: "say", who: "chilli", text: "Solo por ahora. Los dulces nunca pueden salir de tu bolsillo para siempre.", stage: ["chilli", "yo"] }] },
        ],
      },
      { k: "say", who: "narrador", text: "{nombre} cerró la libreta de precios con una sonrisa. Ahora sabía cuánto costaba cada cosa. Y eso, en un negocio, es casi un superpoder." },
    ],
  },
  {
    n: 10, act: 2, title: "Tarde de pedidos", blurb: "Entrega un pedido especial decorando una torta.",
    reward: { xp: 100, coins: 70 },
    nodes: [
      { k: "say", who: "muffin", text: "¡Necesito una torta para mi cumpleaños! Quiero crema menta y cerezas. Bueno, y fresas. Bueno, ya veremos.", stage: ["muffin", "socks", "yo"] },
      { k: "say", who: "socks", text: "Yo necesito una igual, pero con más de todo. Pero que se vea elegante.", stage: ["socks", "muffin", "yo"] },
      { k: "say", who: "yo", text: "Los pedidos especiales me llegan a la hora de decorar. Tengo que dejarlos como los pidieron." },
      { k: "say", who: "chilli", text: "Eso lo vimos en la práctica: el que más se parece al pedido, más paga. Una torta bonita es una torta bien escuchada.", stage: ["chilli", "yo"] },
      { k: "task", id: "special", text: "Decora y entrega un pedido especial (aparecen cuando tu local tiene buena fama).", href: "/jugar/venta", cta: "Ver pedidos de hoy", skippable: "Hoy no llegó ningún pedido: seguir igual" },
      { k: "say", who: "muffin", text: "¡Es EXACTAMENTE lo que pedí! Aunque no sabía qué había pedido hasta que la vi. Eso es talento.", stage: ["muffin", "socks", "yo"] },
      { k: "say", who: "socks", text: "Yo la quería más grande. Pero así está perfecta. Y alcanza para repetir.", stage: ["socks", "muffin", "yo"] },
    ],
  },
  // ---------------------------------------------------------------- ACTO III: La mejor del barrio
  {
    n: 11, act: 3, title: "La gran inauguración", blurb: "Mejora tu local y suma a otra persona al equipo.",
    reward: { xp: 110, coins: 80 },
    nodes: [
      { k: "say", who: "narrador", text: "Había pasado un mes. La campanita ya sonaba afinada. El polvo era un recuerdo lejano. Dulce Villa merecía una inauguración como Dios manda." },
      { k: "say", who: "chilli", text: "Todos van a venir. Hasta los que dijeron que no. Así que {local} tiene que estar impecable y con gente bien repartida.", stage: ["chilli", "bluey", "bingo", "yo"] },
      { k: "say", who: "bingo", text: "Yo prometo no bailar sobre la harina. Tal vez. Depende de la música.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "bluey", text: "Yo me encargo de las invitaciones. Tienen una bandera. Y una galleta dibujada.", stage: ["bluey", "bingo", "yo"] },
      { k: "task", id: "upgrade", text: "Compra una mejora para tu local (Mejoras).", href: "/pasteleria/mejoras", cta: "Ver mejoras" },
      { k: "task", id: "team2", text: "Suma a una segunda persona al equipo.", href: "/pasteleria/equipo", cta: "Armar el equipo" },
      { k: "say", who: "narrador", text: "Con la mejora en su lugar y dos manos más detrás del mostrador, {local} brillaba como un pastel recién glaseado." },
      { k: "say", who: "bandit", text: "Yo traje una parrilla portátil, un delantal con mi nombre y un chiste de cada mesa. Mi trabajo aquí es inflar el ánimo.", stage: ["bandit", "yo"], if: ["bandit", "sonrisa"] },
      { k: "say", who: "bandit", text: "Los viernes de parrilla ya son leyenda en Dulce Villa. Esta noche hago el especial de la inauguración.", stage: ["bandit", "yo"], if: ["bandit", "parrilla"] },
    ],
  },
  {
    n: 12, act: 3, title: "La estrella de Dulce Villa", blurb: "Reto final: tres minijuegos y reputación alta.",
    reward: { xp: 200, coins: 150 },
    nodes: [
      { k: "say", who: "judo", text: "Última inspección del año. Para ser la mejor de Dulce Villa no basta con una buena receta: hace falta un buen ojo, buena mano y buena memoria.", stage: ["judo", "yo"] },
      { k: "say", who: "judo", text: "Prueba tres minijuegos distintos en la Sala de juegos. Y mantén una reputación de {rep} estrellas o más en tu local.", stage: ["judo", "yo"] },
      { k: "task", id: "minis", text: "Juega tres minijuegos distintos de la Sala de juegos.", href: "/jugar/sala", cta: "Ir a la Sala de juegos" },
      { k: "task", id: "rep", text: "Mantén una reputación de {rep} estrellas o más en Dulce Co.", href: "/jugar/venta", cta: "Atender un turno" },
      { k: "say", who: "judo", text: "Hecho. Oficialmente, {local} es la mejor pastelería de Dulce Villa. Extraoficialmente, también es mi favorita.", stage: ["judo", "yo"] },
      { k: "say", who: "narrador", text: "Esa noche, Dulce Villa entera se pasó por {local}. Se oían risas, tazas y alguien que decía «cinco estrellas» con la boca llena." },
      { k: "say", who: "chilli", text: "{nombre}, mira esta esquina. Era un polvero con puerta. Y hoy es el lugar favorito de todo un barrio.", stage: ["chilli", "bluey", "bingo", "yo"] },
      // Epílogo personalizado (según tus decisiones y tu avance)
      { k: "say", who: "narrador", text: "Epílogo. Las cuentas finales de {local}: recetas cocinadas de verdad, {recetas}; turnos atendidos, {turnos}. Ni una cuenta se perdió." },
      { k: "say", who: "chilli", text: "Y recuerdo tu primer día: elegiste limpiar el polvo antes que nada. El polvo todavía te tiene miedo.", stage: ["chilli", "yo"], if: ["primero", "limpiar"] },
      { k: "say", who: "chilli", text: "Y recuerdo tu primer día: encendiste el horno antes que nada. Esa tos del horno trajo suerte.", stage: ["chilli", "yo"], if: ["primero", "horno"] },
      { k: "say", who: "chilli", text: "Y recuerdo tu primer día: té con la vecina antes que nada. Ahí empezó todo.", stage: ["chilli", "yo"], if: ["primero", "te"] },
      { k: "say", who: "narrador", text: "La tarjeta amarilla de la abuela seguía junto a la caja, con su mancha de chocolate. Su secreto estaba a salvo. Y el tuyo también.", if: ["secreto", "abuela"] },
      { k: "say", who: "narrador", text: "El secreto de {nombre} era suyo, hecho de intentos y desastres. Nadie más lo sabía. Así debe ser.", if: ["secreto", "propio"] },
      { k: "say", who: "narrador", text: "Nadie supo nunca el secreto de {local}. Y todos seguían intentando adivinarlo, que es otra forma de quererlo.", if: ["secreto", "callado"] },
      { k: "say", who: "narrador", text: "Los precios subían y bajaban, pero la libreta de {nombre} siempre estaba al día. Dulce Villa nunca vio una cuenta sin cerrar." },
      {
        k: "choice", who: "narrador", prompt: "Para terminar, ¿qué es lo que más te gusta de {local}?",
        options: [
          { label: "Los clientes que vuelven", flag: ["final", "clientes"], reply: [{ k: "say", who: "narrador", text: "Y los clientes siguieron volviendo, uno detrás de otro, como si la puerta tuviera un imán de azúcar." }] },
          { label: "Cocinar de verdad", flag: ["final", "cocinar"], reply: [{ k: "say", who: "narrador", text: "Y la cocina siguió oliendo a algo rico, cada tarde, como si el horno nunca quisiera descansar." }] },
          { label: "El equipo que armé", flag: ["final", "equipo"], reply: [{ k: "say", who: "narrador", text: "Y el equipo siguió riendo detrás del mostrador, como si cada día fuera un cumpleaños sin velas." }] },
        ],
      },
      { k: "say", who: "narrador", text: "Fin de «La Esquina de Dulce Villa». Pero {local} sigue abierta. Todos los días. Para {nombre}, para el barrio y para el próximo postre." },
    ],
  },
];

export const TOTAL_CHAPTERS = CHAPTERS.length;
export const ALL_CHAPTERS = [...CHAPTERS, ...BARRIO, ...TEMPORADA];
export { BARRIO, TEMPORADA };
export const chapterByN = (n: number) => ALL_CHAPTERS.find((c) => c.n === n);
