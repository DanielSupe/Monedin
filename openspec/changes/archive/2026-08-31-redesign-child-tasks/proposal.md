## Why

Las tareas son **lo que un niño abre a diario**: es donde ve qué le toca hacer, marca lo hecho y
comprueba si su padre ya lo aprobó. Sigue siendo andamio, con las tres etapas del ciclo escritas como
párrafos sueltos:

```tsx
{task.status === "COMPLETED" && <p>{messages.tasks.waitingReview}</p>}
{task.status === "APPROVED"  && <p>{messages.tasks.earned} 🪙 {task.coins}</p>}
```

Una tarea pendiente, una esperando revisión y una ya pagada se ven **igual**: un rectángulo con borde
gris y texto. La máquina de estados que el producto entero protege —con transiciones condicionales y
tests de doble tap— no se ve por ninguna parte.

Y hay un defecto medido que arrastra el marco. `ChildShell` lleva `overflow-x-auto` con un comentario
que dice que la causa vive en las pantallas sin vestir. Medido a 390 px, la causa es **una sola**:

| Pantalla | Ancho pedido | Disponible | Quién |
| --- | --- | --- | --- |
| `/me/tasks` | 384 px | 358 px | el `<input type="file">` nativo |
| `/me/settings` | 384 px | 358 px | el mismo |

El ancho mínimo intrínseco de un selector de archivo nativo ronda los 360 px y **arrastra a su
columna**. No está en ninguna de las dos pantallas: está en `ImageUploadField`, que además es donde
vive el recorte de foto y la pregunta que `add-design-system` dejó abierta.

## What Changes

- **Las tareas del niño, vestidas**, con las tres etapas del ciclo distinguibles de un vistazo:
  pendiente, esperando revisión y ya pagada.
- **`ImageUploadField` se viste**, y con él se cierra la pregunta abierta del recorte. El selector de
  archivo deja de ser el control nativo, que es lo que desborda.
- **«Mi perfil» del niño, vestido.** Es la pantalla que no tenía change asignado: cuelga del avatar,
  no es tareas ni es tienda, y se había quedado fuera de los tres del niño.
- **Se retira el `overflow-x-auto` del marco** si las cuatro pantallas del niño ya caben.

## Capabilities

### Modified Capabilities

- `tasks`: el estado de una tarea se distingue por su forma, no solo por un texto.
- `design-system`: subir una imagen deja de depender del aspecto del control nativo del navegador.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `features/tasks/MyTasks.tsx`, `features/uploads/ImageUploadField.tsx`,
`features/children/ChildSettings.tsx` y `AvatarPicker.tsx`, `app/ChildShell.tsx`, `lib/messages.ts`
y las dos listas de deuda declarada.

**API, contratos y base de datos**: sin tocar.

**Dependencias**: ninguna. `react-easy-crop` ya está.

**Cuatro pantallas más se benefician** sin estar en el alcance, porque comparten el subidor: la foto
del padre, la del hijo desde la gestión, la del premio y la evidencia.

## No incluye

- **Los premios y los canjes del niño**: `redesign-child-shop`, que cierra su área.
- **Las tres pantallas de credenciales** —`ResetPinScreen`, `ChangePinScreen`, `ParentAvatarScreen`—,
  que siguen huérfanas en la lista de deuda.
- **Cambiar la máquina de estados.** Las transiciones, la acreditación y el doble tap se quedan como
  están: esto es cómo se ven, no cómo funcionan.
- **La evidencia obligatoria.** Sigue siendo opcional a propósito: enseñar el trabajo, no un peaje
  para declararlo hecho.
