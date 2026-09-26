/// <reference types="vite/client" />

interface ImportMetaEnv {
  // "1" in the bundle that gets published into the circuit container, where
  // there is no registry bridge and only the read-only pages work.
  readonly VITE_PUBLIC_BUILD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
