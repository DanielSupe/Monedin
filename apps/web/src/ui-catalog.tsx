import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AVATAR_OPTIONS,
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Coins,
  DataTable,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  HeroPanel,
  IconTile,
  Input,
  Logo,
  Mascota,
  Pagination,
  ProgressBar,
  ProgressRing,
  SplitLayout,
  RadioGroup,
  Select,
  Skeleton,
  Slider,
  Spotlight,
  Tabs,
  Toast,
  ToastProvider,
} from "./ui/index.js";
import "./styles/tokens.css";

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

function Piezas(): React.ReactElement {
  const [focoAbierto, setFocoAbierto] = useState(false);
  const [focoCentrado, setFocoCentrado] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [avisoAbierto, setAvisoAbierto] = useState(false);
  const [pestana, setPestana] = useState("pendientes");
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const [marcado, setMarcado] = useState(true);
  const [reparto, setReparto] = useState("igual");
  const [acercamiento, setAcercamiento] = useState(1.4);

  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Button">
        <Fila>
          <Button variant="primary">Aprobar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver más</Button>
          <Button variant="danger">Dar de baja</Button>
        </Fila>

        <Fila>
          <Button variant="primary" size="large">
            Empezar
          </Button>
          <Button variant="primary">Empezar</Button>
        </Fila>

        <div
          data-surface="brand"
          className="rounded-card flex gap-3 bg-brand p-4"
        >
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

          <Button variant="primary" iconOnly aria-label="Entrar a mi cuenta">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="size-6"
            >
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

        <Coins amount={128} size="large" />
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
          <Badge tone="done">Aprobada</Badge>
          <Badge tone="conflict">En conflicto</Badge>
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
          <Avatar
            value="nutria"
            size="medium"
            shape="rounded"
            alt={EJEMPLO.hija}
          />
          <Avatar
            value="zorro"
            size="large"
            shape="rounded"
            alt={EJEMPLO.hija}
          />
          <Avatar
            value="pulpo"
            size="xlarge"
            shape="rounded"
            alt={EJEMPLO.hija}
          />
        </Fila>

        <Fila>
          {AVATAR_OPTIONS.map((opcion) => (
            <Avatar
              key={opcion.key}
              value={opcion.key}
              size="large"
              alt={opcion.key}
            />
          ))}
        </Fila>
      </Seccion>

      <Seccion titulo="Alert">
        <Alert tone="info">{EJEMPLO.tarea}</Alert>
        <Alert tone="done" title="Tarea aprobada">
          {EJEMPLO.tarea}
        </Alert>
        <Alert tone="conflict" title={EJEMPLO.conflicto}>
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

        <Drawer
          open={cajonAbierto}
          onOpenChange={setCajonAbierto}
          label="Navegación"
          trigger={<Button variant="secondary">Abrir el cajón</Button>}
        >
          <nav className="flex flex-col gap-1 p-3">
            <a
              href="#uno"
              className="rounded-control bg-primary-soft px-3 py-2 text-primary no-underline"
            >
              Inicio
            </a>
            <a
              href="#dos"
              className="rounded-control px-3 py-2 text-ink no-underline"
            >
              Tareas
            </a>
          </nav>
        </Drawer>
      </Seccion>

      <Seccion titulo="Pagination">

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

        <Pagination page={1} totalPages={1} />
      </Seccion>

      <Seccion titulo="DataTable">

        <DataTable
          caption="Ejemplo de historial"
          columns={[
            { key: "que", header: "Premio" },
            { key: "cuanto", header: "Monedas", align: "end" },
            { key: "estado", header: "Estado" },
            { key: "cuando", header: "Cuándo", align: "end" },
          ]}
          rows={[
            {
              key: "1",
              cells: {
                que: "Helado",
                cuanto: <Coins amount={60} />,
                estado: <Badge tone="done">Aprobado</Badge>,
                cuando: "3 sep",
              },
            },
            {
              key: "2",
              cells: {
                que: "Ir al cine",
                cuanto: <Coins amount={200} />,
                estado: <Badge tone="neutral">Esperando</Badge>,
                cuando: "2 sep",
              },
            },
            {
              key: "3",
              cells: {
                que: "Patines",
                cuanto: <Coins amount={350} />,

                estado: <Badge tone="conflict">No esta vez</Badge>,
                cuando: "1 sep",
              },
            },
          ]}
        />

        <DataTable
          caption="Historial vacío"
          columns={[{ key: "a", header: "A" }]}
          rows={[]}
        />
      </Seccion>

      <Seccion titulo="Accordion">
        <Accordion
          items={[
            {
              value: "monedas",
              label: "¿Qué son las monedas?",
              content: (
                <p>Las gana haciendo tareas y las gasta pidiendo premios.</p>
              ),
            },
            {
              value: "aprobar",
              label: "¿Cuándo se pagan?",
              content: <p>Al aprobar la tarea. Aprobar es lo que acredita.</p>,
            },
            {
              value: "pin",
              label: "¿Y si se olvida el PIN?",
              content: <p>Un adulto lo repone desde el perfil del hijo.</p>,
            },
          ]}
        />
      </Seccion>

      <Seccion titulo="Tabs">
        <Tabs
          label="Estado"
          value={pestana}
          onValueChange={setPestana}
          items={[
            {
              value: "pendientes",
              label: "Pendientes",
              content: <p>Nada pendiente.</p>,
            },
            {
              value: "completadas",
              label: "Completadas",
              content: <p>Una esperando.</p>,
            },
            {
              value: "aprobadas",
              label: "Aprobadas",
              content: <p>Dos aprobadas.</p>,
            },
          ]}
        />
      </Seccion>

      <Seccion titulo="Spotlight">

        <Fila>
          <Button onClick={() => setFocoAbierto(true)}>
            Con algo destacado
          </Button>
          <Button onClick={() => setFocoCentrado(true)}>
            Sin nada destacado
          </Button>
        </Fila>

        <Spotlight
          open={focoAbierto}
          onOpenChange={setFocoAbierto}
          title="Aquí ves lo que te espera"
          description="Lo que tus hijos han marcado y todavía no has aprobado."
          rect={{ top: 120, left: 120, width: 280, height: 120 }}
          footer={
            <>
              <Button variant="ghost" onClick={() => setFocoAbierto(false)}>
                Saltar
              </Button>
              <Button variant="primary" onClick={() => setFocoAbierto(false)}>
                Seguir
              </Button>
            </>
          }
        />

        <Spotlight
          open={focoCentrado}
          onOpenChange={setFocoCentrado}
          title="Hola, soy Monedín"
          description="Te enseño en un momento cómo funciona esto."
          footer={
            <Button variant="primary" onClick={() => setFocoCentrado(false)}>
              Seguir
            </Button>
          }
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
              <Button
                variant="secondary"
                onClick={() => setDialogoAbierto(false)}
              >
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
          tone="done"
          title="Tarea aprobada"
          description={EJEMPLO.tarea}
        />
      </Seccion>

      <Seccion titulo="Card">
        <Card raised>
          <p>Una tarjeta despegada del fondo, para lo que se mira.</p>
        </Card>
      </Seccion>

      <Seccion titulo="HeroPanel">
        <HeroPanel
          tone="action"
          mascot={<Mascota pose="saluda" size="large" />}
          aside={<ProgressRing done={2} total={5} className="size-28" />}
        >
          <p className="text-display font-extrabold text-ink-inverted">
            Hola, {EJEMPLO.hija}
          </p>
          <p className="text-body text-ink-inverted opacity-90">
            Hoy te esperan dos tareas. Cuando termines una, aviso a tu papá o a
            tu mamá.
          </p>
        </HeroPanel>

        <HeroPanel
          tone="saving"
          mascot={<Mascota pose="elige" size="medium" />}
        >
          <p className="text-micro font-extrabold uppercase text-ink-inverted opacity-80">
            Tu próximo premio
          </p>
          <p className="text-title font-extrabold text-ink-inverted">
            {EJEMPLO.premio}
          </p>
          <ProgressBar value={128} max={300} label="Lo que llevas ahorrado" />
        </HeroPanel>
      </Seccion>

      <Seccion titulo="IconTile">
        <Fila>
          <IconTile tone="action">
            <IconoEjemplo />
          </IconTile>
          <IconTile tone="saving">
            <IconoEjemplo />
          </IconTile>
          <IconTile tone="coin">
            <IconoEjemplo />
          </IconTile>
          <IconTile tone="waiting">
            <IconoEjemplo />
          </IconTile>
        </Fila>
      </Seccion>

      <Seccion titulo="Mascota">
        <Fila>
          <Mascota pose="saluda" size="small" />
          <Mascota pose="celebra" size="medium" />
          <Mascota pose="duda" size="large" />
        </Fila>
        <Mascota pose="explica">
          <p className="text-body font-bold">
            Las monedas se van cuando lo aprueban.
          </p>
          <p className="text-small text-ink-muted">No cuando lo pides.</p>
        </Mascota>
      </Seccion>

      <Seccion titulo="ProgressRing">
        <HeroPanel tone="action">
          <Fila>
            <ProgressRing done={0} total={5} className="size-24" />
            <ProgressRing done={2} total={5} className="size-24" />
            <ProgressRing done={5} total={5} className="size-24" />
          </Fila>
        </HeroPanel>
      </Seccion>

      <Seccion titulo="SplitLayout">
        <SplitLayout
          aside={
            <Card>
              <p className="text-body">Lo que apoya, resume o explica.</p>
            </Card>
          }
        >
          <Card>
            <p className="text-body">Lo que se viene a hacer.</p>
          </Card>
          <Card>
            <p className="text-body">Y sigue.</p>
          </Card>
          <Card>
            <p className="text-body">Y sigue.</p>
          </Card>
        </SplitLayout>
      </Seccion>

      <Seccion titulo="Checkbox · RadioGroup · Slider">
        <Fila>
          <Checkbox checked={marcado} onCheckedChange={setMarcado}>
            {EJEMPLO.hija}
          </Checkbox>
          <Checkbox checked={false} onCheckedChange={() => undefined} disabled>
            Sin hijos que elegir
          </Checkbox>
        </Fila>

        <RadioGroup
          label="Cuánto vale la tarea"
          value={reparto}
          onValueChange={setReparto}
          options={[
            { value: "igual", label: "El mismo valor para todos" },
            {
              value: "propio",
              label: "Un valor para cada uno",
              hint: "Se pide uno por hijo",
            },
          ]}
        />

        <Slider
          label="Acercar"
          value={acercamiento}
          onValueChange={setAcercamiento}
        />
      </Seccion>
    </div>
  );
}

function IconoEjemplo(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5l2.5 2.5L11 5" />
      <path d="M13.5 8h7" />
      <path d="M4 17.5L6.5 20 11 15" />
      <path d="M13.5 18h7" />
    </svg>
  );
}

type Tema = "sistema" | "light" | "dark";

function ConmutadorDeTema(): React.ReactElement {
  const [tema, setTema] = useState<Tema>("sistema");

  const elegir = (siguiente: Tema): void => {
    setTema(siguiente);

    if (siguiente === "sistema") {
      delete document.documentElement.dataset.theme;
      return;
    }

    document.documentElement.dataset.theme = siguiente;
  };

  return (
    <fieldset className="rounded-card flex flex-wrap items-center gap-2 border border-border p-3">
      <legend className="text-small px-1 font-bold">Tema</legend>

      {(
        [
          ["sistema", "Lo que diga el sistema"],
          ["light", "Claro"],
          ["dark", "Oscuro"],
        ] as const
      ).map(([valor, texto]) => (
        <Button
          key={valor}
          variant={tema === valor ? "primary" : "secondary"}
          onClick={() => elegir(valor)}
        >
          {texto}
        </Button>
      ))}
    </fieldset>
  );
}

function Catalogo(): React.ReactElement {
  return (
    <ToastProvider>
      <div className="mx-auto flex max-w-(--container-reading) flex-col gap-4 p-4 lg:max-w-none">
        <ConmutadorDeTema />
      </div>

      <div className="mx-auto flex max-w-(--container-reading) flex-col gap-4 p-4 lg:max-w-none lg:flex-row lg:items-start">
        <div data-scale="parent" className="flex-1">
          <h1>Escala del padre</h1>
          <p className="text-body text-ink-muted">
            Densidad alta, escaneo rápido.
          </p>
          <div className="pt-4">
            <Piezas />
          </div>
        </div>

        <div data-scale="child" className="flex-1">
          <h1>Escala del niño</h1>
          <p className="text-body text-ink-muted">
            Cifras grandes, toque amplio.
          </p>
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
