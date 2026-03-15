import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  hasGeminiKey,
  REQUIRED_MODEL,
  REQUIRED_CONFIG,
  enforceModelConfig,
} from "@/lib/gemini";
import { callMcpTool, PDG_MCP_SERVER } from "@/lib/mcpClient";

export const maxDuration = 120;

/**
 * ParticlePhysics MCP route — tries the real pp-mcp-server binary first
 * (offline PDG database, 400+ particles), then falls back to Gemini googleSearch.
 *
 * Install: `pip install particlephysics-mcp` or
 *          `uvx --from git+https://github.com/uzerone/ParticlePhysics-MCP-Server.git pp-mcp-server`
 *
 * Binary entry point: pp-mcp-server (from ParticlePhysics-MCP-Server package)
 * When the binary is available, it runs offline with no API key needed.
 * Without it, Gemini googleSearch provides PDG-grounded data.
 *
 * Available tools: search_particle, get_data, decay_analysis, error_analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const particle = typeof body.particle === "string" ? body.particle.slice(0, 200) : "";
    const property = typeof body.property === "string" ? body.property.slice(0, 200) : "";
    const query = typeof body.query === "string" ? body.query.slice(0, 500) : "";

    const hasParticle = particle.trim().length > 0;
    const hasQuery = query.trim().length > 0;
    const hasProperty = property.trim().length > 0;

    if (!hasParticle && !hasQuery) {
      if (hasProperty) {
        return NextResponse.json(
          { error: "particle or query is required; property is only valid when a particle is specified" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "particle or query is required" },
        { status: 400 },
      );
    }

    const searchQuery = hasQuery
      ? query
      : hasProperty
        ? `${particle} ${property}`.trim()
        : particle;

    const { result, executionMode } = await callMcpTool(
      PDG_MCP_SERVER,
      "search_particle",
      { name: hasParticle ? particle.trim() : searchQuery },
      hasGeminiKey() ? () => runGeminiFallback(searchQuery) : undefined,
    );

    if (!hasGeminiKey() && executionMode === "gemini") {
      return NextResponse.json({ error: "Gemini API key not configured and ParticlePhysics MCP server (pp-mcp-server) not installed" }, { status: 503 });
    }

    return NextResponse.json({
      tool: "particlephysics-mcp",
      query: searchQuery,
      result: String(result).slice(0, 5000),
      sources: executionMode === "mcp"
        ? "Particle Data Group (PDG) offline database via pp-mcp-server"
        : "Particle Data Group (PDG) via Gemini Google Search",
      executionMode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

async function runGeminiFallback(searchQuery: string): Promise<string> {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const prompt = `You are a particle physics data assistant. Using the Particle Data Group (PDG) database as your authoritative source, answer the following query about particle physics.

Query: ${searchQuery}

Provide:
1. The particle name(s), PDG ID if known
2. Requested properties (mass, lifetime, width, decay modes, quantum numbers, branching ratios) with values and uncertainties from PDG
3. The PDG edition/year for the data
4. Any relevant notes or caveats

Format your response as structured data with clear sections.`;

  const config = {
    ...REQUIRED_CONFIG,
    systemInstruction: "You are a particle physics data specialist with access to PDG data via Google Search. Always cite PDG sources.",
  };
  enforceModelConfig(REQUIRED_MODEL, config);

  const response = await genai.models.generateContent({ model: REQUIRED_MODEL, config, contents: prompt });
  return typeof response.text === "string" ? response.text : "";
}

