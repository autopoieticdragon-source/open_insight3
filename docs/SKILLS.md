# SKILLS.md: OpenInsight Progressive Disclosure Skill Ecosystem

## Overview

OpenInsight implements a **progressive disclosure pattern** for skill definitions. This maximizes context window utilization by:

1. **Lazy loading frontmatter** at agent initialization (name, description, parameters)
2. **Granular markdown protocol** loaded only when explicitly invoked
3. **Schema constraints** applied at skill execution time
4. **Error mitigation** layered progressively through execution phases

This document defines the core skill ecosystem and provides templates for extending the platform.

---

## 1. Skill Anatomy & Progressive Disclosure

### 1.1 Frontmatter (Always Loaded)

Every skill begins with YAML frontmatter that agents load at initialization:

```yaml
---
name: statistical-hypothesis-discovery
description: Coordinates statistical discovery engines (R/Python libraries). Infers causal graphs, evaluates parameter spaces, and calculates statistical significance bounds from raw research datasets.
version: 1.0.0
author: OpenInsight Core Team
use_case: When synthesizing data to formal mathematical assertions
license: MIT
category: "empirical-verification"
dependencies:
  - "causal-graph-tester"
  - "statistical-power-analyzer"
parameters:
  - name: "dataset_uri"
    type: "string"
    description: "Path to repository or data matrix"
    required: true
  - name: "variables"
    type: "object"
    description: "Independent and dependent variable specifications"
    required: true
  - name: "alpha_threshold"
    type: "number"
    description: "Statistical significance threshold"
    required: false
    default: 0.05
---
```

### 1.2 Markdown Protocol (Lazy-Loaded on Invocation)

Only when an agent explicitly calls a skill, the detailed markdown documentation is fetched:

```markdown
# Statistical Hypothesis Discovery Skill

## Workflow Execution Protocol

1. **Confounding Variable Extraction**: ...
2. **Statistical Power & Sample Size Analysis**: ...
3. **Sandbox Regression Construction**: ...

## Input Schema Expectation
[Detailed JSON schema]

## Boundary Failure Mitigation
[Edge case handling procedures]

## Output Specification
[Exact response format]

## Error Codes & Recovery
[List of possible errors and recovery strategies]
```

### 1.3 Execution-Time Constraints (Orthogonal Verification)

When the skill is invoked, a separate constraint engine validates:

- **Data invariants**: All inputs match schema
- **Domain-specific rules**: Statistical tests appropriate for data types
- **Security constraints**: No sensitive data in outputs
- **Reproducibility**: All random seeds explicit

---

## 2. Core Skill Catalog

### 2.1 `literature-synthesis-mcp`

**Category**: Knowledge Synthesis  
**Agent**: `lit-synthesizer`  
**Invocation**: `skill:literature-synthesis-mcp`

**Purpose**: Interface with academic search APIs and construct domain-specific knowledge graphs.

**Frontmatter**:
```yaml
---
name: literature-synthesis-mcp
description: Interfaces with Semantic Scholar, arXiv, and OpenAlex APIs to ingest, cluster, and synthesize academic literature. Maps conflicting conclusions and identifies citation gaps.
version: 1.1.0
parameters:
  - name: "query"
    type: "string"
    description: "Research topic or keyword query"
    required: true
  - name: "domain"
    type: "string"
    description: "Academic domain (e.g., physics, mathematics, biology)"
    required: true
  - name: "max_papers"
    type: "integer"
    description: "Maximum number of papers to retrieve"
    default: 500
  - name: "conflict_detection"
    type: "boolean"
    description: "Enable conflict detection across papers"
    default: true
---
```

**Execution Protocol** (Markdown):
1. Query Semantic Scholar with domain-specific bias filters
2. Extract metadata (authors, publication year, DOI, method, conclusions)
3. Cluster papers using semantic similarity (embeddings-based)
4. Detect conflicting conclusions (consensus vs. outliers)
5. Generate conflict resolution report

**Output Schema**:
```json
{
  "knowledge_graph": {
    "nodes": [
      {
        "id": "paper-1",
        "title": "...",
        "authors": ["..."],
        "year": 2025,
        "doi": "...",
        "abstract": "...",
        "method": "...",
        "conclusion": "..."
      }
    ],
    "edges": [
      {
        "source": "paper-1",
        "target": "paper-2",
        "relation": "cites | contradicts | builds-on | validates"
      }
    ],
    "conflicts": [
      {
        "paper_a": "...",
        "paper_b": "...",
        "nature": "methodological | empirical | theoretical",
        "resolution_strategy": "..."
      }
    ]
  },
  "execution_mode": "mcp | gemini | simulated"
}
```

**Boundary Failure Mitigation**:
- **No results**: Return empty graph with search guidance
- **API timeout**: Fall back to cached results or simulated responses
- **Conflicting metadata**: Use majority voting or return multiple interpretations

---

### 2.2 `hypothesis-generation`

**Category**: Hypothesis Formulation  
**Agent**: `insight-prover`  
**Invocation**: `skill:hypothesis-generation`

**Purpose**: Transform qualitative research targets into testable, operationally-specific hypotheses.

**Frontmatter**:
```yaml
---
name: hypothesis-generation
description: Formulates testable hypotheses with explicit assumptions, boundary conditions, and falsifiability criteria from research targets and literature synthesis outputs.
version: 1.0.0
parameters:
  - name: "research_target"
    type: "string"
    description: "High-level research objective"
    required: true
  - name: "literature_context"
    type: "object"
    description: "Knowledge graph or literature synthesis output"
    required: true
  - name: "hypothesis_type"
    type: "string"
    description: "directional | bidirectional | interaction | moderated"
    default: "directional"
---
```

**Execution Protocol**:
1. Parse research target into core theoretical mechanism
2. Extract relevant mechanisms and variables from literature context
3. Specify operationalization for each variable
4. Articulate core assumptions and boundary conditions
5. Define falsification conditions
6. Generate quantitative hypothesis statement with effect size prediction

**Output Schema**:
```json
{
  "hypothesis": {
    "id": "hyp-2026-001",
    "statement": "Protein X increases pathway activity under condition Y",
    "variables": {
      "independent": [
        {
          "name": "protein_X_concentration",
          "type": "continuous",
          "unit": "mol/L",
          "domain": [0, 1e-3]
        }
      ],
      "dependent": [
        {
          "name": "pathway_activity",
          "type": "continuous",
          "unit": "arbitrary_units",
          "measurement_procedure": "..."
        }
      ]
    },
    "core_assumptions": [
      "Linearity of dose-response relationship",
      "Homogeneity of variance across concentration ranges",
      "Independence of measurements"
    ],
    "boundary_conditions": [
      "Valid for protein X concentrations between 0 and 1 mM",
      "Only under aerobic conditions",
      "At pH 7.2-7.4"
    ],
    "predicted_effect": {
      "effect_size": 0.8,
      "sample_size_for_80_percent_power": 64,
      "statistical_test": "paired_t_test | linear_regression"
    },
    "falsification_conditions": [
      "Pathway activity shows non-monotonic response",
      "Effect reverses at high concentrations",
      "Confounder Z eliminates the effect"
    ]
  }
}
```

---

### 2.3 `statistical-modeling-sandbox`

**Category**: Empirical Verification  
**Agent**: `insight-prover`  
**Invocation**: `skill:statistical-modeling-sandbox`

**Purpose**: Generate and validate executable statistical modeling code for isolated Docker execution.

**Frontmatter**:
```yaml
---
name: statistical-modeling-sandbox
description: Generates execution-ready Python/R scripts for statistical analysis, regression modeling, and hypothesis testing. Code is deterministic, reproducible, and safe for sandbox execution.
version: 1.0.0
parameters:
  - name: "hypothesis"
    type: "object"
    description: "Hypothesis object from hypothesis-generation skill"
    required: true
  - name: "language"
    type: "string"
    description: "python | r"
    default: "python"
  - name: "include_robustness_checks"
    type: "boolean"
    description: "Include sensitivity analyses and robustness checks"
    default: true
---
```

**Execution Protocol**:
1. Parse hypothesis into statistical test specification
2. Generate code template (Python: statsmodels/scipy; R: tidyverse/ggm)
3. Embed assumption checks (normality, homogeneity, independence)
4. Add robustness checks (bootstrap, jackknife, Monte Carlo)
5. Inject deterministic random seeding
6. Validate syntax before returning

**Output Schema**:
```json
{
  "code": "import pandas as pd\nimport statsmodels.api as sm\n...",
  "language": "python",
  "assumptions_checked": [
    "normality: Shapiro-Wilk test",
    "homogeneity: Levene test",
    "independence: Durbin-Watson statistic"
  ],
  "robustness_checks_included": [
    "bootstrap_confidence_intervals",
    "jackknife_resampling",
    "sensitivity_to_outliers"
  ],
  "random_seed": 42,
  "expected_runtime": "2.3 seconds",
  "execution_mode": "docker-python3.11 | docker-r4.2"
}
```

**Boundary Failure Mitigation**:
- **Perfect separation**: Inject noise or bootstrap resampling
- **Singular matrix**: Add ridge regularization or reduce dimensionality
- **NaN/Inf results**: Flag and request input data review
- **Execution timeout**: Return partial results with warning

---

### 2.4 `p-value-stress-tester`

**Category**: Adversarial Verification  
**Agent**: `insight-verifier`  
**Invocation**: `skill:p-value-stress-tester`

**Purpose**: Stress-test statistical claims via power analysis, multiple comparisons, and distributional assumption violations.

**Frontmatter**:
```yaml
---
name: p-value-stress-tester
description: Simulates statistical tests under parameter perturbations, distributional violations, and multiple comparison scenarios to assess robustness of p-values and confidence intervals.
version: 1.0.0
parameters:
  - name: "test_specification"
    type: "object"
    description: "Test type, effect size, sample size"
    required: true
  - name: "num_simulations"
    type: "integer"
    description: "Number of Monte Carlo simulations"
    default: 10000
---
```

**Execution Protocol**:
1. **Power analysis**: Verify claimed sample size yields ≥80% power
2. **Multiple comparisons**: Apply Bonferroni/FDR and recalculate significance
3. **Assumption violations**: Simulate non-normal, heteroscedastic, dependent data
4. **Effect size sensitivity**: Vary effect size ±50% and recalculate power
5. **Replication uncertainty**: Bootstrap across hypothetical replications

**Output Schema**:
```json
{
  "stress_test_results": {
    "power_analysis": {
      "claimed_power": 0.80,
      "simulated_power": 0.82,
      "status": "PASS",
      "min_n_for_80_percent": 58,
      "claimed_n": 64
    },
    "multiple_comparisons": {
      "num_tests": 5,
      "bonferroni_alpha": 0.01,
      "significant_after_correction": 3,
      "status": "PASS"
    },
    "assumption_violations": [
      {
        "assumption": "normality",
        "violation": "heavy_tailed_t3_distribution",
        "effect_on_power": -0.08,
        "recommendation": "Use non-parametric test or increase N"
      }
    ]
  },
  "confidence_score": 85
}
```

---

### 2.5 `boundary-condition-evaluator`

**Category**: Adversarial Verification  
**Agent**: `insight-verifier`  
**Invocation**: `skill:boundary-condition-evaluator`

**Purpose**: Test methodology at parameter extremes, singularities, and edge cases.

**Execution Protocol**:
1. Identify critical parameters from hypothesis
2. Evaluate at boundary values (0, ±∞, discontinuities)
3. Check for numerical singularities or undefined behavior
4. Test at parametric inflection points
5. Assess robustness to extreme but plausible values

**Output Schema**:
```json
{
  "boundary_tests": [
    {
      "parameter": "concentration",
      "test_value": 0.0,
      "result": "singularity_detected | valid",
      "issue": "Division by zero in denominator",
      "recommendation": "Add epsilon floor or reparameterize"
    }
  ],
  "overall_status": "PASS | CONDITIONAL | FAIL",
  "critical_boundaries": ["concentration = 0", "temperature = 273K"]
}
```

---

## 3. Skill Extension Template

To add a new skill to OpenInsight, use this template:

### 3.1 Frontmatter Template

```yaml
---
name: your-skill-name
description: One-sentence description of what the skill does and when to use it.
version: 1.0.0
author: Your Name or Team
license: MIT
category: "category_name"
dependencies:
  - "dependency-1"
  - "dependency-2"
parameters:
  - name: "param_1"
    type: "string | object | array | number | boolean"
    description: "What this parameter does"
    required: true | false
    default: "optional_default_value"
---
```

### 3.2 Markdown Protocol Template

```markdown
# Your Skill Name

## Workflow Execution Protocol

1. **Step 1**: Description
2. **Step 2**: Description
3. **Step 3**: Description

## Input Schema Expectation

\`\`\`json
{
  "param_1": "...",
  "param_2": {...}
}
\`\`\`

## Boundary Failure Mitigation

- **Failure Case 1**: How the skill handles it
- **Failure Case 2**: How the skill handles it

## Output Specification

\`\`\`json
{
  "success": true,
  "result": {...},
  "execution_mode": "mcp | gemini | simulated"
}
\`\`\`

## Error Codes & Recovery

| Code | Description | Recovery |
|------|-------------|----------|
| 400 | Input validation failed | Check input schema |
| 500 | Execution error | Review logs |
```

---

## 4. MCP Server Mapping

Each skill maps to one or more MCP servers:

| Skill | MCP Server | Tools |
|-------|-----------|-------|
| `literature-synthesis-mcp` | `semantic-scholar-mcp` | search, metadata-extract, conflict-detect |
| `statistical-modeling-sandbox` | `scicomp-math-mcp` | regression, hypothesis-testing, power-analysis |
| `p-value-stress-tester` | `scicomp-math-mcp` | monte-carlo-simulator, distribution-sampler |
| `boundary-condition-evaluator` | `symbolic-math-mcp` | evaluate-at-boundaries, singularity-detect |

---

## 5. Skill Availability & Execution Modes

All skills report their current execution mode in response:

| Mode | Description |
|------|-------------|
| `"mcp"` | Real native MCP server subprocess (best quality) |
| `"gemini"` | Gemini AI code execution fallback |
| `"simulated"` | Pattern-matching fallback (no API key, no binary) |

---

## References

- MCP Specification: https://modelcontextprotocol.io/
- Skill Development Guide: `docs/SKILL_DEVELOPMENT.md`
- Example Skills: `skills/` directory

---

**Last Updated**: 2026-06-17  
**Status**: Production-Grade