import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  hasGeminiKey,
  REQUIRED_MODEL,
  REQUIRED_CONFIG,
  enforceModelConfig,
} from "@/lib/gemini";
import { callMcpTool, QUANTUM_MCP_SERVER, PSIANIMATOR_MCP_SERVER } from "@/lib/mcpClient";

export const maxDuration = 120;

/**
 * Quantum Physics Simulation route — tries PsiAnimator-MCP first (QuTip-based,
 * quantum states + entanglement + gates), then scicomp-quantum-mcp
 * (Schrödinger solver), then Gemini codeExecution as final fallback.
 *
 * PsiAnimator-MCP tools:
 *   create_quantum_state, evolve_quantum_system, measure_observable,
 *   animate_quantum_process, quantum_gate_sequence, calculate_entanglement
 *
 * scicomp-quantum-mcp tools:
 *   create_gaussian_wavepacket, create_plane_wave, create_lattice_potential,
 *   create_custom_potential, solve_schrodinger, solve_schrodinger_2d,
 *   analyze_wavefunction, get_task_status, get_simulation_result,
 *   render_video, visualize_potential, info
 *
 * Priority: PsiAnimator → scicomp-quantum → Gemini
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = typeof body.task === "string" ? body.task.slice(0, 2000) : "";
    const systemType = typeof body.systemType === "string" ? body.systemType.slice(0, 100) : "general";

    if (!task) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    // Try PsiAnimator-MCP first (QuTip-based, richer quantum physics tools)
    try {
      const psiResult = await runPsiAnimatorWorkflow(task, systemType);
      return NextResponse.json({
        tool: "psianimator-mcp",
        systemType,
        task: task.slice(0, 200),
        result: psiResult,
        executionMode: "mcp",
      });
    } catch {
      // PsiAnimator not available — try scicomp-quantum-mcp
    }

    // Try scicomp-quantum-mcp multi-step workflow
    try {
      const mcpResult = await runQuantumWorkflow(task, systemType);
      return NextResponse.json({
        tool: "scicomp-quantum-mcp",
        systemType,
        task: task.slice(0, 200),
        result: mcpResult,
        executionMode: "mcp",
      });
    } catch {
      // Fall through to Gemini fallback
    }

    if (!hasGeminiKey()) {
      return NextResponse.json({ error: "Gemini API key not configured and MCP server unavailable" }, { status: 503 });
    }

    const text = await runGeminiFallback(task, systemType);
    return NextResponse.json({
      tool: "scicomp-quantum-mcp / psianimator-mcp",
      systemType,
      task: task.slice(0, 200),
      result: text.slice(0, 8000),
      executionMode: "gemini",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// ── PsiAnimator-MCP workflow (QuTip-based) ────────────────────────────────────

async function runPsiAnimatorWorkflow(task: string, systemType: string): Promise<string> {
  const taskLower = `${task} ${systemType}`.toLowerCase();

  // Determine state type and parameters
  const stateType = /thermal|temperature/.test(taskLower) ? "thermal"
    : /coherent|harmonic/.test(taskLower) ? "coherent"
    : /fock|photon/.test(taskLower) ? "fock"
    : /squeezed/.test(taskLower) ? "squeezed"
    : "pure";

  const dims = /qubit|spin|two[\s.-]?level/.test(taskLower) ? [2]
    : /qutrit|three[\s.-]?level/.test(taskLower) ? [3]
    : [2]; // default qubit

  // Step 1: Create quantum state
  const stateResult = await callMcpTool(PSIANIMATOR_MCP_SERVER, "create_quantum_state", {
    state_type: stateType,
    system_dims: dims,
    parameters: stateType === "pure" ? { state_indices: [0] } : {},
    basis: "computational",
  });
  const stateText = String(stateResult.result);
  // Handle both structured JSON and text response formats
  const stateIdMatch = stateText.match(/state_id['":\s]+([a-zA-Z0-9_-]+)/);
  const stateId = stateIdMatch?.[1]
    ?? (typeof stateResult.result === "object" && stateResult.result !== null && "state_id" in (stateResult.result as Record<string, unknown>)
      ? String((stateResult.result as Record<string, unknown>).state_id)
      : "state_0");

  // Step 2: Determine action based on task
  let actionResult = "";

  if (/entangle|bell|epr|concurrence|negativity/.test(taskLower)) {
    // Calculate entanglement
    const entResult = await callMcpTool(PSIANIMATOR_MCP_SERVER, "calculate_entanglement", {
      state_id: stateId,
    });
    actionResult = `Entanglement analysis:\n${String(entResult.result).slice(0, 2000)}`;
  } else if (/gate|circuit|hadamard|cnot|pauli/.test(taskLower)) {
    // Apply gate sequence
    const gateResult = await callMcpTool(PSIANIMATOR_MCP_SERVER, "quantum_gate_sequence", {
      state_id: stateId,
      gates: [{ gate: "hadamard", target: 0 }],
    });
    actionResult = `Gate sequence result:\n${String(gateResult.result).slice(0, 2000)}`;
  } else if (/evolve|dynamics|time/.test(taskLower)) {
    // Time evolution
    const evolveResult = await callMcpTool(PSIANIMATOR_MCP_SERVER, "evolve_quantum_system", {
      state_id: stateId,
      method: "unitary",
      time_steps: 100,
      dt: 0.01,
    });
    actionResult = `Time evolution:\n${String(evolveResult.result).slice(0, 2000)}`;
  } else {
    // Default: measure observable
    const measureResult = await callMcpTool(PSIANIMATOR_MCP_SERVER, "measure_observable", {
      state_id: stateId,
      observable: "sigmaz",
      measurement_type: "expectation",
    });
    actionResult = `Measurement result:\n${String(measureResult.result).slice(0, 2000)}`;
  }

  return `Quantum computation complete (PsiAnimator-MCP / QuTip):\n` +
    `State type: ${stateType}, dims: [${dims.join(",")}]\n` +
    `State ID: ${stateId}\n` +
    `${actionResult}`;
}

// ── scicomp-quantum-mcp workflow (Schrödinger solver) ─────────────────────────

async function runQuantumWorkflow(task: string, systemType: string): Promise<string> {
  const taskLower = `${task} ${systemType}`.toLowerCase();

  // Step 1: Create wavefunction (Gaussian or plane wave)
  const useGaussian = !/plane wave/.test(taskLower);
  const wfTool = useGaussian ? "create_gaussian_wavepacket" : "create_plane_wave";
  const wfParams = useGaussian
    ? { grid_size: [256], position: [0.0], momentum: [5.0], width: 1.0 }
    : { grid_size: [256], momentum: [5.0] };

  const wfResult = await callMcpTool(QUANTUM_MCP_SERVER, wfTool, wfParams);
  const wfText = String(wfResult.result);
  const wfIdMatch = wfText.match(/['"]?(wavefunction:\/\/[a-f0-9-]+)['"]?/);
  if (!wfIdMatch) throw new Error(`No wavefunction_id found in MCP response: ${wfText.slice(0, 200)}`);
  const wavefunctionId = wfIdMatch[1];

  // Step 2: Create potential (harmonic oscillator by default)
  const potParams = {
    potential_function: "0.5 * x**2",
    grid_size: [256],
    x_range: [-10.0, 10.0],
  };
  const potResult = await callMcpTool(QUANTUM_MCP_SERVER, "create_custom_potential", potParams);
  const potText = String(potResult.result);
  const potIdMatch = potText.match(/['"]?(potential:\/\/[a-f0-9-]+)['"]?/);
  const potentialId = potIdMatch?.[1] ?? "free";

  // Step 3: Solve Schrödinger equation
  const timeSteps = /fast|quick/.test(taskLower) ? 50 : 100;
  const solveParams = {
    potential: potentialId,
    initial_state: [wavefunctionId],
    time_steps: timeSteps,
    dt: 0.01,
  };
  const solveResult = await callMcpTool(QUANTUM_MCP_SERVER, "solve_schrodinger", solveParams);
  const solveText = String(solveResult.result);

  return `Quantum simulation complete (scicomp-quantum-mcp):\n` +
    `Wavefunction: ${wfIdMatch[1]}\n` +
    `Potential: ${potentialId}\n` +
    `Evolution: ${solveText.slice(0, 2000)}`;
}

async function runGeminiFallback(task: string, systemType: string): Promise<string> {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const prompt = `You are a quantum physics simulation engine. Using Python with NumPy, SciPy, and standard quantum mechanics libraries, perform the following quantum computation task.

System type: ${systemType}
Task: ${task}

Write and execute Python code to set up the quantum system, perform the computation, and return numerical results with physical interpretation.`;

  const config = {
    ...REQUIRED_CONFIG,
    systemInstruction: "You are a quantum physics simulator. Execute Python code for quantum mechanics computations. Always show the code and results.",
  };
  enforceModelConfig(REQUIRED_MODEL, config);

  const response = await genai.models.generateContent({ model: REQUIRED_MODEL, config, contents: prompt });
  return typeof response.text === "string" ? response.text : "";
}
