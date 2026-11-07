import { afterEach, describe, expect, it, vi } from "vitest";
import { ASSISTANT_LIMITS } from "../../src/lib/assistant";
import { MemoryDailyLimiter } from "../../src/lib/assistant-limits";
import {
  type AssistantConfig,
  assistantConfigFromEnv,
  DEFAULT_GEMINI_MODEL,
  handleAssistant,
} from "../../src/lib/assistant-server";
import {
  assistantRateLimitFromEnv,
  GEMINI_DEFAULTS,
  geminiSettingsFromEnv,
} from "../../src/lib/assistant-settings";

describe("valores por defecto: son los que estaban fijos en el código", () => {
  it("Gemini", () => {
    expect(GEMINI_DEFAULTS).toEqual({
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      timeoutMs: 15_000,
      temperature: 0.4,
      maxOutputTokens: ASSISTANT_LIMITS.outputTokens,
    });
    expect(geminiSettingsFromEnv({})).toEqual(GEMINI_DEFAULTS);
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-2.5-flash-lite");
  });

  it("límite por IP: 12 mensajes cada 10 minutos", () => {
    expect(assistantRateLimitFromEnv({})).toEqual({ messages: 12, window: "10 m" });
  });
});

describe("variables de entorno del asistente", () => {
  it("cada variable cambia su valor", () => {
    expect(
      geminiSettingsFromEnv({
        GEMINI_API_BASE: "https://proxy.example.com/v1beta/",
        GEMINI_TIMEOUT_MS: "8000",
        GEMINI_TEMPERATURE: "0.9",
        ASSISTANT_MAX_OUTPUT_TOKENS: "250",
      }),
    ).toEqual({
      baseUrl: "https://proxy.example.com/v1beta",
      timeoutMs: 8000,
      temperature: 0.9,
      maxOutputTokens: 250,
    });
    expect(
      assistantRateLimitFromEnv({
        ASSISTANT_RATE_LIMIT_MESSAGES: "30",
        ASSISTANT_RATE_LIMIT_WINDOW: "1 h",
      }),
    ).toEqual({ messages: 30, window: "1 h" });
  });

  it("un valor inválido o fuera de rango no rompe nada: vuelve al default", () => {
    expect(
      geminiSettingsFromEnv({
        GEMINI_API_BASE: "http://evil.example.com",
        GEMINI_TIMEOUT_MS: "-1",
        GEMINI_TEMPERATURE: "5",
        ASSISTANT_MAX_OUTPUT_TOKENS: "abc",
      }),
    ).toEqual(GEMINI_DEFAULTS);
    expect(
      assistantRateLimitFromEnv({
        ASSISTANT_RATE_LIMIT_MESSAGES: "0",
        ASSISTANT_RATE_LIMIT_WINDOW: "mucho",
      }),
    ).toEqual({ messages: 12, window: "10 m" });
  });

  it("los topes de seguridad no se pueden estirar sin límite", () => {
    const settings = geminiSettingsFromEnv({
      GEMINI_TIMEOUT_MS: "999999",
      ASSISTANT_MAX_OUTPUT_TOKENS: "100000",
    });
    expect(settings.timeoutMs).toBe(GEMINI_DEFAULTS.timeoutMs);
    expect(settings.maxOutputTokens).toBe(GEMINI_DEFAULTS.maxOutputTokens);
  });

  it("assistantConfigFromEnv junta modelo, key y ajustes de Gemini", () => {
    const config = assistantConfigFromEnv([], {
      GEMINI_API_KEY: "k",
      GEMINI_MODEL: "gemini-otro",
      GEMINI_TIMEOUT_MS: "9000",
    });
    expect(config.apiKey).toBe("k");
    expect(config.model).toBe("gemini-otro");
    expect(config.gemini).toMatchObject({ timeoutMs: 9000, temperature: 0.4 });
    expect(assistantConfigFromEnv([], {}).model).toBe(DEFAULT_GEMINI_MODEL);
  });
});

describe("handleAssistant usa los ajustes de la config", () => {
  afterEach(() => vi.restoreAllMocks());

  const ok = () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hola" }] } }] }), {
      status: 200,
    });
  const request = () =>
    new Request("http://x.test/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "enginex", messages: [{ role: "user", content: "Hola" }] }),
    });
  const makeConfig = (overrides: Partial<AssistantConfig> = {}): AssistantConfig => ({
    enabled: true,
    apiKey: "SECRET",
    model: "gemini-test",
    projects: [],
    dailyLimiter: new MemoryDailyLimiter(10),
    fetch: vi.fn(async () => ok()) as unknown as typeof fetch,
    ...overrides,
  });

  it("llama a la URL base, la temperatura y los tokens configurados", async () => {
    const config = makeConfig({
      gemini: {
        baseUrl: "https://proxy.example.com/v1beta",
        timeoutMs: 5000,
        temperature: 0.9,
        maxOutputTokens: 250,
      },
    });
    const timeout = vi.spyOn(AbortSignal, "timeout");
    expect((await handleAssistant(request(), config)).status).toBe(200);

    const [url, init] = (config.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe("https://proxy.example.com/v1beta/models/gemini-test:generateContent");
    const sent = JSON.parse(String((init as RequestInit).body));
    expect(sent.generationConfig).toEqual({ maxOutputTokens: 250, temperature: 0.9 });
    expect(timeout).toHaveBeenCalledWith(5000);
  });

  it("sin ajustes usa los de siempre", async () => {
    const config = makeConfig();
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await handleAssistant(request(), config);
    const [url, init] = (config.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
    );
    expect(JSON.parse(String((init as RequestInit).body)).generationConfig).toEqual({
      maxOutputTokens: 400,
      temperature: 0.4,
    });
    expect(timeout).toHaveBeenCalledWith(15_000);
  });
});
