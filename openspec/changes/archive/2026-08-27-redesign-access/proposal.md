## Why

El acceso es el único sitio por donde se entra por primera vez, y sigue siendo andamio: `<label>` e
`<input>` desnudos, un `<h2>` por título y un enlace subrayado al final. Es la última pantalla del
camino de entrada sin tocar, después de que `add-entry-frame` le pusiera marco a las otras cuatro.

Debajo del aspecto hay un defecto de arquitectura:

```tsx
const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
```

Entrar y registrarse son **dos destinos** decididos con estado local. Es exactamente el patrón que
`add-app-shell` retiró de quince componentes y que `CLAUDE.md` prohíbe; se escapa de los dos tests
que lo impiden por poco, porque buscan `useState<Vista|View>` y aquí el tipo es una unión de cadenas.

Su consecuencia lleva días anotada y no se había arreglado: **«Empezar» en la puerta pública abre el
formulario de ENTRAR**. Quien viene a registrarse aterriza en un acceso que no puede usar. Y el botón
atrás, desde el registro, saca de la aplicación en vez de volver.

Hay además dos cosas que el formulario no dice y deberían decirse antes de fallar: que la contraseña
necesita 10 caracteres, y **por qué hay dos credenciales** —contraseña para vincular un dispositivo,
PIN para el día a día—, que hoy se menciona en un `<small>` bajo el PIN.

## What Changes

- **Dos rutas: `/sign-in` y `/sign-up`.** Muere el estado que alternaba, y con él el botón que lo
  cambiaba. Cada pantalla ofrece la otra con un enlace de verdad.
- **Los enlaces de la puerta pública se reparten**: «Empezar» al registro, «Entrar» al acceso.
- **La pantalla se viste** siguiendo la maqueta de referencia con nuestros elementos: saludo, campos
  en píldora con icono y etiqueta visible, y envío circular con flecha.
- **Una cinta bajo el saludo**: el ciclo del producto —tarea, moneda, premio— deslizándose sin fin.
  Es lo mismo que orbita en la puerta pública, en línea recta.
- **Los requisitos se dicen antes de fallar**, y el registro explica para qué sirve cada credencial.

## Capabilities

### Modified Capabilities

- `app-navigation`: entrar y registrarse dejan de ser un estado y pasan a ser dos direcciones.
- `parent-authentication`: el formulario declara sus requisitos antes de rechazar, y explica por qué
  pide dos credenciales.
- `design-system`: `Input` admite una variante en píldora con hueco para un icono.

### New Capabilities

Ninguna.

## Impact

**Código modificado**: `features/auth/` —la pantalla actual se parte en dos—, `routes/sign-in.tsx`,
una ruta nueva `routes/sign-up.tsx`, `features/landing/LandingPage.tsx`, `ui/Input.tsx`, `ui/Button.tsx`,
`styles/tokens.css` y `lib/messages.ts`.

**API, contratos y base de datos**: **sin tocar**. Lo que cambia es cuándo se dicen las reglas que ya
existen.

**Dependencias**: ninguna.

## No incluye

- **`ResetPinScreen`, `ChangePinScreen` y `ParentAvatarScreen`.** Siguen en la lista de deuda. Son
  pantallas de credenciales, pero ninguna está en el camino de entrar por primera vez, que es lo que
  este change arregla.
- **El recorte de foto con `react-easy-crop`**, que el design de `add-design-system` dejó anotado
  aquí: vive en `ParentAvatarScreen`, que queda fuera.
- **Subir una foto al crear un perfil.** Sigue pendiente y sin decidir.
- **Un panel de bienvenida aparte.** La maqueta de referencia enseña dos; el nuestro ya existe y es
  `/welcome`. Otra pantalla de introducción sería un paso más entre querer entrar y entrar.
- **Cambiar la API o los contratos.**
