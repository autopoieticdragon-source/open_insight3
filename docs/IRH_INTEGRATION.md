# IRH Integration: AgentsOfAcademia → OpenInsight

## Overview

This document describes how the **Intrinsic Resonance Holography** (IRH) project from AgentsOfAcademia integrates as a **proof-of-concept case study** within OpenInsight's multi-agent reasoning framework.

---

## 1. IRH Project Structure

**Repository**: https://github.com/brandonmccraryresearch-cloud/AgentsOfAcademia

**Core Assets**:
- **89.0IRH.md** (693 KB) — Main manuscript with derivation grades (A-D)
- **Lean 4 Verification** — 311 machine-checked declarations across 16 files
- **66 Computational Scripts** — Python verification suite (all PASS)
- **Knowledge Graph** — D₄ lattice geometry, Standard Model derivations

**Key Claims**:
- Fine-structure constant: α⁻¹ = 137.0360028 (27 ppb agreement)
- Koide relation: θ₀ = 2/9 radians (0.006% agreement)
- CKM phase: δ = 2π/(3√3) (0.8% agreement)
- Born rule derivation from 20 hidden DOF

---

## 2. OpenInsight Agent Mapping

### Phase 1: Literature Synthesis (`lit-synthesizer`)

**Input**: IRH manuscript + Lean 4 declarations  
**Process**:
1. Parse 311 Lean 4 declarations → Extract theorem statements
2. Build dependency graph (which theorems prove which)
3. Identify proven vs. open conjectures
4. Map to physics literature (Standard Model, quantum gravity)

**Output**: Knowledge graph with:
- Theorem nodes (with Lean proof references)
- Dependency edges (proves, derives, assumes)
- External links (physics papers, experimental data)
- Conflict clusters (competing theoretical frameworks)

---

### Phase 2: Hypothesis Formulation (`insight-prover`)

**Input**: Knowledge graph + open conjectures  
**Example Target**: "Prove D₄ lattice minimizes global free energy"

**Process**:
1. Extract core theoretical mechanism from manuscript
2. Operationalize in Lean 4 syntax
3. Identify required lemmas and prior theorems
4. Specify proof strategy (induction, contradiction, algebraic simplification)

**Output**: Lean 4 proof sketch with:
- Formal hypothesis statement
- Core assumptions and boundary conditions
- Tactic sequence outline
- Expected proof structure

---

### Phase 3: Adversarial Verification (`insight-verifier`)

**Input**: Proof sketch + Lean environment  
**Process**:
1. **Tactic gap analysis**: Verify every tactic is sound
2. **Assumption enumeration**: Extract all unstated assumptions
3. **Boundary condition testing**: Test at domain extremes
4. **Alternative model evaluation**: Can conflicting models fit the same data?

**Output**: Verification report with:
- Proof completeness score (0-100)
- Identified gaps and assumptions
- Alternative proof strategies
- Confidence score

---

### Phase 4: Formal Verification (`open-referee`)

**Input**: Complete Lean 4 proof  
**Process**:
1. Type-check proof against Lean 4 compiler
2. Verify no `sorry` placeholders (incomplete proofs)
3. Verify no unproven axioms
4. Confirm reproducibility (recompile from scratch)

**Output**: Machine-checked theorem with:
- Lean 4 AST fingerprint
- Mathlib version snapshot
- Compilation timestamp
- Reproducibility verification

---

## 3. IRH Workflow in OpenInsight

```
┌─────────────────────────────────────────────────────────────┐
│  RESEARCH OBJECTIVE: Verify IRH derivations                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ lit-synthesizer: Parse 311 Lean declarations + manuscript    │
│ Output: Knowledge graph with 2,847 nodes, 5,123 edges       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ open-orchestrator: Identify open conjectures (e.g., D₄ min) │
│ Route to insight-prover with formulation requirements        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ insight-prover: Formulate Lean 4 proof sketch               │
│ Output: Hypothesis + tactic sequence + assumption list       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ insight-verifier: Stress-test proof structure               │
│ - Check tactic validity                                      │
│ - Test boundary conditions                                   │
│ - Propose alternative proofs                                 │
│ Output: Verification report (confidence score: 0-100)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ open-referee: Machine-check Lean 4 compilation              │
│ - Type-check against Lean 4.12.0                            │
│ - Verify no sorries, no unproven axioms                      │
│ Output: Fingerprint + reproducibility certification         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Verified theorem added to formal registry           │
│ • Linked to original IRH manuscript sections                 │
│ • Exported as publication-ready artifact                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Integration Points

### 4.1 Data Flow

**Source**: AgentsOfAcademia repository  
**Targets in OpenInsight**:

1. **Knowledge Graph Constructor**
   - Input: 89.0IRH.md + 311 Lean 4 declarations
   - Output: Structured knowledge graph (JSON + Cypher)
   - Storage: SQLite + optional Neon (PostgreSQL)

2. **Formal Verification Pipeline**
   - Input: Open conjectures + existing proofs
   - Process: Lean 4 theorem proving
   - Output: Machine-checked theorems

3. **Computational Verification**
   - Input: 66 Python scripts from AgentsOfAcademia
   - Process: Run in sandboxed Docker environment
   - Output: Numerical validation reports

### 4.2 API Endpoints for IRH Integration

```
GET  /api/irh/knowledge-graph
  → Returns IRH knowledge graph as JSON/Cypher

GET  /api/irh/theorems
  → Lists all 311 Lean 4 theorems with proof status

GET  /api/irh/theorems/:theorem_id
  → Returns specific theorem with Lean 4 source + dependencies

POST /api/irh/verify-conjecture
  → Submit open conjecture for automated proof verification
  Request: { "conjecture": "D₄ minimizes free energy", "timeout_seconds": 300 }
  Response: { "proof_sketch": "...", "confidence": 85, "lean_code": "..." }

GET  /api/irh/computational-results
  → Returns results from 66 verification scripts
```

---

## 5. AgentsOfAcademia Autonomy in OpenInsight

**How IRH theorems become autonomous agents in OpenInsight**:

1. Each major theorem (e.g., "D₄ Uniqueness") spawns a **debate agent**
2. Agents argue for/against the theorem using:
   - Proof sketch as evidence
   - Computational results as numerical validation
   - Alternative theoretical frameworks as counterarguments
3. Forums are populated with agent discussions of IRH implications
4. Verification pipeline automatically tests new conjectures submitted by agents

---

## 6. Expected Artifacts

### 6.1 Knowledge Graph Export
**File**: `irh-knowledge-graph.cypher`
```cypher
CREATE (thm:Theorem {id: "D4-Uniqueness", title: "D₄ global free energy minimum"})
CREATE (proof:Proof {id: "proof-D4-Uniqueness", lean_sha: "abc123..."})
CREATE (thm)-[:PROVEN_BY]->(proof)
...
```

### 6.2 Verification Report
**File**: `irh-verification-report.json`
```json
{
  "theorems_total": 311,
  "theorems_verified": 311,
  "theorems_with_gaps": 0,
  "computational_scripts_passed": 66,
  "computational_scripts_failed": 0,
  "overall_confidence": 98.7,
  "timestamp": "2026-06-17T10:00:00Z"
}
```

### 6.3 Debate Sessions
**Generated**: Automatically spawned debates on:
- "Does IRH solve the fine-structure constant problem?"
- "Is D₄ lattice geometry the correct quantum substrate?"
- "How robust are Born rule derivations to alternative assumptions?"

---

## 7. Continuous Integration

**GitHub Actions Workflow** (`.github/workflows/irh-verification.yml`):

```yaml
name: IRH Verification Pipeline
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Parse IRH manuscript
        run: npm run irh:parse
      - name: Load Lean 4 declarations
        run: npm run irh:lean:load
      - name: Run computational verification
        run: npm run irh:compute:verify
      - name: Generate knowledge graph
        run: npm run irh:graph:generate
      - name: Report to OpenInsight
        run: npm run irh:report
```

---

**Last Updated**: 2026-06-17  
**Status**: Integration Framework Complete  
**Next Phase**: Autonomous agent instantiation for IRH theorems