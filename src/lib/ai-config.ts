export type AIProvider = "groq" | "openai";

export type AIConfig = {
    provider: AIProvider;
    providerName: string;
    apiKey: string;
    endpoint: string;
    model: string;
};

export function getAIConfig(): AIConfig {
    const provider: AIProvider = process.env.AI_PROVIDER?.trim().toLowerCase() === "openai" ? "openai" : "groq";
    if (provider === "openai") {
        return {
            provider,
            providerName: "OpenAI",
            apiKey: process.env.OPENAI_API_KEY?.trim() || "",
            endpoint: "https://api.openai.com/v1/responses",
            model: process.env.AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
        };
    }
    return {
        provider,
        providerName: "Groq",
        apiKey: process.env.GROQ_API_KEY?.trim() || "",
        endpoint: "https://api.groq.com/openai/v1/responses",
        model: process.env.AI_MODEL?.trim() || "openai/gpt-oss-120b",
    };
}

export function isAIConfigured() {
    return Boolean(getAIConfig().apiKey);
}
