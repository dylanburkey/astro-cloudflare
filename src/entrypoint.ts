import * as Sentry from "@sentry/cloudflare";
import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { handle } from "@astrojs/cloudflare/handler";

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  const fetch = async (
    request: Request,
    env: Env,
    context: ExecutionContext
  ) => {
    return await handle(manifest, app, request, env, context);
  };

  const sentryHandler = Sentry.withSentry(
    (env: Env) => ({
      dsn: "https://0c4dae57ecde8360607c556c9ea210a5@o4510566429097984.ingest.us.sentry.io/4510566440435712",
      release: env.CF_VERSION_METADATA?.id,
      sendDefaultPii: true,
      tracesSampleRate: 1.0,
    }),
    { fetch } satisfies ExportedHandler<Env>
  );

  return { default: sentryHandler };
}
