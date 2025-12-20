/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  CF_VERSION_METADATA: { id: string };
}

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
    };
  }
}
