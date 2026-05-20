import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, BookOpen, Heart, Share2, 
  Calendar, Sun, CheckCircle2, Lightbulb, Settings, 
  BrainCircuit, Edit3, Check, Users, Save, X, Volume2, 
  Square, Trash2, CheckSquare, RefreshCw, List, Plus,
  GripVertical, Eye, Home, User, LogOut, LogIn, Mail, Lock, BookMarked, History, Database, UploadCloud
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot 
} from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- BASE DE DATOS BÍBLICA ---
const LIBROS_BIBLIA = [
  { nombre: "Génesis", capitulos: 50 }, { nombre: "Éxodo", capitulos: 40 }, { nombre: "Levítico", capitulos: 27 }, { nombre: "Números", capitulos: 36 }, { nombre: "Deuteronomio", capitulos: 34 },
  { nombre: "Josué", capitulos: 24 }, { nombre: "Jueces", capitulos: 21 }, { nombre: "Rut", capitulos: 4 }, { nombre: "1 Samuel", capitulos: 31 }, { nombre: "2 Samuel", capitulos: 24 },
  { nombre: "1 Reyes", capitulos: 22 }, { nombre: "2 Reyes", capitulos: 25 }, { nombre: "1 Crónicas", capitulos: 29 }, { nombre: "2 Crónicas", capitulos: 36 }, { nombre: "Esdras", capitulos: 10 },
  { nombre: "Nehemías", capitulos: 13 }, { nombre: "Ester", capitulos: 10 }, { nombre: "Job", capitulos: 42 }, { nombre: "Salmos", capitulos: 150 }, { nombre: "Proverbios", capitulos: 31 },
  { nombre: "Eclesiastés", capitulos: 12 }, { nombre: "Cantares", capitulos: 8 }, { nombre: "Isaías", capitulos: 66 }, { nombre: "Jeremías", capitulos: 52 }, { nombre: "Lamentaciones", capitulos: 5 },
  { nombre: "Ezequiel", capitulos: 48 }, { nombre: "Daniel", capitulos: 12 }, { nombre: "Oseas", capitulos: 14 }, { nombre: "Joel", capitulos: 3 }, { nombre: "Amós", capitulos: 9 },
  { nombre: "Abdías", capitulos: 1 }, { nombre: "Jonás", capitulos: 4 }, { nombre: "Miqueas", capitulos: 7 }, { nombre: "Nahúm", capitulos: 3 }, { nombre: "Habacuc", capitulos: 3 },
  { nombre: "Sofonías", capitulos: 3 }, { nombre: "Hageo", capitulos: 2 }, { nombre: "Zacarías", capitulos: 14 }, { nombre: "Malaquías", capitulos: 4 },
  { nombre: "Mateo", capitulos: 28 }, { nombre: "Marcos", capitulos: 16 }, { nombre: "Lucas", capitulos: 24 }, { nombre: "Juan", capitulos: 21 }, { nombre: "Hechos", capitulos: 28 },
  { nombre: "Romanos", capitulos: 16 }, { nombre: "1 Corintios", capitulos: 16 }, { nombre: "2 Corintios", capitulos: 13 }, { nombre: "Gálatas", capitulos: 6 }, { nombre: "Efesios", capitulos: 6 },
  { nombre: "Filipenses", capitulos: 4 }, { nombre: "Colosenses", capitulos: 4 }, { nombre: "1 Tesalonicenses", capitulos: 5 }, { nombre: "2 Tesalonicenses", capitulos: 3 }, { nombre: "1 Timoteo", capitulos: 6 },
  { nombre: "2 Timoteo", capitulos: 4 }, { nombre: "Tito", capitulos: 3 }, { nombre: "Filemón", capitulos: 1 }, { nombre: "Hebreos", capitulos: 13 }, { nombre: "Santiago", capitulos: 5 },
  { nombre: "1 Pedro", capitulos: 5 }, { nombre: "2 Pedro", capitulos: 3 }, { nombre: "1 Juan", capitulos: 5 }, { nombre: "2 Juan", capitulos: 1 }, { nombre: "3 Juan", capitulos: 1 },
  { nombre: "Judas", capitulos: 1 }, { nombre: "Apocalipsis", capitulos: 22 }
];

// --- MOTOR DE BASE DE DATOS LOCAL PARA LA BIBLIA (IndexedDB) ---
const DB_NAME = 'DevocionalLocalDB';
const STORE_NAME = 'bibleStore';

const openDB = () => new Promise((resolve, reject) => {
  try {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  } catch (err) {
    reject(err);
  }
});

const saveBibleLocally = async (data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, 'bible_json');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const loadBibleLocally = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('bible_json');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const deleteBibleLocally = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete('bible_json');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

// Normaliza diferentes formatos de Biblias JSON que se encuentran en internet
const normalizeBibleJSON = (raw) => {
  let normalized = {};
  if (Array.isArray(raw)) {
    raw.forEach(book => {
       let bookName = book.name || book.book || book.libro;
       if (!bookName) return;
       normalized[bookName] = {};
       if (Array.isArray(book.chapters)) {
         book.chapters.forEach((chapter, cIdx) => {
            normalized[bookName][cIdx + 1] = {};
            if (Array.isArray(chapter)) {
              chapter.forEach((verse, vIdx) => {
                 normalized[bookName][cIdx + 1][vIdx + 1] = verse;
              });
            } else if (typeof chapter === 'object') {
              normalized[bookName][cIdx + 1] = chapter;
            }
         });
       }
    });
  } else {
    normalized = raw; 
  }
  return normalized;
};

// Extractor Inteligente de Versículos
const extractVerses = (bible, book, chapter, verseRange) => {
  if (!bible || !bible[book] || !bible[book][chapter]) return null;
  const chapterData = bible[book][chapter];
  
  let versesToGet = [];
  if (verseRange.includes('-')) {
    const [start, end] = verseRange.split('-').map(Number);
    for(let i = start; i <= end; i++) versesToGet.push(i);
  } else {
    versesToGet.push(Number(verseRange));
  }

  let text = [];
  for (const v of versesToGet) {
    if (chapterData[v]) text.push(`[v${v}] ${chapterData[v]}`);
    else if (chapterData[v.toString()]) text.push(`[v${v}] ${chapterData[v.toString()]}`);
  }
  
  return text.length > 0 ? text.join(' ') : null;
};

const OPCIONES_ENFASIS = [
  "Aplicación práctica y ética cristiana diaria",
  "Profundidad exegética y teológica (Estudio de palabras)",
  "Consuelo, gracia y sanidad emocional",
  "Formación del carácter de Cristo y discipulado",
  "Liderazgo servicial y misión de la iglesia"
];

const TEMAS_SUGERIDOS = [
  "El Perdón Radical", "Venciendo la Ansiedad", "Identidad en Cristo", 
  "La Gracia Transformadora", "Finanzas a la Luz de la Biblia"
];

const HISTORIAS_COMPLETAS = [
  "Durante la Segunda Guerra Mundial, Corrie ten Boom y su familia arriesgaron sus vidas para esconder a refugiados. Eventualmente fueron descubiertos y enviados a un campo de concentración, donde su hermana Betsie murió. Años después del fin de la guerra, Corrie estaba predicando sobre el perdón en una iglesia en Alemania. Al terminar, un hombre se acercó a ella. Era uno de los guardias más crueles de aquel campo. Él extendió su mano y le pidió perdón. La teoría del amor al enemigo tuvo que convertirse en ese instante en una realidad dolorosa pero liberadora. Ella oró pidiendo fuerzas, tomó su mano y sintió cómo el poder sanador de Dios fluía a través de ella.",
  "Cuentan que el águila sabe cuándo se acerca una tormenta mucho antes de que empiece. En lugar de esconderse, vuela a un punto alto y espera los vientos. Cuando la tormenta golpea con furia, el águila usa esas mismas ráfagas para elevarse por encima de las nubes oscuras, planeando en la tranquilidad del cielo superior. No escapa de la tormenta, simplemente usa su fuerza para subir más alto. Así mismo, las pruebas no vienen para destruirnos, sino para enseñarnos a volar sobre las circunstancias sosteniéndonos en las corrientes de fe.",
  "En el siglo XIX, un maestro platero explicó cómo refinaba la plata. Dijo que debía sostener la pieza en el centro del fuego, donde las llamas eran más calientes, para quemar todas las impurezas. El visitante le preguntó: '¿Y cómo sabe usted cuándo la plata ya está completamente purificada?'. El platero sonrió, lo miró y le dijo: 'Es muy sencillo. Sé que el proceso ha terminado cuando me asomo al crisol y puedo ver mi propia imagen reflejada perfectamente en ella'.",
  "El bambú japonés es una planta fascinante que desafía la paciencia. Durante los primeros cinco años tras plantar la semilla y regarla a diario, no se ve absolutamente nada en la superficie. Todo el crecimiento ocurre bajo tierra, donde se desarrolla un masivo y complejo sistema de raíces. Sin embargo, al llegar el quinto año, el bambú brota y crece más de 20 metros en solo seis semanas. A veces, parece que nuestras oraciones no tienen respuesta y que estamos estancados, pero el proceso invisible está construyendo raíces profundas para sostener nuestro futuro.",
  "Un famoso escultor del renacimiento estaba trabajando arduamente golpeando un enorme y tosco bloque de mármol. Un niño pequeño que pasaba por allí se detuvo, lo observó durante un largo rato y le preguntó intrigado qué estaba haciendo. 'Hay un hermoso y feroz león atrapado dentro de esta piedra', respondió el artista sin dejar de cincelar, 'y mi trabajo es simplemente quitar todo lo que no es león'. De manera similar, los procesos difíciles de la vida a menudo son el cincel que quita de nosotros todo lo que nos estorba.",
  "En la antigua Roma, los arquitectos diseñaban los arcos usando una piedra clave llamada 'dovela'. Esta piedra central no estaba unida con cemento; simplemente se colocaba en la cima del arco. Era la inmensa presión de las demás piedras empujando contra ella lo que mantenía todo el puente en pie. Paradójicamente, sin esa presión constante, la estructura colapsaría. De la misma manera, la presión en nuestra vida no siempre viene para aplastarnos, sino para mantener firme la estructura de nuestro carácter.",
  "Un barco anclado en medio de una tormenta feroz no intenta luchar contra las olas. El capitán sabe que los motores no pueden vencer al océano. Su única esperanza es soltar el ancla pesada hasta que se enganche profundamente en la roca del lecho marino. Mientras el barco es sacudido de lado a lado en la superficie, debajo, en la quietud profunda, hay un agarre inquebrantable. La fe no nos promete un mar en calma, pero sí nos garantiza un ancla que no cederá sin importar qué tan violento sea el viento de arriba.",
  "Un botánico notó que los árboles plantados en biósferas de cristal perfectas crecían muy rápido, pero al llegar a cierta altura se desplomaban inexplicablemente. Descubrió que al no haber viento dentro del domo, los árboles no desarrollaban madera de reacción, una corteza especial que fortalece el tronco. Sin la resistencia del viento, no tenían la fuerza para sostener su propio peso. Las adversidades que a menudo le pedimos a Dios que nos quite son exactamente el viento que nos da la fuerza para sostener nuestro futuro.",
  "En Japón, existe una antigua técnica llamada Kintsugi. Cuando un tazón de cerámica valioso se rompe, en lugar de desecharlo, el artesano une los pedazos usando resina mezclada con oro puro. El resultado no es un tazón que esconde sus grietas, sino uno que las resalta brillantemente, volviéndose mucho más valioso y hermoso que antes de romperse. Dios es nuestro artesano divino; Él no nos desecha cuando fallamos, sino que usa el oro de Su gracia para redimir nuestras fracturas.",
  "Durante las largas y oscuras noches de invierno, un vigía de un faro solitario tiene una sola tarea: mantener la luz encendida. No puede calmar el océano ni desviar los barcos; solo puede asegurarse de que el aceite siga fluyendo hacia la lámpara. A menudo nos desgastamos intentando controlar las grandes crisis a nuestro alrededor, cuando nuestro único mandato real es mantener nuestra luz encendida, asegurándonos de estar diariamente conectados a la fuente inagotable del Espíritu."
];

const titulosInspiradores = [
  "El poder de soltar: Cuando perdonar parece imposible",
  "Alas en la tormenta: Usando la adversidad a tu favor",
  "El crisol del carácter: Descubriendo tu valor en el fuego",
  "Raíces invisibles: El propósito oculto en la espera",
  "La obra maestra: Dejando que Dios quite lo que sobra",
  "Soportando el peso: El valor de la presión",
  "Un ancla firme en la tempestad",
  "La fuerza del viento: Creciendo en resistencia",
  "Belleza en las grietas: La gracia restauradora",
  "Manteniendo la luz en la oscuridad"
];

const exegesisBase = [
    `Cuando leemos las Escrituras bajo esta luz, comprendemos que los mandatos bíblicos nunca fueron diseñados para ser meras sugerencias morales. Para los primeros cristianos, aplicar este principio del perdón era una cuestión de supervivencia espiritual frente a un imperio que los oprimía y marginaba constantemente. En la cultura grecorromana del primer siglo, el honor se defendía con sangre y la venganza era vista como un derecho inalienable. Sin embargo, el evangelio introdujo una subversión escandalosa: la victoria absoluta a través del perdón y la entrega. El autor bíblico no les escribía desde una torre de marfil aislada, sino desde la misma trinchera del sufrimiento.`,
    `Los destinatarios originales de las epístolas conocían íntimamente el implacable azote de la tormenta. Dispersos, perseguidos y muchas veces despojados de sus bienes, estos primeros creyentes necesitaban desesperadamente una teología del sufrimiento que fuera más allá del simple consuelo emocional momentáneo. La instrucción apostólica fue contundente: no se sorprendan del fuego de la prueba, abrácenlo. Para la iglesia primitiva, la adversidad de ninguna manera era una señal del abandono de Dios, sino el gimnasio mismo donde su fe era forjada y demostrada públicamente.`,
    `Esta vívida imagen metalúrgica del crisol captura a la perfección la esencia del texto sagrado que meditamos hoy. En el siglo primero, el fuego purificador no era una abstracción teológica distante; representaba el rechazo social visceral, la confiscación de bienes y, en numerosos casos documentados, el martirio físico. Cuando los autores inspirados hablaban del crisol, su objetivo principal era recordarle a una comunidad asustada que el fuego no estaba siendo avivado por un verdugo ciego, sino por un Padre inmensamente amoroso y soberano.`,
    `El mundo antiguo, profundamente agrario y dependiente de la tierra, comprendía a la perfección el lenguaje de las estaciones, las siembras tediosas y las cosechas lentas. Cuando las Escrituras exhortaban a los creyentes a tener paciencia, apelaban directamente a esta realidad ineludible de la naturaleza que observaban a diario. Los primeros cristianos, enfrentando persecución sistémica y anhelando el regreso inminente de Cristo, necesitaban arraigar su esperanza en la fidelidad de un Dios que simplemente no se somete a nuestros calendarios de urgencia.`,
    `Esta cautivadora metáfora del escultor resuena de manera contundente con la enseñanza bíblica sobre la santificación del creyente. En una cultura grecorromana que estaba patológicamente obsesionada con la perfección estética externa y adoraba estatuas de deidades de mármol pulido, el cristianismo presentó un paradigma radicalmente opuesto: el verdadero y más grande arte de Dios se realiza en el interior oscuro del ser humano. Los primeros discípulos entendieron que, aunque habían sido declarados justos por la gracia, el proceso diario implicaba someterse al cincel del Espíritu Santo.`,
    `Para los lectores del primer siglo, familiarizados con la impresionante arquitectura e ingeniería del Imperio Romano, la idea de la presión y la estructura era clara. El apóstol no les escribía para prometerles una vida sin fricciones; les revelaba que Cristo era la piedra angular de su fe. Entendían que la presión de la persecución los estaba obligando a apoyarse más firmemente en su Salvador, logrando que la Iglesia no colapsara, sino que se mantuviera sólida frente a la hostilidad pagana.`,
    `En un mar Mediterráneo conocido por sus naufragios repentinos, la audiencia original comprendía el terror de las olas. Cuando los escritores sagrados hablaban de la 'esperanza como ancla del alma', usaban un lenguaje vívido y visceral. No se les invitaba a ignorar el sufrimiento o fingir que el agua estaba en calma. Se les enseñaba teológicamente a lanzar su confianza detrás del velo, hacia Cristo mismo, garantizando que su salvación eterna no dependería de la fragilidad de su propia embarcación terrenal.`,
    `A diferencia de las filosofías estoicas de la época, que buscaban la apatía y la evasión del dolor, el camino bíblico enseñó a los creyentes a nutrirse en la dificultad. Así como un árbol necesita el embate del clima para fortalecerse, la Iglesia primitiva entendió que el viento de la aflicción era el mecanismo diseñado por Dios para madurarlos. No oraban para que cesara la oposición, sino que pedían denuedo para predicar y crecer en medio de ella, sabiendo que sin prueba no había profundidad.`,
    `En medio de una sociedad que desechaba lo débil, lo esclavo y lo roto, el Evangelio llegó como una revolución de restauración. El pasaje de hoy les recordaba a aquellos primeros santos que sus cicatrices no los descalificaban para el Reino. De hecho, el autor sagrado exalta la gracia de un Dios que escoge lo vil y menospreciado para avergonzar a los sabios. En la economía divina, las grietas del pecado, una vez redimidas, se convertían en los conductos perfectos para que la gloria de Cristo brillara con mayor intensidad.`,
    `La constante referencia bíblica a ser la 'luz del mundo' era más que un ideal poético; era un mandato estratégico. En un Imperio oscurecido por la idolatría y la brutalidad, los primeros discípulos fueron llamados a funcionar como faros. El texto original les exhortaba a no permitir que el aceite del Espíritu Santo se agotara en sus lámparas. Su tarea principal no era derrocar a Roma con espadas, sino brillar con una ética y un amor tan puros que, eventualmente, la oscuridad tendría que retroceder.`
];

const aplicacionBase = [
    `Al aterrizar esta dura demanda bíblica en nuestro contexto actual, el desafío nos golpea con la misma intensidad original. Vivimos inmersos en una era de cancelación, donde las ofensas se archivan meticulosamente y el orgullo disfrazado de justicia aplaude el resentimiento. Pero la gracia nos llama, sin excusas, a un estándar radicalmente distinto. Perdonar hoy no significa minimizar el daño real que te hicieron ni excusar el abuso, sino liberar al deudor de tu propia cárcel emocional para entregarlo al único Juez justo.`,
    `En la actualidad, nuestra cultura nos ha condicionado desde pequeños a buscar la comodidad por encima de la formación del carácter. Cuando la enfermedad, la crisis financiera o el conflicto relacional inevitablemente golpean a nuestra puerta, nuestro instinto es rogarle a Dios que nos rescate de inmediato. Sin embargo, la madurez espiritual nos invita a cambiar el tono de nuestra oración: en lugar de exigir una salida fácil, debemos clamar por la resistencia inquebrantable del águila.`,
    `Al trasladar este robusto principio a nuestro agitado siglo XXI, nos topamos frente a frente con nuestras propias llamas modernas. Las temporadas prolongadas de dolor, las oraciones que parecen rebotar en el techo y los sueños rotos actúan como ese fuego refinador. Nuestro mayor desafío espiritual de hoy no es tratar de escapar del proceso a toda costa, sino rendirnos completamente a él, permitiendo que nuestras impurezas caigan al fondo y el oro brille.`,
    `Hoy en día, habitamos una sociedad crónicamente adicta a lo instantáneo. Exigimos respuestas a un clic, aplaudimos el éxito de la noche a la mañana y buscamos la sanidad sin querer atravesar ningún proceso. Esta insidiosa mentalidad de microondas ha infectado nuestra espiritualidad. Si estás atravesando una temporada donde nada avanza, recuerda que Dios está construyendo en ti la estructura necesaria para que no te quiebres bajo tu propósito.`,
    `Para nosotros en el caos de la vida moderna, este texto funciona como un llamado sumamente urgente a la disciplina y la intencionalidad sagrada. El marketing nos dice que debemos añadir más cosas para ser plenos. No obstante, la profunda vía bíblica suele ser la de la sustracción. Someterse a esta obra requiere una vulnerabilidad valiente, confiando en que el Divino Escultor sabe con exactitud qué pedazos de tu vida deben caer al suelo hoy.`,
    `Al confrontar este principio con nuestras rutinas actuales, debemos evaluar cómo manejamos la presión diaria. Es fácil desmoronarse bajo el peso de las deudas, las demandas laborales y las expectativas sociales. Pero la aplicación práctica nos llama a dejar de cargar el puente solos. Depositar nuestra confianza en Cristo como piedra angular significa aceptar que Su gracia es suficiente para mantener unida nuestra vida, incluso cuando sentimos que todo está a punto de colapsar.`,
    `Vivimos en una época de increíble ansiedad e inestabilidad global. Noticias alarmantes, incertidumbre económica y cambios drásticos nos sacuden como olas violentas. El desafío urgente de hoy no es tratar de controlar el mar, lo cual es imposible, sino revisar dónde está anclada nuestra esperanza. Si tu ancla está en tu cuenta bancaria o en líderes humanos, cederá. Debes aferrarla profundamente a las promesas inmutables de Dios reveladas en las Escrituras.`,
    `Nuestra tendencia natural moderna es evitar la fricción a toda costa. Construimos 'biósferas' seguras, evitando personas difíciles y situaciones incómodas. Sin embargo, la exhortación de hoy es que abraces el viento de las dificultades cotidianas como la herramienta de Dios para fortalecer tu resistencia espiritual. Ese compañero de trabajo difícil o esa prueba inesperada no son obstáculos para tu fe, son el gimnasio mismo donde tu fe crece.`,
    `En la era de las redes sociales, donde solo publicamos nuestros mejores ángulos y escondemos celosamente nuestros fracasos, este pasaje nos llama a la transparencia. El Evangelio nos pide que dejemos de esconder nuestras fracturas detrás de filtros de falsa piedad. Dios quiere usar tu testimonio de restauración, con todas sus marcas doradas de gracia, para dar esperanza a otros que están igual de rotos. Tu vulnerabilidad hoy puede ser el milagro de alguien más.`,
    `Es sumamente fácil dejarse abrumar y paralizar por la oscuridad de nuestra sociedad contemporánea. Nos desgastamos quejándonos de la corrupción o la moralidad en decadencia. Pero la aplicación bíblica de hoy es directa y personal: enfócate en tu propia lámpara. ¿Estás dedicando tiempo en secreto a la oración y a la Palabra para mantener vivo el fuego del Espíritu? Hoy se te llama a brillar en tu oficina y en tu hogar, iluminando tu propio metro cuadrado con integridad.`
];

const curiosidades = [
  "¿Sabías que en el griego original, la palabra 'perdonar' (aphiēmi) significa literalmente 'soltar amarras', la misma expresión usada para liberar un barco mercante para que pueda zarpar?",
  "¿Sabías que las 'pruebas' (peirasmos) en la antigüedad eran la 'piedra de toque' específica que los joyeros usaban para frotar y comprobar la pureza auténtica de las monedas de oro?",
  "¿Sabías que el crisol mencionado en la Biblia alcanzaba más de 1000 grados, requiriendo que el artesano mantuviera la mirada fija sin parpadear sobre el metal para no arruinarlo?",
  "¿Sabías que la palabra para 'perseverancia' (hupomonē) no describe resignación pasiva, sino una resistencia militar, valiente y victoriosa frente a la hostilidad directa?",
  "¿Sabías que los escultores griegos clásicos llamaban a las piedras sin trabajar 'sombras', porque creían que la luz y el propósito real estaban escondidos en su interior?",
  "¿Sabías que los romanos inventaron el hormigón, pero en sus estructuras más duraderas e importantes confiaban en la física pura del peso y la gravedad de la 'dovela' o piedra angular?",
  "¿Sabías que las anclas antiguas no tenían brazos, sino que eran pesadas piedras perforadas diseñadas puramente para aferrarse por peso al lecho rocoso del fondo marino?",
  "¿Sabías que la 'madera de reacción' en los árboles se forma en la base del tronco únicamente en respuesta al estrés mecánico provocado por los fuertes vientos?",
  "¿Sabías que la técnica Kintsugi surge de la filosofía Wabi-sabi, que abraza la belleza de la imperfección, considerando que el daño es parte de la historia del objeto y no su fin?",
  "¿Sabías que las lámparas de aceite del primer siglo, usadas por las vírgenes de las parábolas, eran tan pequeñas que cabían en la palma de una mano y requerían ser rellenadas constantemente?"
];

const pasajesSugeridos = [
  "Mateo 18:21-35, Efesios 4:31-32", "Isaías 40:29-31, Santiago 1:2-4", "1 Pedro 1:6-7, Salmo 66:10",
  "Gálatas 6:9, Hebreos 10:36", "Hebreos 12:1-2, Efesios 2:10", "Efesios 2:20-22, 1 Pedro 2:4-6",
  "Hebreos 6:19-20, Salmo 46:1-3", "Romanos 5:3-5, 2 Corintios 12:9-10", "2 Corintios 4:7-9, Isaías 61:3",
  "Mateo 5:14-16, Filipenses 2:14-15"
];

const imagenesFondo = [
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?auto=format&fit=crop&q=80&w=1000"
];

// --- UTILIDADES DE SIMULACIÓN DE IA ---
const simularTemaIA = (modo, referencia, enfasis) => {
  const ref = referencia && referencia.trim() !== '' ? referencia : 'las Escrituras';
  const enfasisCorto = enfasis ? enfasis.split(' ')[0].toLowerCase() : 'práctica';
  const temas = [
    `La transformación diaria a través de ${ref}`,
    `Principios de ${enfasisCorto} revelados en ${ref}`,
    `Viviendo el Evangelio: Un estudio profundo de ${ref}`,
    `Descubriendo el propósito divino mediante ${ref}`,
    `Respuestas bíblicas para la vida moderna desde ${ref}`
  ];
  return temas[Math.floor(Math.random() * temas.length)];
};

const simularSugerenciaIA = (modo, referencia, tema, enfasis) => {
  const baseTxt = modo === 'libro' ? `del libro de ${referencia}` : `sobre el tema de ${referencia}`;
  return {
    objetivoGeneral: `Desarrollar una comprensión exegética y práctica ${baseTxt}, enfocada en ${tema || 'el crecimiento espiritual'} bajo un énfasis de ${enfasis.toLowerCase()}, permitiendo al estudiante integrar los principios teológicos en su vida diaria.`,
    objetivosEspecificos: [
      `Analizar el contexto histórico y doctrinal de ${baseTxt} para una interpretación precisa.`,
      `Identificar los principios clave relacionados con ${tema || 'el tema central'} y su aplicación contemporánea.`,
      `Fomentar disciplinas espirituales basadas en las exhortaciones estudiadas.`
    ],
    competencia: `El estudiante será capaz de articular una cosmovisión bíblica sólida respecto a ${tema || baseTxt} y demostrará una fe activa mediante la resolución de dilemas cotidianos.`
  };
};

// --- UTILIDADES GLOBALES ---
const formatearFecha = (fechaInicio, diasAgregados) => {
  const start = new Date(fechaInicio + 'T12:00:00');
  const current = new Date(start);
  current.setDate(start.getDate() + diasAgregados);
  const opciones = { weekday: 'short', day: 'numeric', month: 'short' };
  const fechaStr = current.toLocaleDateString('es-ES', opciones);
  return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
};

const getShuffledIndices = (length) => {
  const array = Array.from({length}, (_, k) => k);
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const renderProfundizarParagraph = (text) => {
  if (text.startsWith('📖 Lee:')) {
    const prefix = '📖 Lee: ';
    const passagesStr = text.substring(prefix.length);
    const passages = passagesStr.split(',').map(p => p.trim().replace(/\.$/, ''));
    
    return (
      <p className="mb-4 leading-relaxed">
        {prefix}
        {passages.map((p, i) => {
          const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(p)}&version=NVI`;
          return (
            <React.Fragment key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-400/50 hover:decoration-teal-300 font-medium transition-colors">
                {p}
              </a>
              {i < passages.length - 1 ? ', ' : '.'}
            </React.Fragment>
          );
        })}
      </p>
    );
  }
  return <p className="mb-4 leading-relaxed">{text}</p>;
};

// --- COMPONENTES PRINCIPALES ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userEmail, setUserEmail] = useState(null); // Nuevo estado para simular perfiles
  
  const [authLoading, setAuthLoading] = useState(true);
  const [hideAuthScreen, setHideAuthScreen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [view, setView] = useState('student');
  const [generatedDevotionals, setGeneratedDevotionals] = useState([]);
  const [studentDayIndex, setStudentDayIndex] = useState(0);
  const [studentNote, setStudentNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [courseHistory, setCourseHistory] = useState([]);

  // NUEVOS ESTADOS DE ROLES Y PERMISOS
  const SUPER_ADMIN_EMAIL = 'admin@campus.com'; 
  const [adminEmails, setAdminEmails] = useState([SUPER_ADMIN_EMAIL]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  // Usar el correo guardado en el perfil en lugar del correo de Firebase Auth
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;
  const isAdmin = userEmail && adminEmails.includes(userEmail);

  const todayStr = new Date().toISOString().split('T')[0];
  const [adminConfig, setAdminConfig] = useState({
    modo: 'libro',
    libroBiblia: '',
    capitulo: '',
    temaLibre: '', 
    tema: '', 
    enfasis: OPCIONES_ENFASIS[0],
    semanas: 1, 
    startDate: todayStr,
    objetivoGeneral: '',
    objetivosEspecificos: ['', '', ''],
    competencia: ''
  });
  
  const [editingDevoId, setEditingDevoId] = useState(null); 
  const [previewDevoId, setPreviewDevoId] = useState(null); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null); 
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ESTADOS DE LA BIBLIA LOCAL
  const bibleDataRef = React.useRef(null);
  const [isBibleLoaded, setIsBibleLoaded] = useState(false);

  // --- EFECTOS FIREBASE Y CARGAS ---
  useEffect(() => {
    // Cargar Biblia desde memoria interna (IndexedDB) al iniciar
    loadBibleLocally().then(data => {
      if (data) {
        bibleDataRef.current = data;
        setIsBibleLoaded(true);
      }
    }).catch(e => console.warn("No hay Biblia local guardada o hubo un error:", e));

    if (!auth) { setAuthLoading(false); return; }
    let unsubscribe = () => {};
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        console.error("Auth error:", error); 
      }
      
      unsubscribe = onAuthStateChanged(auth, (currentUser) => { 
        setUser(currentUser); 
        // No apagamos el authLoading todavía, esperamos a ver si tiene un perfil
      });
    };
    initAuth();
    
    return () => unsubscribe();
  }, []);

  // CARGAR PERFIL DE USUARIO SIMULADO (Para evadir restricciones del sandbox)
  useEffect(() => {
    if (!user || !db) {
       if(!user) setAuthLoading(false);
       return;
    }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
    const unsub = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().email) {
        setUserEmail(docSnap.data().email);
        setHideAuthScreen(true);
      } else {
        setUserEmail(null);
      }
      setAuthLoading(false);
    }, (e) => {
        if (e.code !== 'permission-denied') console.error(e);
        setAuthLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    const rolesRef = doc(db, 'artifacts', appId, 'public', 'data', 'roles', 'admins');
    const unsub = onSnapshot(rolesRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().emails) {
        const fetchedEmails = docSnap.data().emails;
        if (!fetchedEmails.includes(SUPER_ADMIN_EMAIL)) fetchedEmails.push(SUPER_ADMIN_EMAIL);
        setAdminEmails(fetchedEmails);
      } else if (userEmail === SUPER_ADMIN_EMAIL) {
        setDoc(rolesRef, { emails: [SUPER_ADMIN_EMAIL] }, { merge: true }).catch(e => console.warn(e));
      }
    }, (error) => {
      if(error.code !== 'permission-denied') console.error("Error cargando roles:", error);
    });
    return () => unsub();
  }, [user, userEmail]);

  useEffect(() => {
    if (!user || !db) return;
    const courseRef = doc(db, 'artifacts', appId, 'public', 'data', 'courses', 'main');
    const unsub = onSnapshot(courseRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().devotionals) setGeneratedDevotionals(docSnap.data().devotionals);
    }, (error) => {
      if(error.code !== 'permission-denied') console.error("Error cargando devocionales:", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    const progRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'main');
    const unsub = onSnapshot(progRef, (docSnap) => {
      if (docSnap.exists()) setStudentDayIndex(docSnap.data().currentDayIndex || 0);
    }, (error) => {
      if(error.code !== 'permission-denied') console.error("Error cargando progreso:", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !db || generatedDevotionals.length === 0) return;
    const currentDevoId = generatedDevotionals[studentDayIndex]?.id;
    if (!currentDevoId) return;
    const noteRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', currentDevoId);
    getDoc(noteRef).then(docSnap => {
      if (docSnap.exists()) setStudentNote(docSnap.data().text || '');
      else setStudentNote('');
    }).catch(e => {
       if(e.code !== 'permission-denied') console.error("Error al cargar notas", e);
    });
  }, [user, studentDayIndex, generatedDevotionals]);

  useEffect(() => {
    const history = localStorage.getItem('devo_app_history');
    if (history) setCourseHistory(JSON.parse(history));
  }, []);

  const handleAddAdmin = async () => {
    if (!user || !db || !newAdminEmail || !newAdminEmail.includes('@')) return;
    if (adminEmails.includes(newAdminEmail)) return;
    
    const updatedEmails = [...adminEmails, newAdminEmail];
    setAdminEmails(updatedEmails);
    setNewAdminEmail('');
    
    const rolesRef = doc(db, 'artifacts', appId, 'public', 'data', 'roles', 'admins');
    await setDoc(rolesRef, { emails: updatedEmails }, { merge: true }).catch(e => console.error("Error al añadir profesor", e));
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if (!user || !db || emailToRemove === SUPER_ADMIN_EMAIL) return; 
    
    const updatedEmails = adminEmails.filter(e => e !== emailToRemove);
    setAdminEmails(updatedEmails);
    
    const rolesRef = doc(db, 'artifacts', appId, 'public', 'data', 'roles', 'admins');
    await setDoc(rolesRef, { emails: updatedEmails }, { merge: true }).catch(e => console.error("Error al remover profesor", e));
  };

  // MANEJADORES DE LA BIBLIA LOCAL
  const handleBibleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const normalized = normalizeBibleJSON(json);
        await saveBibleLocally(normalized);
        bibleDataRef.current = normalized;
        setIsBibleLoaded(true);
        alert('¡Biblia cargada y guardada localmente con éxito! Ya no tendrás que pegarla a mano.');
      } catch (err) {
        alert('Error al leer el archivo JSON. Asegúrate de que sea un formato de Biblia válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveBible = async () => {
    if(window.confirm('¿Seguro que deseas borrar la Biblia local de la memoria?')) {
      await deleteBibleLocally();
      bibleDataRef.current = null;
      setIsBibleLoaded(false);
    }
  };

  // ADAPTACIÓN DE LOGIN PARA EL SANDBOX (Usa perfiles simulados)
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if(!authEmail) return setAuthError('Por favor ingresa un correo electrónico.');
    
    try {
      if (user && db) {
        const emailLower = authEmail.toLowerCase().trim();
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
        await setDoc(profileRef, { email: emailLower }, { merge: true });
        setUserEmail(emailLower);
        setHideAuthScreen(true);
      }
    } catch (err) {
      setAuthError('Error de conexión. Intenta de nuevo.');
    }
  };

  const handleSignOut = async () => {
    if (user && db) {
      setAuthLoading(true); 
      // Borramos el perfil de correo para "cerrar sesión" en esta simulación
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      await setDoc(profileRef, { email: null }, { merge: true }).catch(e=>console.warn(e));
      
      setUserEmail(null);
      setHideAuthScreen(false); 
      setView('student');
      setAuthEmail('');
      setAuthPassword('');
      setAuthLoading(false); 
    }
  };

  const guardarAvance = async (newIndex) => {
    setStudentDayIndex(newIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!user || !db) return;
    try {
      const progRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'main');
      await setDoc(progRef, { currentDayIndex: newIndex }, { merge: true });
    } catch (error) { console.error("Error guardando progreso", error); }
  };

  const guardarNota = async () => {
    if (!user || !db || generatedDevotionals.length === 0) return;
    const currentDevoId = generatedDevotionals[studentDayIndex]?.id;
    if (!currentDevoId) return;
    setIsSavingNote(true);
    try {
      const noteRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', currentDevoId);
      await setDoc(noteRef, { text: studentNote, updatedAt: Date.now() }, { merge: true });
      setTimeout(() => setIsSavingNote(false), 800); 
    } catch (err) { 
      console.error(err);
      setIsSavingNote(false); 
    }
  };

  const handleConfigChange = (e, field, index = null) => {
    if (index !== null) {
      const newObjEsp = [...adminConfig.objetivosEspecificos];
      newObjEsp[index] = e.target.value;
      setAdminConfig({ ...adminConfig, objetivosEspecificos: newObjEsp });
    } else {
      setAdminConfig({ ...adminConfig, [field]: e.target.value });
    }
  };

  const handleSuggestTemaIA = () => {
    const ref = adminConfig.modo === 'libro' ? `${adminConfig.libroBiblia} ${adminConfig.capitulo}`.trim() : adminConfig.temaLibre.trim();
    setAdminConfig({ ...adminConfig, tema: simularTemaIA(adminConfig.modo, ref, adminConfig.enfasis) });
  };

  const handleSuggestAI = () => {
    const ref = adminConfig.modo === 'libro' ? `${adminConfig.libroBiblia} ${adminConfig.capitulo}` : adminConfig.temaLibre;
    const sug = simularSugerenciaIA(adminConfig.modo, ref, adminConfig.tema, adminConfig.enfasis);
    setAdminConfig({ ...adminConfig, objetivoGeneral: sug.objetivoGeneral, objetivosEspecificos: sug.objetivosEspecificos, competencia: sug.competencia });
  };

  const capitulosLibroSeleccionado = useMemo(() => {
    const libro = LIBROS_BIBLIA.find(l => l.nombre === adminConfig.libroBiblia);
    return libro ? libro.capitulos : 0;
  }, [adminConfig.libroBiblia]);

  const generarUnDevocionalIA = (config, i, isRegenerated = false, shuffledContentArray = null) => {
    const semana = Math.ceil(i / 7);
    const fechaCalendario = formatearFecha(config.startDate, i - 1);
    
    let contentIndex;
    if (isRegenerated || !shuffledContentArray) {
       contentIndex = Math.floor(Math.random() * HISTORIAS_COMPLETAS.length);
    } else {
       contentIndex = shuffledContentArray[(i - 1) % shuffledContentArray.length];
    }

    const versosImportantes = ["2-4", "5-8", "12", "17", "19-21", "22-25", "26-27", "13-15"];
    const versoSimulado = versosImportantes[(i - 1) % versosImportantes.length];

    const textosTematicosReales = [
      { ref: "Colosenses 3:13", text: "Soportándoos unos a otros, y perdonándoos unos a otros si alguno tuviere queja contra otro. De la manera que Cristo os perdonó, así también hacedlo vosotros." },
      { ref: "Isaías 40:31", text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán." },
      { ref: "Proverbios 17:3", text: "El crisol para la plata, y la hornaza para el oro; Pero Jehová prueba los corazones." },
      { ref: "Gálatas 6:9", text: "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos." },
      { ref: "Filipenses 1:6", text: "Estando persuadido de esto, que el que comenzó en vosotros la buena obra, la perfeccionará hasta el día de Jesucristo." },
      { ref: "Efesios 2:20", text: "Edificados sobre el fundamento de los apóstoles y profetas, siendo la principal piedra del ángulo Jesucristo mismo." },
      { ref: "Hebreos 6:19", text: "La cual tenemos como segura y firme ancla del alma, y que penetra hasta dentro del velo." },
      { ref: "Santiago 1:2-3", text: "Hermanos míos, tened por sumo gozo cuando os halléis en diversas pruebas, sabiendo que la prueba de vuestra fe produce paciencia." },
      { ref: "2 Corintios 4:7", text: "Pero tenemos este tesoro en vasos de barro, para que la excelencia del poder sea de Dios, y no de nosotros." },
      { ref: "Mateo 5:16", text: "Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras, y glorifiquen a vuestro Padre que está en los cielos." }
    ];

    const refBiblica = config.modo === 'libro' 
      ? `${config.libroBiblia} ${config.capitulo || '1'}:${versoSimulado}`
      : textosTematicosReales[contentIndex].ref; 

    // LÓGICA DE EXTRACCIÓN: Busca en la base de datos local primero. Si no, usa el marcador de posición.
    let textoDelVersiculo = "";
    if (config.modo === 'libro') {
      const extractedText = bibleDataRef.current 
        ? extractVerses(bibleDataRef.current, config.libroBiblia, config.capitulo || '1', versoSimulado) 
        : null;

      textoDelVersiculo = extractedText 
        ? extractedText 
        : `[Inserte aquí el texto bíblico de ${refBiblica}. Como administrador, utiliza el botón de Editar (lápiz) para pegar el versículo exacto antes de publicarlo, o sube un archivo .json con la Biblia al sistema]`;
    } else {
      textoDelVersiculo = textosTematicosReales[contentIndex].text;
    }
      
    const nombreCurso = config.modo === 'libro' ? config.libroBiblia : config.temaLibre;

    return {
      id: `dev-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      aprobado: false,
      series: `Curso: ${nombreCurso}`,
      week: `Semana ${semana}`,
      dayInfo: `Día ${i} · ${fechaCalendario}`,
      title: titulosInspiradores[contentIndex],
      subtitle: `Día ${i}: Principios de ${config.enfasis.split(' ')[0].toLowerCase()}`,
      passageRef: refBiblica,
      verseText: textoDelVersiculo,
      historia: HISTORIAS_COMPLETAS[contentIndex],
      reflexion: `${exegesisBase[contentIndex]}\n\n${aplicacionBase[contentIndex]}`,
      profundizar: `💡 Curiosidad exegética: ${curiosidades[contentIndex]}\n\n📖 Lee: ${pasajesSugeridos[contentIndex]}`,
      aplicacion: [
        "Identifica un área específica de tu vida (finanzas, relaciones, trabajo) donde este principio bíblico choca con tus costumbres actuales.",
        "Toma cinco minutos en silencio hoy para rendirle el control de esa área específica al Señor en oración."
      ],
      prayer: "Soberano Dios, que la verdad inagotable de Tu Palabra penetre mucho más allá de mi intelecto el día de hoy. Te ruego que moldee mis afectos más profundos y dirija mis acciones cotidianas, para que quienes me rodeen puedan ver el carácter de Cristo reflejado en mi vida. En el nombre de Jesús, Amén.",
      author: "IA Pastoral System",
      imageUrl: imagenesFondo[contentIndex]
    };
  };

  const handleGenerateDevotionals = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const totalDias = (adminConfig.semanas || 1) * 7;
      const devocionales = [];
      const shuffledArray = getShuffledIndices(HISTORIAS_COMPLETAS.length);

      for (let i = 1; i <= totalDias; i++) {
        devocionales.push(generarUnDevocionalIA(adminConfig, i, false, shuffledArray));
      }
      
      setGeneratedDevotionals(devocionales);
      setIsGenerating(false);
      setView('admin_review');
    }, 1500);
  };

  const recalculateDays = (items) => {
    return items.map((devo, index) => {
      const dayNum = index + 1;
      const week = Math.ceil(dayNum / 7);
      const fechaCalendario = formatearFecha(adminConfig.startDate, index);
      
      let newTitle = devo.title;
      if (newTitle.includes('Día ')) newTitle = newTitle.replace(/Día \d+:/, `Día ${dayNum}:`);
      let newSub = devo.subtitle;
      if (newSub && newSub.includes('Día ')) newSub = newSub.replace(/Día \d+:/, `Día ${dayNum}:`);
      
      return { 
        ...devo, 
        week: `Semana ${week}`, 
        dayInfo: `Día ${dayNum} · ${fechaCalendario}`, 
        title: newTitle,
        subtitle: newSub
      };
    });
  };

  const updateDevotionalContent = (id, field, value) => setGeneratedDevotionals(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  const toggleApproval = (id) => setGeneratedDevotionals(prev => prev.map(d => d.id === id ? { ...d, aprobado: !d.aprobado } : d));
  const deleteDevotional = (id) => setGeneratedDevotionals(prev => recalculateDays(prev.filter(d => d.id !== id)));
  const regenerateDevotional = (id) => {
    setGeneratedDevotionals(prev => prev.map(d => {
      if (d.id === id) {
        const dayMatch = d.dayInfo.match(/Día (\d+)/);
        const dayNum = dayMatch ? parseInt(dayMatch[1]) : 1;
        const nuevoDevo = generarUnDevocionalIA(adminConfig, dayNum, true);
        return { ...nuevoDevo, id: d.id, dayInfo: d.dayInfo, week: d.week };
      }
      return d;
    }));
  };
  const addDevotional = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedDevotionals(prev => recalculateDays([...prev, generarUnDevocionalIA(adminConfig, prev.length + 1, true)]));
      setIsGenerating(false);
    }, 800); 
  };

  const handlePublish = async () => {
    const devosAprobados = generatedDevotionals.filter(d => d.aprobado);
    if (devosAprobados.length === 0) return;
    
    if (user && db) {
      const courseRef = doc(db, 'artifacts', appId, 'public', 'data', 'courses', 'main');
      await setDoc(courseRef, { devotionals: devosAprobados, updatedAt: Date.now() }).catch(e => console.error("Error al publicar:", e));
    }

    const newRecord = {
      date: new Date().toLocaleDateString(),
      type: adminConfig.modo,
      name: adminConfig.modo === 'libro' ? `${adminConfig.libroBiblia} Cap. ${adminConfig.capitulo}` : adminConfig.temaLibre,
      theme: adminConfig.tema
    };
    const updatedHistory = [newRecord, ...courseHistory];
    setCourseHistory(updatedHistory);
    localStorage.setItem('devo_app_history', JSON.stringify(updatedHistory));

    setStudentDayIndex(0);
    setView('student');
  };

  const clearHistory = () => {
    if(window.confirm("¿Seguro que deseas borrar el registro histórico de cursos pasados?")){
      setCourseHistory([]);
      localStorage.removeItem('devo_app_history');
    }
  };

  const renderCuerpoDevocional = (dev) => {
    const textoCombinado = `${dev.historia}\n\n${dev.reflexion}`;
    const parrafos = textoCombinado.split('\n\n').filter(p => p.trim() !== '');
    return (
      <div className="prose prose-stone prose-lg md:prose-xl max-w-none font-serif text-stone-700 leading-loose mb-12">
        {parrafos.map((paragraph, index) => (
          <p key={index} className={`mb-8 text-justify ${index === 0 ? 'first-letter:text-6xl first-letter:font-bold first-letter:text-teal-800 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-letter:mt-2' : ''}`}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  const handleDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', e.target.parentNode); setTimeout(() => e.target.classList.add('opacity-40', 'scale-95'), 0); };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const items = [...generatedDevotionals];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setGeneratedDevotionals(recalculateDays(items));
    setDraggedIndex(null);
  };
  const handleDragEnd = (e) => { e.target.classList.remove('opacity-40', 'scale-95'); setDraggedIndex(null); };

  const goToPreviousDay = () => {
    if (studentDayIndex > 0) guardarAvance(studentDayIndex - 1);
  };
  const goToNextDay = () => {
    if (studentDayIndex < generatedDevotionals.length - 1) guardarAvance(studentDayIndex + 1);
  };
  const toggleSpeech = () => {
    if (!generatedDevotionals[studentDayIndex]) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const evo = generatedDevotionals[studentDayIndex];
      const textToSpeak = `${evo.title}. Versículo del día. ${evo.passageRef}. ${evo.verseText}. ${evo.historia ? evo.historia + '.' : ''} ${evo.reflexion}. Para Profundizar. ${evo.profundizar}. Para Vivir Hoy. ${Array.isArray(evo.aplicacion) ? evo.aplicacion.join('. ') : evo.aplicacion}. Oración de cierre. ${evo.prayer}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95; 
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 font-serif text-xl">Preparando tu experiencia espiritual...</div>;

  if (view === 'admin_form') {
    return (
      <div className="min-h-screen bg-stone-100 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
          <div className="bg-stone-900 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold font-serif">Creador Curricular (IA)</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={() => setView('student')} className="flex items-center space-x-2 text-stone-300 hover:text-white transition-colors bg-stone-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-700">
                  <Home className="w-4 h-4" /><span>Volver al Campus</span>
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            <div className="p-8 lg:col-span-3 space-y-8 border-r border-stone-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex space-x-2">
                  <button onClick={() => setAdminConfig({...adminConfig, modo: 'libro'})} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${adminConfig.modo === 'libro' ? 'bg-white text-teal-700 shadow-sm border border-stone-200' : 'text-stone-500 hover:bg-stone-200'}`}>Por Libro</button>
                  <button onClick={() => setAdminConfig({...adminConfig, modo: 'tema'})} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${adminConfig.modo === 'tema' ? 'bg-white text-teal-700 shadow-sm border border-stone-200' : 'text-stone-500 hover:bg-stone-200'}`}>Temático</button>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Fecha de Inicio</label>
                    <input type="date" value={adminConfig.startDate} onChange={e => handleConfigChange(e, 'startDate')} className="bg-transparent border-none text-sm font-bold text-stone-700 focus:ring-0 p-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminConfig.modo === 'libro' ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Libro de la Biblia</label>
                      <select value={adminConfig.libroBiblia} onChange={e => handleConfigChange(e, 'libroBiblia')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                        <option value="">-- Seleccionar --</option>
                        {LIBROS_BIBLIA.map(l => <option key={l.nombre} value={l.nombre}>{l.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-bold text-stone-700">Capítulo(s) a estudiar</label>
                        {capitulosLibroSeleccionado > 0 && <span className="text-xs text-teal-600 font-bold bg-teal-50 px-2 py-1 rounded">Total caps: {capitulosLibroSeleccionado}</span>}
                      </div>
                      <input type="text" value={adminConfig.capitulo} onChange={e => handleConfigChange(e, 'capitulo')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Ej. 1, 1-3, o Todo" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Tema / Tópico General</label>
                      <input type="text" value={adminConfig.temaLibre} onChange={e => handleConfigChange(e, 'temaLibre')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Ej. Finanzas a la luz de la Biblia" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Sugerencias de la IA</label>
                      <select onChange={e => e.target.value && setAdminConfig({...adminConfig, temaLibre: e.target.value})} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white text-stone-600 italic">
                        <option value="">Selecciona una sugerencia...</option>
                        {TEMAS_SUGERIDOS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-200 mt-2">
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-bold text-stone-700">Tema Principal del Enfoque</label>
                      <button onClick={handleSuggestTemaIA} className="flex items-center space-x-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors">
                        <BrainCircuit className="w-3 h-3" /><span>Sugerir IA</span>
                      </button>
                    </div>
                    <input type="text" value={adminConfig.tema} onChange={e => handleConfigChange(e, 'tema')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Semanas de Duración</label>
                    <input type="number" min="1" max="52" value={adminConfig.semanas} onChange={e => handleConfigChange(e, 'semanas')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Énfasis Teológico de los Devocionales</label>
                  <select value={adminConfig.enfasis} onChange={e => handleConfigChange(e, 'enfasis')} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-medium text-stone-800">
                    {OPCIONES_ENFASIS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-stone-200 relative bg-stone-50">
                <div className="flex justify-between items-center mb-6 border-b border-stone-200 pb-4">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-teal-600" />Estructura Curricular</h3>
                  <button onClick={handleSuggestAI} disabled={adminConfig.modo === 'libro' ? !adminConfig.libroBiblia : !adminConfig.temaLibre} className="flex items-center space-x-2 bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors border border-indigo-200 disabled:opacity-50 shadow-sm">
                    <BrainCircuit className="w-5 h-5" /><span>Autocompletar (IA)</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Objetivo General</label>
                    <textarea value={adminConfig.objetivoGeneral} onChange={e => handleConfigChange(e, 'objetivoGeneral')} rows="2" className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">3 Objetivos Específicos</label>
                    <div className="space-y-2">
                      {adminConfig.objetivosEspecificos.map((obj, i) => (
                        <input key={i} type="text" value={obj} onChange={e => handleConfigChange(e, 'objetivosEspecificos', i)} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm bg-white" placeholder={`Objetivo ${i + 1}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Competencia a Alcanzar</label>
                    <textarea value={adminConfig.competencia} onChange={e => handleConfigChange(e, 'competencia')} rows="2" className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"></textarea>
                  </div>
                </div>
              </div>

              {/* SECCIÓN NUEVA: BASE DE DATOS BÍBLICA */}
              <div className="p-6 rounded-xl border border-stone-200 bg-white shadow-sm mt-8">
                <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
                  <h3 className="font-bold text-stone-800 flex items-center"><Database className="w-5 h-5 mr-2 text-teal-600" />Base de Datos Bíblica (Offline)</h3>
                  {isBibleLoaded ? (
                    <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Cargada</span>
                  ) : (
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">Sin Biblia Local</span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <p className="text-sm text-stone-500 flex-1">Carga un archivo <code className="bg-stone-100 px-1 rounded text-rose-600">.json</code> de la Biblia para que la IA extraiga los versículos automáticamente sin depender de internet. Se quedará guardada en la memoria interna de tu dispositivo de forma segura.</p>
                  <div className="flex space-x-2 w-full md:w-auto justify-end">
                    {isBibleLoaded ? (
                      <button onClick={handleRemoveBible} className="flex items-center space-x-1 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-sm font-bold">
                        <Trash2 className="w-4 h-4"/> <span>Borrar</span>
                      </button>
                    ) : (
                      <label className="flex items-center space-x-2 bg-teal-50 border border-teal-200 text-teal-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors text-sm font-bold">
                        <UploadCloud className="w-4 h-4"/> <span>Subir Archivo .json</span>
                        <input type="file" accept=".json" onChange={handleBibleUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleGenerateDevotionals} disabled={isGenerating || !adminConfig.objetivoGeneral} className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${isGenerating || !adminConfig.objetivoGeneral ? 'bg-stone-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:-translate-y-1'}`}>
                  {isGenerating ? <><BrainCircuit className="w-6 h-6 animate-pulse" /><span>Redactando artículos...</span></> : <><List className="w-6 h-6" /><span>Generar Devocionales</span></>}
                </button>
              </div>
            </div>

            <div className="bg-stone-50 p-6 lg:border-l border-stone-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-stone-800 flex items-center">
                  <History className="w-5 h-5 mr-2 text-stone-500" />
                  Registro Histórico
                </h3>
                {courseHistory.length > 0 && (
                  <button onClick={clearHistory} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors">Limpiar</button>
                )}
              </div>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">Revisa los tópicos que ya has publicado para evitar repetir material a los estudiantes.</p>
              
              {courseHistory.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-stone-300 rounded-xl">
                  <p className="text-sm text-stone-400 font-medium">Aún no has publicado ningún curso.</p>
                </div>
              ) : (
                <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {courseHistory.map((item, i) => (
                    <li key={i} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${item.type === 'libro' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{item.date}</div>
                      <h4 className="font-bold text-stone-800 text-sm leading-tight mb-1">{item.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2">{item.theme}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin_review') {
    const aprobadosCount = generatedDevotionals.filter(d => d.aprobado).length;
    return (
      <div className="min-h-screen bg-stone-100 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
          <div className="bg-stone-900 text-white p-6 flex flex-col md:flex-row items-center justify-between sticky top-0 z-20 gap-4">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-6 h-6 text-teal-400" />
              <div>
                <h1 className="text-2xl font-bold font-serif">Checklist de Aprobación</h1>
                <p className="text-sm text-stone-400">{aprobadosCount} de {generatedDevotionals.length} aprobados para publicar</p>
              </div>
            </div>
            <div className="flex space-x-4 w-full md:w-auto justify-end">
              <button onClick={() => setView('admin_form')} className="px-4 py-2 text-stone-300 hover:text-white transition-colors">Volver</button>
              <button onClick={handlePublish} disabled={aprobadosCount === 0} className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-bold transition-colors ${aprobadosCount > 0 ? 'bg-teal-500 hover:bg-teal-400 text-stone-900' : 'bg-stone-700 text-stone-400 cursor-not-allowed'}`}>
                <CheckCircle2 className="w-5 h-5" /><span>Publicar en la Nube {aprobadosCount > 0 ? `(${aprobadosCount})` : ''}</span>
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedDevotionals.map((devo, index) => (
              <div key={devo.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd} className={`border rounded-xl p-5 hover:shadow-lg transition-all relative cursor-grab active:cursor-grabbing flex flex-col ${devo.aprobado ? 'bg-teal-50 border-teal-300' : 'bg-white border-stone-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-stone-400 hover:text-stone-700 cursor-grab"><GripVertical className="w-5 h-5" /></div>
                    <div className="text-xs font-bold text-teal-700 bg-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">{devo.dayInfo}</div>
                  </div>
                  <button onClick={() => deleteDevotional(devo.id)} className="text-stone-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-800 leading-tight mb-1">{devo.title}</h3>
                <p className="text-sm text-stone-500 font-bold mb-4">{devo.passageRef}</p>
                <p className="text-sm text-stone-600 line-clamp-3 mb-6 italic">"{devo.historia.substring(0, 100)}..."</p>
                <div className="flex justify-between items-center pt-4 border-t border-stone-200/60 mt-auto">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${devo.aprobado ? 'bg-teal-600 border-teal-600' : 'border-stone-400 group-hover:border-teal-500'}`}>
                      {devo.aprobado && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={devo.aprobado} onChange={() => toggleApproval(devo.id)} />
                    <span className={`text-sm font-bold ${devo.aprobado ? 'text-teal-700' : 'text-stone-500'}`}>Aprobado</span>
                  </label>
                  <div className="flex space-x-1">
                    <button onClick={() => setPreviewDevoId(devo.id)} className="p-2 text-stone-500 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"><Eye className="w-5 h-5" /></button>
                    <button onClick={() => setEditingDevoId(devo.id)} className="p-2 text-stone-500 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"><Edit3 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={addDevotional} className="border-2 border-dashed border-stone-300 rounded-xl p-5 hover:bg-stone-50 hover:border-teal-400 transition-all flex flex-col items-center justify-center min-h-[250px] cursor-pointer group">
              {isGenerating ? <BrainCircuit className="w-10 h-10 text-teal-500 animate-pulse mb-3" /> : <div className="bg-stone-100 group-hover:bg-teal-50 p-4 rounded-full mb-3 text-stone-400 group-hover:text-teal-600 transition-colors"><Plus className="w-8 h-8" /></div>}
              <p className="font-bold text-stone-600 group-hover:text-teal-700 transition-colors">{isGenerating ? 'Generando...' : 'Añadir Devocional (IA)'}</p>
            </div>
          </div>
        </div>

        {/* MODAL DE VISTA PREVIA (ADMIN) */}
        {previewDevoId && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-stone-50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
              <button onClick={() => setPreviewDevoId(null)} className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white text-stone-800 rounded-full backdrop-blur transition-all shadow-sm"><X className="w-6 h-6"/></button>
              <div className="overflow-y-auto flex-1 pb-10">
                {(() => {
                  const dev = generatedDevotionals.find(d => d.id === previewDevoId);
                  if(!dev) return null;
                  return (
                    <article className="px-6 sm:px-10 py-12 bg-white">
                        <div className="text-center mb-10 pb-6 border-b border-stone-100">
                          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4 leading-tight">{dev.title}</h2>
                          <span className="inline-block bg-teal-50 text-teal-700 px-5 py-2 rounded-full text-sm font-bold tracking-wider uppercase">{dev.dayInfo}</span>
                        </div>
                        <div className="mb-10 p-6 bg-stone-50 border-l-4 border-teal-600 rounded-r-lg">
                          <div className="flex items-center text-teal-700 font-bold mb-3 uppercase tracking-wider text-sm"><BookOpen className="w-4 h-4 mr-2" />Versículo del Día: {dev.passageRef}</div>
                          <p className="font-serif text-xl text-stone-700 italic">"{dev.verseText}"</p>
                        </div>
                        {renderCuerpoDevocional(dev)}
                        {dev.profundizar && (
                          <div className="mb-12 p-8 bg-stone-800 text-stone-100 rounded-2xl shadow-inner">
                            <h3 className="text-teal-400 font-bold mb-5 flex items-center uppercase tracking-wide text-sm border-b border-stone-700 pb-3"><Lightbulb className="w-4 h-4 mr-2" /> Para Profundizar</h3>
                            <div className="prose prose-invert prose-lg max-w-none font-sans text-stone-300">
                              {dev.profundizar.split('\n\n').map((paragraph, index) => (<React.Fragment key={index}>{renderProfundizarParagraph(paragraph)}</React.Fragment>))}
                            </div>
                          </div>
                        )}
                        {dev.aplicacion && (
                          <div className="mb-10">
                            <h3 className="text-2xl font-serif font-bold text-stone-800 mb-6 border-b border-stone-200 pb-2">Para Vivir Hoy</h3>
                            <ul className="space-y-5 mt-6">
                              {Array.isArray(dev.aplicacion) ? dev.aplicacion.map((item, index) => (
                                <li key={index} className="flex items-start bg-stone-50 p-4 rounded-xl border border-stone-100"><CheckCircle2 className="w-6 h-6 text-teal-600 mr-4 flex-shrink-0 mt-0.5" /><span className="text-lg text-stone-700 leading-relaxed font-sans">{item}</span></li>
                              )) : (<li className="flex items-start bg-stone-50 p-4 rounded-xl border border-stone-100"><CheckCircle2 className="w-6 h-6 text-teal-600 mr-4 flex-shrink-0 mt-0.5" /><span className="text-lg text-stone-700 leading-relaxed font-sans">{dev.aplicacion}</span></li>)}
                            </ul>
                          </div>
                        )}
                        <div className="mt-10 p-8 bg-teal-50/50 rounded-2xl border border-teal-100/50 mb-10">
                          <h3 className="text-teal-800 font-bold mb-4 flex items-center uppercase tracking-wide text-sm"><Sun className="w-4 h-4 mr-2" /> Oración de Cierre</h3>
                          <p className="font-serif text-stone-800 italic text-lg leading-relaxed">{dev.prayer}</p>
                        </div>
                    </article>
                  )
                })()}
              </div>
              <div className="p-4 border-t border-stone-200 bg-stone-100 flex justify-end">
                <button onClick={() => { toggleApproval(previewDevoId); setPreviewDevoId(null); }} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 shadow-md flex items-center">
                  <Check className="w-5 h-5 mr-2" />Aprobar y Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {editingDevoId && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              {(() => {
                const evo = generatedDevotionals.find(d => d.id === editingDevoId);
                if (!evo) return null;
                return (
                  <>
                    <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 rounded-t-2xl">
                      <h2 className="font-bold text-lg text-stone-800 flex items-center"><Edit3 className="w-5 h-5 mr-2 text-teal-600" />Editando: {evo.dayInfo}</h2>
                      <button onClick={() => setEditingDevoId(null)} className="p-2 text-stone-500 hover:text-stone-800"><X className="w-6 h-6"/></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">
                      <div className="flex justify-end mb-2">
                        <button onClick={() => regenerateDevotional(evo.id)} className="flex items-center space-x-2 text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors shadow-sm">
                          <RefreshCw className="w-4 h-4" /><span>Reescribir todo con IA</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-1">Título</label>
                          <input type="text" value={evo.title} onChange={e => updateDevotionalContent(evo.id, 'title', e.target.value)} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-1">Referencia Bíblica</label>
                          <input type="text" value={evo.passageRef} onChange={e => updateDevotionalContent(evo.id, 'passageRef', e.target.value)} className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-stone-700 mb-1">Texto del Versículo</label>
                          <textarea value={evo.verseText} onChange={e => updateDevotionalContent(evo.id, 'verseText', e.target.value)} rows="3" className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" placeholder="Pega aquí el versículo real..."></textarea>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-stone-200 mt-4">
                        <h4 className="font-bold text-stone-800 mb-2 border-b pb-2">Cuerpo del Devocional</h4>
                        <div className="space-y-4">
                          <div><label className="block text-sm font-bold text-teal-700 mb-1">1. Historia</label><textarea value={evo.historia} onChange={e => updateDevotionalContent(evo.id, 'historia', e.target.value)} rows="5" className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"></textarea></div>
                          <div><label className="block text-sm font-bold text-teal-700 mb-1">2. Exégesis y Aplicación</label><textarea value={evo.reflexion} onChange={e => updateDevotionalContent(evo.id, 'reflexion', e.target.value)} rows="8" className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"></textarea></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-stone-200 bg-stone-100 rounded-b-2xl flex justify-between items-center">
                      <label className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-stone-200 hover:bg-stone-50">
                        <input type="checkbox" checked={evo.aprobado} onChange={() => toggleApproval(evo.id)} className="w-5 h-5 text-teal-600 rounded" />
                        <span className="font-bold text-stone-700">Marcar como Aprobado</span>
                      </label>
                      <button onClick={() => setEditingDevoId(null)} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 shadow-md">Guardar Cambios</button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA: PANTALLA DE LOGIN / REGISTRO
  if (!userEmail && !hideAuthScreen) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-teal-700 p-8 text-center">
            <BookOpen className="w-12 h-12 text-teal-100 mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Campus Devocional</h1>
            <p className="text-teal-100 text-sm">Tu espacio diario de crecimiento y reflexión</p>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6 text-center">{authMode === 'login' ? 'Iniciar Sesión' : 'Crear mi Cuenta'}</h2>
            {authError && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 text-center">{authError}</div>}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Correo Electrónico</label>
                <div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-stone-400" /><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full pl-10 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="tu@correo.com" required /></div>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white font-bold p-3 rounded-lg hover:bg-teal-700 transition-colors shadow-md mt-4">{authMode === 'login' ? 'Entrar' : 'Registrarme'}</button>
            </form>
            <div className="mt-8 pt-6 border-t border-stone-200 text-center">
              <button onClick={() => setHideAuthScreen(true)} className="text-stone-500 hover:text-stone-800 font-medium transition-colors">Continuar como invitado</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-stone-50 font-sans">
        <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-700 font-serif font-bold text-xl cursor-pointer" onClick={() => setView('student')}>
              <ChevronLeft className="w-6 h-6" /><span>Volver al Devocional</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-6 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-teal-700 p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-4 border-4 border-teal-600"><User className="w-12 h-12 text-teal-700" /></div>
              <h1 className="text-2xl font-bold text-white font-serif">{userEmail ? 'Estudiante Registrado' : 'Estudiante Invitado'}</h1>
              <p className="text-teal-100">{userEmail ? userEmail : 'Tus datos se guardan solo en este dispositivo.'}</p>
            </div>
            
            <div className="p-8">
              <h3 className="font-bold text-stone-800 mb-4 uppercase tracking-wide text-sm border-b pb-2">Estadísticas de Curso</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex flex-col items-center">
                  <Sun className="w-8 h-8 text-amber-500 mb-2" /><span className="text-2xl font-bold text-stone-800">{studentDayIndex + 1}</span><span className="text-xs text-stone-500 uppercase font-bold text-center">Días Completados</span>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex flex-col items-center">
                  <BookMarked className="w-8 h-8 text-indigo-500 mb-2" /><span className="text-2xl font-bold text-stone-800">{generatedDevotionals.length}</span><span className="text-xs text-stone-500 uppercase font-bold text-center">Total del Curso</span>
                </div>
              </div>

              <div className="space-y-4">
                {!userEmail && (
                  <button onClick={() => {setHideAuthScreen(false); setView('student');}} className="w-full flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-700 p-4 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                    <Save className="w-5 h-5" /><span>Crear cuenta para respaldar en la nube</span>
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setView('admin_form')} className="w-full flex items-center justify-center space-x-2 bg-stone-100 text-stone-700 p-4 rounded-xl font-bold hover:bg-stone-200 transition-colors">
                    <Settings className="w-5 h-5" /><span>Panel de Administrador / Maestro</span>
                  </button>
                )}
                <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 bg-rose-50 text-rose-700 p-4 rounded-xl font-bold hover:bg-rose-100 transition-colors">
                  <LogOut className="w-5 h-5" /><span>Cerrar Sesión</span>
                </button>
              </div>

              {isSuperAdmin && (
                <div className="mt-10 border-t border-stone-200 pt-8">
                  <h3 className="font-bold text-stone-800 mb-4 uppercase tracking-wide text-sm flex items-center">
                    <Users className="w-5 h-5 mr-2 text-teal-600"/> Gestión de Profesores
                  </h3>
                  <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                    <p className="text-sm text-stone-500 mb-4">Añade los correos de las personas que tendrán permiso para crear y modificar el currículo devocional. Todos los demás usuarios serán estudiantes.</p>
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="email" 
                        value={newAdminEmail} 
                        onChange={e => setNewAdminEmail(e.target.value)} 
                        placeholder="correo@profesor.com" 
                        className="flex-1 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm bg-white" 
                      />
                      <button 
                        onClick={handleAddAdmin} 
                        className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-sm"
                      >
                        Añadir
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {adminEmails.map(email => (
                        <li key={email} className="flex justify-between items-center bg-white p-3 rounded-lg border border-stone-200 text-sm shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${email === SUPER_ADMIN_EMAIL ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
                            <span className="font-bold text-stone-700">
                              {email} {email === SUPER_ADMIN_EMAIL && <span className="text-amber-600 text-xs ml-1">(Tú / Dueño)</span>}
                            </span>
                          </div>
                          {email !== SUPER_ADMIN_EMAIL && (
                            <button onClick={() => handleRemoveAdmin(email)} className="text-stone-400 hover:text-rose-500 p-1 transition-colors" title="Quitar permisos de profesor">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'student') {
    const devotional = generatedDevotionals[studentDayIndex];

    if (!devotional) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <BookOpen className="w-16 h-16 text-teal-200 mb-4 animate-pulse" />
        <p className="text-stone-500 font-serif text-xl text-center px-4">El maestro aún no ha publicado el curso de esta temporada.</p>
        {isAdmin && (
          <button onClick={() => setView('admin_form')} className="mt-6 text-teal-600 font-bold hover:underline">Ir al Panel para crear uno</button>
        )}
        <button onClick={() => setView('profile')} className="mt-6 text-stone-500 hover:text-stone-700 font-medium flex items-center"><User className="w-4 h-4 mr-2"/> Ir a mi perfil</button>
      </div>
    );

    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-teal-200 selection:text-teal-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-700 font-serif font-bold text-xl">
              <BookOpen className="w-6 h-6" /><span>Campus Devocional</span>
            </div>
            <button onClick={() => setView('profile')} className="flex items-center space-x-2 text-stone-600 hover:text-teal-700 font-medium bg-stone-100 hover:bg-teal-50 px-3 py-2 rounded-full transition-colors">
              <User className="w-4 h-4" /><span className="text-sm hidden sm:inline">Mi Perfil</span>
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto pb-24">
          <div className="relative w-full h-64 sm:h-auto sm:min-h-[20rem] bg-stone-200 overflow-hidden shadow-inner flex flex-col justify-end">
            <img src={devotional.imageUrl} alt="Contexto Bíblico" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-stone-900/10"></div>
            <div className="relative p-6 sm:p-8 pt-24">
              <div className="flex items-center space-x-2 text-teal-300 font-medium mb-3 text-sm uppercase tracking-widest">
                <span>{devotional.series}</span><span className="opacity-50">•</span><span>{devotional.week}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white font-bold leading-tight drop-shadow-md mb-2">{devotional.title}</h1>
              {devotional.subtitle && <h2 className="text-lg sm:text-xl text-stone-200 font-serif italic drop-shadow">{devotional.subtitle}</h2>}
            </div>
          </div>

          <div className="bg-white px-6 py-3 border-b border-stone-200 shadow-sm flex items-center justify-between text-sm font-bold text-stone-500 uppercase tracking-wide">
             <span>Progreso del Curso</span><span>{studentDayIndex + 1} / {generatedDevotionals.length} Días</span>
          </div>
          <div className="w-full bg-stone-200 h-1"><div className="bg-teal-500 h-1 transition-all duration-500" style={{ width: `${((studentDayIndex + 1) / generatedDevotionals.length) * 100}%` }}></div></div>

          <article className="px-6 sm:px-8 py-8 sm:py-12 bg-white shadow-sm sm:rounded-b-2xl">
            <div className="text-center mb-10 pb-6 border-b border-stone-100 flex flex-col items-center">
              <span className="inline-block bg-stone-100 text-stone-600 px-5 py-2 rounded-full text-sm font-bold tracking-wider uppercase shadow-sm mb-4">{devotional.dayInfo}</span>
              <button onClick={toggleSpeech} className={`flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-all shadow-sm border ${isSpeaking ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`}>
                {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}<span>{isSpeaking ? 'Detener Lectura' : 'Escuchar Devocional'}</span>
              </button>
            </div>

            <div className="mb-12 p-6 bg-stone-50 border-l-4 border-teal-600 rounded-r-lg">
              <div className="flex items-center text-teal-700 font-bold mb-3 uppercase tracking-wider text-sm"><BookOpen className="w-4 h-4 mr-2" />Versículo del Día: {devotional.passageRef}</div>
              <p className="font-serif text-xl text-stone-700 italic leading-relaxed">"{devotional.verseText}"</p>
            </div>

            {renderCuerpoDevocional(devotional)}

            {devotional.profundizar && (
              <div className="mb-12 p-8 bg-stone-800 text-stone-100 rounded-2xl shadow-inner">
                <h3 className="text-teal-400 font-bold mb-5 flex items-center uppercase tracking-wide text-sm border-b border-stone-700 pb-3"><Lightbulb className="w-4 h-4 mr-2" /> Para Profundizar</h3>
                <div className="prose prose-invert prose-lg max-w-none font-sans text-stone-300">
                  {devotional.profundizar.split('\n\n').map((paragraph, index) => (<React.Fragment key={index}>{renderProfundizarParagraph(paragraph)}</React.Fragment>))}
                </div>
              </div>
            )}

            {devotional.aplicacion && (
              <div className="mb-10">
                <h3 className="text-2xl font-serif font-bold text-stone-800 mb-6 border-b border-stone-200 pb-2">Para Vivir Hoy</h3>
                <ul className="space-y-5 mt-6">
                  {Array.isArray(devotional.aplicacion) ? devotional.aplicacion.map((item, index) => (
                    <li key={index} className="flex items-start bg-stone-50 p-4 rounded-xl border border-stone-100"><CheckCircle2 className="w-6 h-6 text-teal-600 mr-4 flex-shrink-0 mt-0.5" /><span className="text-lg text-stone-700 leading-relaxed font-sans">{item}</span></li>
                  )) : (<li className="flex items-start bg-stone-50 p-4 rounded-xl border border-stone-100"><CheckCircle2 className="w-6 h-6 text-teal-600 mr-4 flex-shrink-0 mt-0.5" /><span className="text-lg text-stone-700 leading-relaxed font-sans">{devotional.aplicacion}</span></li>)}
                </ul>
              </div>
            )}

            <div className="mt-10 p-8 bg-teal-50/50 rounded-2xl border border-teal-100/50 mb-10">
              <h3 className="text-teal-800 font-bold mb-4 flex items-center uppercase tracking-wide text-sm"><Sun className="w-4 h-4 mr-2" /> Oración de Cierre</h3>
              <p className="font-serif text-stone-800 italic text-lg leading-relaxed">{devotional.prayer}</p>
            </div>

            <div className="pt-8 border-t-2 border-stone-100">
              <h3 className="text-2xl font-serif font-bold text-stone-800 mb-4">Mi Diario Espiritual</h3>
              <p className="text-stone-500 mb-4 text-sm">Escribe aquí tus reflexiones, lo que Dios te habló o tus oraciones. Se guardarán en la nube de forma privada.</p>
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-amber-400 transition-all">
                <textarea value={studentNote} onChange={e => setStudentNote(e.target.value)} placeholder="Señor, hoy entendí que..." className="w-full bg-transparent p-6 outline-none resize-y min-h-[150px] text-stone-700 font-serif leading-relaxed"></textarea>
                <div className="bg-amber-100/50 px-4 py-3 flex justify-end border-t border-amber-200/50">
                  <button onClick={guardarNota} disabled={isSavingNote} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-70">
                    <Save className="w-4 h-4" /><span>{isSavingNote ? 'Guardando...' : 'Guardar Nota'}</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={goToPreviousDay} disabled={studentDayIndex === 0} className={`flex items-center space-x-1 font-medium px-4 py-2 rounded-lg transition-colors ${studentDayIndex === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'}`}>
              <ChevronLeft className="w-5 h-5" /><span>Día Anterior</span>
            </button>
            <button onClick={goToNextDay} disabled={studentDayIndex === generatedDevotionals.length - 1} className={`flex items-center space-x-1 font-medium px-4 py-2 rounded-lg transition-colors ${studentDayIndex === generatedDevotionals.length - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'}`}>
              <span>Día Siguiente</span><ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
