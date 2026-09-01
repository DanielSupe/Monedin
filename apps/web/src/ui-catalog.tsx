import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Coins,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  Logo,
  Pagination,
  ProgressBar,
  Select,
  Skeleton,
  Tabs,
  Toast,
  ToastProvider,
} from "./ui/index.js";
import "./styles/tokens.css";

/**
 * Catálogo vivo del sistema de diseño.
 *
 * Punto de entrada APARTE, no una ruta de la aplicación. Dos razones, y la
 * segunda no la buscábamos:
 *
 * 1. Una ruta `/ui` habría necesitado `import.meta.env.DEV` para no publicarse,
 *    y eso obligaba a una TERCERA excepción de `allowEnvAccess`, que CLAUDE.md
 *    marca como señal de que algo se está haciendo mal. Así se excluye del build
 *    de producción desde `vite.config.ts`, con el `mode` que ya recibe.
 *
 * 2. Aquí no hay `QueryClientProvider` ni router. Si una pieza necesitara un
 *    proveedor para montarse, este archivo se rompe — y ese es exactamente el
 *    aviso que queremos, porque la frontera «una pieza no conoce el dominio» es
 *    lo que permite probarlas sin servidor.
 *
 * El contenido de ejemplo vive aquí a propósito y NO en `lib/messages.ts`: no lo
 * lee ningún usuario y no viaja en la compilación publicada, así que llevarlo al
 * catálogo de mensajes solo conseguiría que alguien tradujera cadenas muertas.
 */

const EJEMPLO = {
  tarea: "Sacar la basura",
  premio: "Ir al cine",
  hija: "Ana",
  conflicto: "Alguien se te adelantó",
  conflictoDetalle: "Esa tarea ya estaba aprobada cuando pulsaste.",
  validacion: "Tiene que ser al menos 1.",
  ayudaPin: "Lo usarás cada vez que entres a tu perfil.",
  vacioTitulo: "Todavía no tienes tareas",
  vacioDetalle: "Cuando te asignen una, aparecerá aquí.",
} as const;

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2>{titulo}</h2>
      <Card>
        <div className="flex flex-col gap-4">{children}</div>
      </Card>
    </section>
  );
}

function Fila({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** Todas las piezas, una vez. Se monta dos veces, una por escala. */
function Piezas(): React.ReactElement {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [avisoAbierto, setAvisoAbierto] = useState(false);
  const [pestana, setPestana] = useState("pendientes");
  const [cajonAbierto, setCajonAbierto] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Button">
        <Fila>
          <Button variant="primary">Aprobar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver más</Button>
          <Button variant="danger">Dar de baja</Button>
        </Fila>
        {/* `contrast` se enseña SOBRE la superficie de marca, que es donde vive:
            fuera de ella no se entiende para qué existe. */}
        <div data-surface="brand" className="rounded-card flex gap-3 bg-brand p-4">
          <Button variant="contrast">Entrar</Button>
          <Button variant="primary">Primario, para comparar</Button>
        </div>
        <Fila>
          <Button variant="primary" disabled>
            Deshabilitado
          </Button>
          <Button variant="primary" pending>
            En curso
          </Button>
          <Button variant="primary" block>
            Todo el ancho
          </Button>
        </Fila>
        <Fila>
          {/* Redondo y sin texto. El tipo EXIGE `aria-label`: una flecha sola no
              dice si envía, avanza o vuelve. */}
          <Button variant="primary" iconOnly aria-label="Entrar a mi cuenta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </Fila>
      </Seccion>

      <Seccion titulo="Coins">
        <Fila>
          <Coins amount={0} />
          <Coins amount={1} />
          <Coins amount={1250} />
        </Fila>
        <Coins amount={340} size="hero" />
      </Seccion>

      <Seccion titulo="ProgressBar">
        <ProgressBar value={70} max={200} label={EJEMPLO.premio} />
        <ProgressBar value={200} max={200} label={EJEMPLO.premio} />
        <ProgressBar value={0} max={200} label={EJEMPLO.premio} />
      </Seccion>

      <Seccion titulo="Field · Input · Select">
        <Field label="Correo" help={EJEMPLO.ayudaPin}>
          <Input type="email" placeholder="alguien@ejemplo.com" />
        </Field>
        <Field label="Monedas" error={EJEMPLO.validacion}>
          <Input type="number" defaultValue={0} />
        </Field>
        <Field label="Hijo">
          <Select defaultValue="ana">
            <option value="ana">Ana</option>
            <option value="luis">Luis</option>
          </Select>
        </Field>
        <Field label="Correo" help="En píldora, con sitio para un icono.">
          <Input shape="pill" type="email" placeholder="alguien@ejemplo.com" />
        </Field>
      </Seccion>

      <Seccion titulo="Badge">
        <Fila>
          <Badge>Pendiente</Badge>
          <Badge tone="info">Esperando</Badge>
          <Badge tone="success">Aprobada</Badge>
          <Badge tone="warning">En conflicto</Badge>
          <Badge tone="danger">Rechazada</Badge>
        </Fila>
      </Seccion>

      <Seccion titulo="Logo">
        <Fila>
          <Logo size="small" />
          <Logo size="medium" />
        </Fila>
        <Logo size="large" />
        <Fila>
          <Logo size="small" markOnly />
          <Logo size="medium" markOnly />
          <Logo size="large" markOnly />
        </Fila>
      </Seccion>

      <Seccion titulo="Avatar">
        <Fila>
          <Avatar value="nutria" size="small" alt={EJEMPLO.hija} />
          <Avatar value="zorro" size="medium" alt={EJEMPLO.hija} />
          <Avatar value="pulpo" size="large" alt={EJEMPLO.hija} />
          <Avatar value="koala" size="xlarge" alt={EJEMPLO.hija} />
        </Fila>
        <Fila>
          <Avatar value="nutria" size="medium" shape="rounded" alt={EJEMPLO.hija} />
          <Avatar value="zorro" size="large" shape="rounded" alt={EJEMPLO.hija} />
          <Avatar value="pulpo" size="xlarge" shape="rounded" alt={EJEMPLO.hija} />
        </Fila>
      </Seccion>

      <Seccion titulo="Alert">
        <Alert tone="info">{EJEMPLO.tarea}</Alert>
        <Alert tone="success" title="Tarea aprobada">
          {EJEMPLO.tarea}
        </Alert>
        <Alert tone="warning" title={EJEMPLO.conflicto}>
          {EJEMPLO.conflictoDetalle}
        </Alert>
        <Alert tone="danger" title="No se pudo aprobar">
          {EJEMPLO.validacion}
        </Alert>
      </Seccion>

      <Seccion titulo="Skeleton · EmptyState">
        <Skeleton lines={3} />
        <EmptyState
          glyph="🪙"
          title={EJEMPLO.vacioTitulo}
          description={EJEMPLO.vacioDetalle}
          action={<Button variant="primary">Volver</Button>}
        />
      </Seccion>

      <Seccion titulo="Drawer">
        {/*
          Se monta sin router: los enlaces los pone quien la usa, así que aquí
          van anclas sueltas. Es lo mismo que permite montarla en un test sin
          proveedores.
        */}
        <Drawer
          open={cajonAbierto}
          onOpenChange={setCajonAbierto}
          label="Navegación"
          trigger={<Button variant="secondary">Abrir el cajón</Button>}
        >
          <nav className="flex flex-col gap-1 p-3">
            <a href="#uno" className="rounded-control bg-primary-soft px-3 py-2 text-primary no-underline">
              Inicio
            </a>
            <a href="#dos" className="rounded-control px-3 py-2 text-ink no-underline">
              Tareas
            </a>
          </nav>
        </Drawer>
      </Seccion>

      <Seccion titulo="Pagination">
        {/*
          Los dos casos que importan. La pieza NO construye sus enlaces —no puede
          importar el router— así que aquí se le pasan anclas sueltas, que es
          exactamente lo que la hace montable sin proveedores.
        */}
        <Pagination
          page={1}
          totalPages={4}
          next={<a href="#siguiente">Siguiente</a>}
        />
        <Pagination
          page={3}
          totalPages={4}
          previous={<a href="#anterior">Anterior</a>}
          next={<a href="#siguiente">Siguiente</a>}
        />
        {/* Con una sola página no se dibuja: aquí debajo no hay nada. */}
        <Pagination page={1} totalPages={1} />
      </Seccion>

      <Seccion titulo="Tabs">
        <Tabs
          label="Estado"
          value={pestana}
          onValueChange={setPestana}
          items={[
            { value: "pendientes", label: "Pendientes", content: <p>Nada pendiente.</p> },
            { value: "completadas", label: "Completadas", content: <p>Una esperando.</p> },
            { value: "aprobadas", label: "Aprobadas", content: <p>Dos aprobadas.</p> },
          ]}
        />
      </Seccion>

      <Seccion titulo="Dialog · Toast">
        <Fila>
          <Button variant="danger" onClick={() => setDialogoAbierto(true)}>
            Abrir diálogo
          </Button>
          <Button variant="primary" onClick={() => setAvisoAbierto(true)}>
            Lanzar aviso
          </Button>
        </Fila>

        <Dialog
          open={dialogoAbierto}
          onOpenChange={setDialogoAbierto}
          title={`¿Dar de baja a ${EJEMPLO.hija}?`}
          description="Es definitivo y no se puede deshacer. Su historial se conserva."
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => setDialogoAbierto(false)}>
                Dar de baja
              </Button>
            </>
          }
        >
          <p>Dejará de poder entrar a su perfil.</p>
        </Dialog>

        <Toast
          open={avisoAbierto}
          onOpenChange={setAvisoAbierto}
          tone="success"
          title="Tarea aprobada"
          description={EJEMPLO.tarea}
        />
      </Seccion>

      <Seccion titulo="Card">
        <Card raised>
          <p>Una tarjeta despegada del fondo, para lo que se mira.</p>
        </Card>
      </Seccion>
    </div>
  );
}

/**
 * Las dos escalas, enfrentadas.
 *
 * El atributo lo pondrá el shell en `add-app-shell`; hasta entonces se declara
 * aquí a mano, que es lo que permite ver la diferencia sin haberlo construido.
 */
function Catalogo(): React.ReactElement {
  return (
    <ToastProvider>
      <div className="mx-auto flex max-w-(--container-reading) flex-col gap-4 p-4 lg:max-w-none lg:flex-row lg:items-start">
        <div data-scale="parent" className="flex-1">
          <h1>Escala del padre</h1>
          <p className="text-body text-ink-muted">Densidad alta, escaneo rápido.</p>
          <div className="pt-4">
            <Piezas />
          </div>
        </div>

        <div data-scale="child" className="flex-1">
          <h1>Escala del niño</h1>
          <p className="text-body text-ink-muted">Cifras grandes, toque amplio.</p>
          <div className="pt-4">
            <Piezas />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

const raiz = document.getElementById("root");

if (raiz === null) {
  throw new Error("No se encontró el elemento #root en ui.html");
}

createRoot(raiz).render(
  <StrictMode>
    <Catalogo />
  </StrictMode>,
);
