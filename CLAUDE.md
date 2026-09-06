# CLAUDE.md

Instrucciones que guiaron el arreglo del bug de "Guardado" falso en `FormularioNota`.

## Diagnóstico

En [components/formulario-nota.tsx](components/formulario-nota.tsx), la función `alEnviar` llama a `setEstado("guardado")` **después** del bloque `try/catch`, sin condicionarla al resultado de `guardarNota(texto)`:

```ts
try {
  await guardarNota(texto);
} catch {
  // TODO
}

setEstado("guardado");
```

Cuando `guardarNota` lanza una excepción (ocurre si el texto contiene la palabra "falla", ver [lib/guardar-nota.ts](lib/guardar-nota.ts)), el `catch` la atrapa pero no hace nada (`// TODO` vacío). El flujo continúa y ejecuta `setEstado("guardado")` igual, por lo que la UI muestra "Guardado" incluso cuando el servidor rechazó la nota.

## Criterio de éxito

- Al escribir una nota que incluye "falla" y hacer clic en "Guardar":
  - **NO** debe aparecer el texto "Guardado".
  - Debe aparecer un modal, superpuesto sobre toda la sección del formulario, con el texto exacto: `La nota NO ha sido guardada, vuelve a intentar`.
  - El modal solo se cierra con un botón "Aceptar" (no con clic afuera ni con Escape).
  - El texto que el usuario había escrito se conserva tras el error, para poder reintentar sin perderlo.
- Al escribir una nota sin "falla" y guardar, el comportamiento existente ("Guardado") sigue funcionando igual que antes.
- `pnpm typecheck` y `pnpm test` (o `pnpm check`) pasan en verde.

## Reglas seguidas

1. **TDD.** La prueba se agregó en [pruebas/formulario-nota.test.tsx](pruebas/formulario-nota.test.tsx) antes de tocar el componente. Se corrió `pnpm test` y se confirmó que fallaba contra el código existente antes de implementar el arreglo.
2. **Tocar solo lo necesario.** Solo se modificó `components/formulario-nota.tsx` y `pruebas/formulario-nota.test.tsx` (más este `CLAUDE.md`). No se tocó `lib/guardar-nota.ts` ni `app/page.tsx`, ni se refactorizó nada fuera del alcance del bug.
3. **Comandos a correr.** `pnpm test` para verificar la prueba (roja primero, verde después) y `pnpm typecheck` / `pnpm check` al finalizar para confirmar que todo el proyecto sigue compilando y pasando pruebas.

## Cómo se llegó al prompt final

Así se construyó, paso a paso, el prompt que finalmente se le pasó a Claude para resolver esto (se documenta porque el README pide mostrar "cómo la dirigiste", no solo el resultado):

1. **Leer la tarjeta.** Se revisó la sección "La tarjeta" del `README.md`: reproducir el bug (nota con "falla" + Guardar), qué se pide (que la persona se entere cuando falle) y el criterio de "terminado" (ya no dice "Guardado", hay prueba en `pruebas/`, `pnpm typecheck`/`pnpm test` pasan).
2. **Analizar el componente a mano antes de pedirle nada a la IA.** Se abrió [components/formulario-nota.tsx](components/formulario-nota.tsx) y se ubicó la causa exacta: `setEstado("guardado")` corría siempre después del `try/catch`, y el `catch` tenía un `// TODO` vacío que no hacía nada con el error.
3. **Escribir un primer mensaje de diagnóstico propio** (no pedirle a la IA que adivinara el bug), indicando: dónde está la línea problemática, por qué se ejecuta siempre, y ya adelantando el criterio de UX deseado — un modal que se sobreponga a todo el formulario, con el texto "la Nota NO ha sido guardada, vuelve a intentar", que solo cierre con "Aceptar" (para que el error no se pueda ignorar sin leerlo). Ese mensaje fue:

   > Quiero que mires el readme.md hay una sección que dice la tarjeta allí me piden que desarrollar ya le di una mirada a @components/formulario-nota.tsx para mi desde mi análisis le falta la parte del catch de la línea 19, ya que setEstado("guardado"); se esta ejecutando siempre en la función alEnviar(); también hay que mostrarle un modal que se sobreponga sobre toda la sección del formulario y que diga la Nota NO ha sido guardada, vuelve a intentar y que el modal solo se pueda cerrar al darle aceptar, esto con la idea de que el error no sea ignorado sin mirar el mensaje.

4. **Pedirle a la IA que convirtiera ese diagnóstico en un prompt reutilizable**, especificando qué debía llevar ese prompt: la causa raíz exacta (`setEstado("guardado")` corriendo siempre), la solución concreta (`setEstado("error")` en el `catch`), la exigencia de generar la prueba primero y correr los comandos, y la generación de este mismo `CLAUDE.md`. Ese mensaje fue:

   > Ahora quiero que me generes un PROMPT con el cual pude haber resuelto este ejercicio desde 0 especificando bien lo de `setEstado("guardado");` que se ejecutaba siempre; que la solución va por hacer un set del estado en el catch `setEstado("error");` y con la generación del test y la ejecución de los comandos que pide. Tambien hay que generar el archivo CLAUDE.md en el proyecto y allí vas a poner todas las instrucciones para solucionar el problema.

5. **Revisar el prompt generado antes de usarlo**, confirmando que cubriera: diagnóstico preciso de la causa raíz, criterio de éxito verificable, TDD explícito (prueba antes del código, confirmar que falla, luego implementar), alcance de archivos acotado, y los comandos de verificación (`pnpm test`, `pnpm typecheck`, `pnpm check`).
6. **Usar ese prompt para ejecutar la solución.** El prompt final, ya validado, fue:

   > Estoy en un proyecto Next.js + React. Hay un bug en components/formulario-nota.tsx: al escribir una nota que incluye la palabra "falla" y darle clic a "Guardar", el servidor (lib/guardar-nota.ts) rechaza la nota lanzando un error, pero la pantalla igual muestra "Guardado".
   >
   > La causa es que en alEnviar la línea setEstado("guardado") se ejecuta siempre después del bloque try/catch, sin importar si guardarNota(texto) lanzó una excepción — el catch la atrapa pero no hace nada con ella (hay un // TODO vacío ahí), así que el flujo sigue de largo y termina en "guardado" de todos modos.
   >
   > Quiero que:
   >
   > 1. Crees un archivo CLAUDE.md en la raíz del proyecto con las instrucciones para solucionar este problema (el diagnóstico de la causa, el criterio de éxito, y las reglas a seguir: usar TDD, tocar solo lo necesario, correr los comandos indicados) para que quede documentado cómo se guio la solución.
   > 2. Arregles el bug haciendo que el catch establezca el estado a un nuevo valor, por ejemplo "error" (setEstado("error"), agregándolo al tipo Estado), y muevas setEstado("guardado") dentro del try, justo después del await, para que solo se marque como guardado si de verdad no hubo excepción.
   > 3. Cuando el estado sea "error", se muestre un modal que se sobreponga sobre toda la sección del formulario (contenido dentro del propio componente, sin tocar app/page.tsx), con el texto exacto "La nota NO ha sido guardada, vuelve a intentar", y que solo se pueda cerrar con un botón "Aceptar" (sin clic afuera, sin tecla Escape) — la idea es que el error no se pueda ignorar sin leerlo. El texto que el usuario escribió debe conservarse para poder reintentar sin perderlo.
   > 4. Sigas TDD: agrega la prueba en pruebas/formulario-nota.test.tsx (junto a la que ya existe) antes de tocar el componente, corre pnpm test y confirma que falla contra el código actual, y solo después implementes el arreglo. La prueba debe: escribir un texto que incluya "falla", dar clic en "Guardar", confirmar que aparece el texto del modal y que "Guardado" NO aparece, luego dar clic en "Aceptar" y confirmar que el modal se cierra.
   > 5. Al terminar, corras pnpm typecheck y pnpm test (o pnpm check) y confirmes que todo pasa en verde.
   > 6. Toca solo los archivos que hagan falta para esto (más el CLAUDE.md nuevo) — no refactorices nada más del proyecto.

Este prompt es el que ejecutó el arreglo descrito en las secciones anteriores.
