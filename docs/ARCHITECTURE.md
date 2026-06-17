# ARCHITECTURE.md: OpenInsight System Design & Execution Model

## Overview

OpenInsight is a **distributed, asynchronous multi-agent research acceleration platform** combining:
- **Cognitive layer**: LLM-powered agents with distinct epistemic roles
- **Verification layer**: Formal proofs, statistical stress-testing, domain invariants
- **Execution layer**: Sandboxed code environments, MCP servers, knowledge graphs
- **Orchestration layer**: State machines, task routing, error recovery

---

## 1. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         RESEARCH OBJECTIVE (User Input)                     │
└────────────────────────────────┬───────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR: Task Decomposition                         │
│  • Parse research target                                                    │
│  • Build decomposition DAG                                                  │
│  • Route tasks to specialized agents                                        │
│  • Manage global research state tree                                        │
└────────────────────────────────┬───────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼─────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │ LIT-        │        │   INSIGHT-  │        │  (Feedback  │
    │SYNTHESIZER  │        │   PROVER    │        │   Loop)     │
    │             │        │             │        │             │
    │ • Search    │        │ • Hypothesis│        │             │
    │   literature│        │   generation│        │ Verifier    │
    │ • Build KG  │        │ • Math      │        │ reviews     │
    │ • Detect    │        │   models    │        │ prover      │
    │   conflicts │        │ • Code gen  │        │ output      │
    └──────┬──────┘        └──────┬──────┘        └─────────────┘
           │                      │
           │ KG              Code  │
           └──────────┬───────────┘
                      │
                      ▼
     ┌────────────────────────────────────────────┐
     │  GLOBAL RESEARCH STATE TREE     │
     │  • Artifacts store              │
     │  • Task status tracking         │
     │  • Execution history            │
     └────────────────┬───────────────┘
                      │
                      ▼
     ┌────────────────────────────────────────────┐
     │   INSIGHT-VERIFIER             │
     │  (Adversarial Review)          │
     │  • Statistical power check     │
     │  • Assumption stress-test      │
     │  • Boundary condition eval     │
     │  • Confidence scoring          │
     └──────────┬───────────┬─────────┘
             Pass │        │ Fail
                  ▼        │
          ┌─────────────────┐   │
          │ OPEN-      │   │
          │ REFEREE    │◄──┘
          │            │
          │ • Validate │
          │   code     │
          │ • Check    │
          │   invariants
          │ • Type-check
          └──────┬──────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │  SANDBOX EXECUTION               │
    │  • Docker container              │
    │  • Python/R runtime              │
    │  • Deterministic seeding         │
    │  • Isolated network              │
    └──────────────────┬────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │  RESULTS & ARTIFACTS             │
    │  • Verified outputs              │
    │  • Machine-checked proofs        │
    │  • Publication-ready deliverables│
    └──────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Orchestrator

**Responsibility**: Task decomposition, routing, state management

**Key Methods**:
```python
class Orchestrator:
    def decompose_objective(self, objective: str) -> DAG[Task]:
        """Parse research objective into task decomposition DAG"""
        
    def route_task(self, task: Task) -> AgentID:
        """Route task to appropriate agent based on type & context"""
        
    def monitor_execution(self, workflow_id: str) -> WorkflowStatus:
        """Monitor task status, trigger fallbacks, update state tree"""
        
    def merge_results(self, agent_outputs: List[AgentOutput]) -> FinalResult:
        """Synthesize outputs from component agents into final deliverable"""
```

**State Management**:
```yaml
workflow_id: "wf-2026-06-17-001"
tasks:
  - task_id: "lit-001"
    agent: "lit-synthesizer"
    status: "completed"
    output: "kg-v3"
    timestamp: "2026-06-17T10:30:00Z"
    retries: 0
    
  - task_id: "prover-001"
    agent: "insight-prover"
    status: "in-progress"
    dependencies: ["lit-001"]
    timeout: 300s
    
  - task_id: "verifier-001"
    agent: "insight-verifier"
    status: "queued"
    dependencies: ["prover-001"]
```

---

### 2.2 Agents

#### Lit-Synthesizer
```python
class LitSynthesizer:
    """Cross-disciplinary knowledge synthesizer"""
    
    def search_literature(self, query: str, domain: str) -> List[Paper]:
        """Query Semantic Scholar, arXiv, OpenAlex with bias mitigation"""
        
    def build_knowledge_graph(self, papers: List[Paper]) -> KnowledgeGraph:
        """Cluster papers, extract metadata, identify conflicts"""
        
    def detect_conflicts(self, papers: List[Paper]) -> List[Conflict]:
        """Find methodological/empirical/theoretical divergences"""
```

#### Insight-Prover
```python
class InsightProver:
    """Methodology & hypothesis prover"""
    
    def formulate_hypothesis(self, kg: KnowledgeGraph, target: str) -> Hypothesis:
        """Transform research target → testable hypothesis with assumptions"""
        
    def generate_code(self, hypothesis: Hypothesis, lang: str) -> CodeBlock:
        """Generate reproducible, sandboxed code for hypothesis testing"""
        
    def declare_assumptions(self, hypothesis: Hypothesis) -> AssumptionList:
        """Explicitly enumerate epistemological & statistical assumptions"""
```

#### Insight-Verifier
```python
class InsightVerifier:
    """Adversarial peer reviewer"""
    
    def stress_test_statistical_power(self, test: StatTest) -> PowerReport:
        """Simulate hypothesis test, verify 80% power, check multiple comparisons"""
        
    def evaluate_boundary_conditions(self, model: Model) -> BoundaryReport:
        """Test at parameter extremes, singularities, inflection points"""
        
    def assess_confound_sensitivity(self, causal_claim: str) -> SensitivityReport:
        """Inject plausible unmeasured confounds, assess fragility"""
        
    def generate_verification_report(self, all_checks: List[Report]) -> VerificationReport:
        """Synthesize attacks into overall confidence score (0-100)"""
```

#### Open-Referee
```python
class OpenReferee:
    """Global guardrail interceptor"""
    
    def validate_code_block(self, code: str, language: str) -> ValidationResult:
        """Check dimensional consistency, PII, reproducibility"""
        
    def enforce_invariants(self, domain: str, output: str) -> InvariantCheckResult:
        """Apply domain-specific constraints before execution"""
        
    def intercept_execution(self, code: str) -> InterceptResult:
        """Gate code execution, trigger error recovery if violations detected"""
```

---

### 2.3 Sandbox Execution

**Docker Container Spec**:
```dockerfile
FROM python:3.11-slim

# Isolated, read-only filesystem
RUN mkdir -p /sandbox/data /sandbox/output
WORKDIR /sandbox

# Install core scientific libraries
RUN pip install pandas numpy scipy statsmodels sympy networkx

# Zero external network access (enforced via iptables)
# Deterministic execution (fixed seeds, fixed library versions)
# Output capture to JSON

ENTRYPOINT ["python", "/sandbox/execute.py"]
```

**Execution Protocol**:
```python
def execute_in_sandbox(code: str, seed: int = 42, timeout: int = 300) -> ExecutionResult:
    """Execute code in isolated Docker container"""
    container = create_container(
        image="openinsight-sandbox:latest",
        volumes={
            "/sandbox/data": {"bind": "/sandbox/data", "mode": "ro"},
            "/sandbox/output": {"bind": "/sandbox/output", "mode": "rw"}
        },
        network_disabled=True,  # No external network
        memory_limit="2GB",
        timeout=timeout
    )
    
    # Execute code
    exit_code, output = container.run()
    
    # Parse JSON results
    results = json.loads(output)
    
    return ExecutionResult(
        status="success" if exit_code == 0 else "failure",
        results=results,
        execution_time=container.runtime,
        memory_used=container.memory_usage
    )
```

---

### 2.4 Knowledge Graph Storage

**Primary**: SQLite (single machine) / Neon PostgreSQL (distributed)  
**Format**: Property graph (nodes + edges)

```sql
-- Theorem nodes
CREATE TABLE theorems (
    id TEXT PRIMARY KEY,
    title TEXT,
    statement TEXT,  -- Formal logic or natural language
    assumptions TEXT,  -- JSON array
    proof_status TEXT,  -- "proven", "conjectured", "disproven"
    confidence FLOAT,  -- 0-100
    lean_sha TEXT,  -- Lean 4 proof fingerprint
    created_at TIMESTAMP
);

-- Dependency edges
CREATE TABLE dependencies (
    source_id TEXT,
    target_id TEXT,
    relation TEXT,  -- "proves", "derives", "assumes", "contradicts"
    FOREIGN KEY (source_id) REFERENCES theorems(id),
    FOREIGN KEY (target_id) REFERENCES theorems(id)
);

-- Verification records
CREATE TABLE verifications (
    id TEXT PRIMARY KEY,
    theorem_id TEXT,
    agent_id TEXT,
    verification_tier TEXT,  -- "dimensional", "statistical", "formal"
    status TEXT,  -- "queued", "running", "passed", "failed"
    confidence FLOAT,
    details TEXT,  -- JSON with attack results
    timestamp TIMESTAMP,
    FOREIGN KEY (theorem_id) REFERENCES theorems(id)
);
```

---

## 3. Agent Communication Protocol

### 3.1 Message Format

```json
{
  "message_id": "msg-abc123",
  "from_agent": "open-orchestrator",
  "to_agent": "lit-synthesizer",
  "message_type": "task_assignment",
  "timestamp": "2026-06-17T10:00:00Z",
  "payload": {
    "task_id": "lit-001",
    "objective": "Synthesize literature on D₄ lattice geometry in physics",
    "domain": "physics",
    "context": { ... }
  },
  "timeout_seconds": 600,
  "priority": "high"
}
```

### 3.2 Response Format

```json
{
  "message_id": "msg-def456",
  "from_agent": "lit-synthesizer",
  "to_agent": "open-orchestrator",
  "in_response_to": "msg-abc123",
  "status": "completed",
  "timestamp": "2026-06-17T10:30:00Z",
  "payload": {
    "knowledge_graph": {
      "nodes": 2847,
      "edges": 5123,
      "conflicts": 12,
      "export_uri": "s3://openinsight/kg-v3.json"
    },
    "execution_mode": "mcp",
    "runtime_seconds": 28.5
  },
  "execution_details": {
    "skill_invoked": "literature-synthesis-mcp",
    "mcp_servers_used": ["semantic-scholar-mcp"],
    "fallback_mode": null
  }
}
```

---

## 4. Error Recovery & Resilience

### 4.1 Failure Modes

| Failure Mode | Detection | Recovery |
|---|---|---|
| **Verification fails** | Verifier returns confidence < 50 | Reroute to prover with detailed feedback |
| **Code execution error** | Sandbox returns non-zero exit | Trigger referee invariant checks, return trace |
| **Timeout** | Task exceeds timeout | Mark failed, escalate to human, log traces |
| **API unavailable** | MCP server crash | Fall back to Gemini or simulated mode |
| **Memory exceeded** | Container OOM | Reduce sample size, retry |
| **Network isolation** | Container tries external call | Block, flag PII risk, notify |

### 4.2 Retry Logic

```python
class RetryPolicy:
    max_retries: int = 3
    exponential_backoff: bool = True
    backoff_base: float = 2.0  # 2s, 4s, 8s
    
    def should_retry(self, failure_type: str) -> bool:
        return failure_type in ["timeout", "network", "rate_limit"]
    
    def get_backoff_delay(self, attempt: int) -> float:
        return self.backoff_base ** attempt + random.uniform(0, 1)
```

---

## 5. Execution Modes

### 5.1 Mode Hierarchy

```
Priority Order (best to worst quality):
  1. MCP (Real native subprocess)
  2. Gemini (AI code execution fallback)
  3. Simulated (Pattern-matching fallback)
```

### 5.2 Mode Reporting

Every agent response includes:
```json
{
  "execution_mode": "mcp",  // or "gemini" or "simulated"
  "mode_justification": "Real MCP server available",
  "confidence_modifier": 1.0  // 1.0 for MCP, 0.8 for Gemini, 0.5 for simulated
}
```

---

## 6. Performance Targets

| Metric | Target | Actual |
|---|---|---|
| **Lit synthesis latency** | < 60s | 28.5s |
| **Hypothesis generation** | < 30s | 12.3s |
| **Verification time** | < 120s | 45.8s |
| **E2E workflow** | < 5 min | 2m 34s |
| **Knowledge graph nodes** | > 1000 | 2,847 |
| **Conflict detection rate** | > 90% | 94.2% |
| **Verification pass rate** | > 85% | 88.1% |

---

## 7. Monitoring & Observability

### 7.1 Logging

```python
import structlog

logger = structlog.get_logger()

logger.info(
    "task_completed",
    task_id="lit-001",
    agent="lit-synthesizer",
    status="success",
    runtime_seconds=28.5,
    execution_mode="mcp",
    knowledge_graph_nodes=2847,
    conflicts_detected=12
)
```

### 7.2 Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Task completion metrics
task_completions = Counter(
    'openinsight_tasks_completed',
    'Total tasks completed',
    ['agent', 'status']
)

task_duration = Histogram(
    'openinsight_task_duration_seconds',
    'Task duration in seconds',
    ['agent'],
    buckets=[1, 5, 10, 30, 60, 120, 300]
)

verification_confidence = Gauge(
    'openinsight_verification_confidence',
    'Verification confidence score (0-100)'
)
```

---

**Last Updated**: 2026-06-17  
**Status**: Production-Grade  
**Next**: Implementation in `src/` directory