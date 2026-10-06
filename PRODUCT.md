# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users
Adultos con TDAH que organizan su dia con un agente conversacional. Lo usan a lo largo del dia, en pausas cortas y con atencion fragmentada, casi siempre en el telefono. Su trabajo: saber que sigue ahora, agendar y retomar tareas sin sentirse abrumados.

## Product Purpose
Agente conversacional que apoya la organizacion de actividades (tareas, agenda, rutinas, huecos libres) aprendiendo las rutinas del usuario. Exito: el usuario inicia la siguiente tarea con el menor numero de decisiones y toques posibles.

## Positioning
No es una lista de tareas ni un chat generico: es un agente que propone UNA siguiente accion basada en la rutina aprendida y deja el resto subordinado.

## Operating Context
Dos clientes sobre el mismo backend y codigo fuente compartido: `front/mobile` (Expo/React Native, piloto Android, unico con alarmas, No Molestar y notificaciones nativas) y `front/pwa` (Vite + react-native-web, acceso universal incluido iOS). Pantallas: Acceso (Google), Inicio, Chat, Ajustes. Soporta tema claro/oscuro/sistema y tres escalas de texto.

## Capabilities and Constraints
- Un solo lenguaje visual propio para Android y PWA, sin imitar Material ni iOS.
- Sin emojis; iconos SVG con significado.
- Restricciones COGA / decisiones de diseno de la tesina: maximo 5 opciones por pantalla, sin interrupciones sin permiso, rutas criticas cortas, objetivos tactiles de 44px, movimiento reducido respetado, espacio en blanco, diseno consistente.
- La idea central de interfaz confirmada por el usuario: el dia como linea de tiempo (lo hecho, lo de ahora, lo que sigue).
- Se conservan funciones y copy factual existentes (tareas, agenda, huecos, rutinas, racha, alertas, control de enfoque, jornada, zona horaria).

## Brand Commitments
Sin marca previa confirmada. El usuario rechaza el estilo "vibe-coded" generico (azul de plantilla, tarjetas con borde en todo, tab bar y chat estandar, login con logo centrado).

## Evidence on Hand
Sin testimonios ni metricas reales; no inventar. Documento de referencia: articulo de W3C "Making Content Usable for People with Cognitive and Learning Disabilities" (raiz del repo).

## Product Principles
1. Una accion dominante por pantalla; lo demas subordinado.
2. El agente propone, el usuario decide; nunca interrumpe sin permiso.
3. El tiempo del dia es el eje de organizacion.
4. Calma sin vaciedad: baja carga cognitiva con identidad propia.

## Accessibility & Inclusion
Cumplir COGA y WCAG AA minimo: contraste, foco visible, objetivos 44px, escalado de texto, movimiento reducido, claro/oscuro.
