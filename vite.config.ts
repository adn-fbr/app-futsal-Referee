import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export const TEST_PROJECT_ID = "shorsqyycpptxcutrqrb";

export function assertTestRuntime({
  mode,
  runtimeMode,
  runtimeProjectId,
  runtimeProjectRef,
  runtimeUrl,
}: {
  mode: string;
  runtimeMode: string | undefined;
  runtimeProjectId: string | undefined;
  runtimeProjectRef: string | null;
  runtimeUrl: string | undefined;
}) {
  if (mode !== "test") return true;

  if (runtimeMode !== "test") {
    throw new Error("Test runtime blocked: VITE_RUNTIME_MODE must be test.");
  }

  if (!runtimeProjectId || runtimeProjectId !== TEST_PROJECT_ID) {
    throw new Error(
      "Test runtime blocked: expected VITE_SUPABASE_PROJECT_ID to match the authorized test Supabase project.",
    );
  }

  if (!runtimeProjectRef || runtimeProjectRef !== TEST_PROJECT_ID) {
    throw new Error(
      `Test runtime blocked: expected VITE_SUPABASE_URL to resolve to ${TEST_PROJECT_ID}.supabase.co, got ${runtimeUrl ?? "unknown"}.`,
    );
  }

  if (runtimeUrl?.includes("xfscfjwapwnkiinkgbjg")) {
    throw new Error("Test runtime blocked: production Supabase URL is not allowed in test mode.");
  }

  return true;
}

// https://vitejs.dev/config/
function isServiceRoleJwt(value: string | undefined) {
  if (!value) return false;
  try {
    const payload = value.split(".")[1];
    if (!payload) return false;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role";
  } catch {
    return false;
  }
}

function containsServiceRoleJwt(content: string) {
  const candidates = content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
  return candidates.some(isServiceRoleJwt);
}

function getSupabaseProjectRef(value: string | undefined) {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname;
    return hostname.endsWith(".supabase.co") ? hostname.slice(0, -".supabase.co".length) : null;
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), "");
  const runtimeMode = process.env.VITE_RUNTIME_MODE ?? fileEnvironment.VITE_RUNTIME_MODE;
  const runtimeUrl = process.env.VITE_SUPABASE_URL ?? fileEnvironment.VITE_SUPABASE_URL;
  const runtimeProjectRef = getSupabaseProjectRef(runtimeUrl);
  const runtimeProjectId =
    process.env.VITE_SUPABASE_PROJECT_ID ?? fileEnvironment.VITE_SUPABASE_PROJECT_ID;
  const browserKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    fileEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.npm_lifecycle_event === "dev:test" && mode !== "test") {
    throw new Error("dev:test blocked: Vite MODE must be test.");
  }

  if (runtimeMode === "test" && mode !== "test") {
    throw new Error("Test runtime blocked: Vite MODE must be test.");
  }

  if (mode === "development" && runtimeMode === "test") {
    throw new Error("Development runtime blocked: do not start development with the TEST runtime.");
  }

  assertTestRuntime({
    mode,
    runtimeMode,
    runtimeProjectId,
    runtimeProjectRef,
    runtimeUrl,
  });

  if (mode === "test") {
    console.info(
      `[vite] Verified test runtime: MODE=${mode}, VITE_RUNTIME_MODE=${runtimeMode}, PROJECT_ID=${runtimeProjectId}`,
    );
  }

  if (isServiceRoleJwt(browserKey)) {
    throw new Error(
      "Build blocked: VITE_SUPABASE_PUBLISHABLE_KEY contains a Supabase service-role credential.",
    );
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      {
        name: "reject-service-role-browser-bundle",
        apply: "build",
        generateBundle(_, bundle) {
          for (const output of Object.values(bundle)) {
            const content = output.type === "chunk" ? output.code : String(output.source);
            if (containsServiceRoleJwt(content)) {
              throw new Error(
                "Build blocked: generated browser bundle contains a Supabase service-role credential.",
              );
            }
          }
        },
      },
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
