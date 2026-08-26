/**
 * Estos tests arrancan la API como un proceso de verdad, porque lo que
 * comprueban es precisamente el comportamiento del arranque: que muera con
 * código distinto de cero y que no llegue a escuchar. Eso no se puede observar
 * llamando a una función.
 *
 * `ENV_FILE` apunta a un archivo inexistente para que el `.env` de la máquina no
 * rellene los huecos que el test quiere dejar vacíos.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const serverEntry = path.join(apiRoot, "src", "server.ts");
const NO_ENV_FILE = path.join(apiRoot, "no-existe-este-archivo.env");

interface BootResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function bootApi(env: Record<string, string>): {
  finished: Promise<BootResult>;
  stdout: () => string;
  stderr: () => string;
  exited: boolean;
  kill: () => void;
} {
  const child = spawn(process.execPath, ["--import", "tsx", serverEntry], {
    cwd: apiRoot,
    env: { ENV_FILE: NO_ENV_FILE, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));

  const handle = {
    finished: new Promise<BootResult>((resolve) => {
      child.on("close", (exitCode) => {
        handle.exited = true;
        resolve({ exitCode, stdout, stderr });
      });
    }),
    stdout: () => stdout,
    stderr: () => stderr,
    exited: false,
    kill: () => void child.kill(),
  };

  return handle;
}

describe("arranque de la API con configuración inválida", () => {
  it("termina con código distinto de cero y nombra la variable ausente", async () => {
    const boot = bootApi({
      NODE_ENV: "test",
      API_PORT: "3999",
      DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin",
      // WEB_ORIGIN ausente a propósito.
    });

    const result = await boot.finished;

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("WEB_ORIGIN");
  }, 30_000);

  it("no llega a escuchar peticiones", async () => {
    const boot = bootApi({
      NODE_ENV: "test",
      API_PORT: "3998",
      // Faltan DATABASE_URL y WEB_ORIGIN.
    });

    const result = await boot.finished;

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).not.toContain("escuchando");
    expect(result.stderr).toContain("DATABASE_URL");
    expect(result.stderr).toContain("WEB_ORIGIN");
  }, 30_000);

  it("no imprime el valor de una variable secreta al rechazarla", async () => {
    const secret = "mysql://usuario:contrasena-secretisima@localhost/base";
    const boot = bootApi({
      NODE_ENV: "test",
      API_PORT: "3997",
      DATABASE_URL: secret,
      TEST_DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin_test",
      WEB_ORIGIN: "http://localhost:5173",
    });

    const result = await boot.finished;
    const salida = result.stdout + result.stderr;

    expect(result.exitCode).not.toBe(0);
    expect(salida).toContain("DATABASE_URL");
    expect(salida).not.toContain("contrasena-secretisima");
  }, 30_000);
});

/** Arranca la API y espera a que anuncie que está escuchando. */
async function bootAndWaitForListening(
  env: Record<string, string>,
  timeoutMs = 30_000,
): Promise<{ boot: ReturnType<typeof bootApi>; port: number }> {
  const boot = bootApi(env);
  const port = Number(env.API_PORT);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (boot.stdout().includes("escuchando")) {
      return { boot, port };
    }
    if (boot.exited) {
      throw new Error(`La API murió al arrancar:
${boot.stderr()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  boot.kill();
  throw new Error("La API no llegó a escuchar dentro del tiempo previsto");
}

describe("las credenciales del almacén son secretas", () => {
  it("no imprime el valor de la credencial de S3 al rechazarla", async () => {
    // Mismo trato que la cadena de la base: nombra la variable, nunca su valor.
    const boot = bootApi({
      NODE_ENV: "test",
      API_PORT: "3996",
      DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin",
      TEST_DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin_test",
      WEB_ORIGIN: "http://localhost:5173",
      S3_REGION: "us-east-1",
      S3_BUCKET_NAME: "monedin-dev",
      TEST_S3_BUCKET_NAME: "monedin-test",
      TEST_S3_ENDPOINT: "http://localhost:9000",
      AWS_ACCESS_KEY_ID: "una-clave",
      // Ausente a propósito: es lo que provoca el rechazo.
      S3_ENDPOINT: "no-es-una-url",
    });

    const result = await boot.finished;
    const salida = result.stdout + result.stderr;

    expect(result.exitCode).not.toBe(0);
    expect(salida).toContain("S3_ENDPOINT");
    expect(salida).not.toContain("una-clave");
  }, 30_000);
});

describe("arranque de la API con configuración válida", () => {
  it("arranca y acepta peticiones", async () => {
    const { boot, port } = await bootAndWaitForListening({
      NODE_ENV: "test",
      API_PORT: "39871",
      DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin",
      TEST_DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin_test",
      WEB_ORIGIN: "http://localhost:5173",
      S3_REGION: "us-east-1",
      S3_BUCKET_NAME: "monedin-dev",
      TEST_S3_BUCKET_NAME: "monedin-test",
      TEST_S3_ENDPOINT: "http://localhost:9000",
      S3_ENDPOINT: "http://localhost:9000",
      AWS_ACCESS_KEY_ID: "una-clave",
      AWS_SECRET_ACCESS_KEY: "un-secreto",
    });

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: "ok" });
    } finally {
      boot.kill();
      await boot.finished;
    }
  }, 45_000);
});
