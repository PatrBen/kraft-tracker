/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** z. B. https://xxxxxxxx.dexie.cloud – leer lassen für rein lokalen Betrieb. */
  readonly VITE_DEXIE_CLOUD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
