# QUICK_START.md: Installation & First Workflow

## Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Git
- Gemini API key (free tier available)

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/autopoieticdragon-source/open_insight3.git
cd open_insight3
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Initialize Database

```bash
python -m src.db.init
```

---

## Your First Workflow

### Option A: CLI

```bash
python -m src.cli run-workflow \
  --objective "Reconcile conflicting interpretations of quantum measurement in the Many-Worlds vs Objective Collapse debate" \
  --domain "physics"
```

### Option B: REST API

```bash
# Create workflow
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"objective": "Analyze metabolic pathway interactions in Systems Biology"}'

# Response:
# {"workflow_id": "wf-2026-06-17-001", "status": "queued"}

# Check status
curl http://localhost:8000/api/workflows/wf-2026-06-17-001

# Stream events
curl http://localhost:8000/api/workflows/wf-2026-06-17-001/stream
```

### Option C: Python SDK

```python
from src.orchestrator import Orchestrator

orchestrator = Orchestrator()

workflow = orchestrator.create_workflow(
    objective="Prove the D₄ lattice minimizes global free energy",
    domain="physics",
    irh_mode=True  # Enable IRH-specific agents
)

# Execute (blocking)
results = orchestrator.execute(workflow.id)

print(f"Status: {results['status']}")
print(f"Knowledge Graph Nodes: {results['kg_nodes']}")
print(f"Verification Confidence: {results['verification_confidence']}")
```

---

## IRH Integration Example

### Load AgentsOfAcademia IRH Project

```python
from src.integrations.irh_loader import IRHLoader

irh = IRHLoader.load_from_repository(
    repo_url="https://github.com/brandonmccraryresearch-cloud/AgentsOfAcademia"
)

# Automatically parse 311 Lean 4 declarations
print(f"Theorems loaded: {len(irh.theorems)}")
print(f"Open conjectures: {len(irh.conjectures)}")

# Verify a specific conjecture
result = irh.verify_conjecture(
    "D₄ lattice is the global free energy minimum among all 4D root lattices",
    timeout_seconds=600
)

print(f"Confidence: {result['confidence']}/100")
print(f"Proof sketch: {result['proof_sketch']}")
```

---

## Monitoring

### View Logs

```bash
# Real-time logs
docker-compose logs -f app

# Filter by agent
docker-compose logs app | grep "lit-synthesizer"
```

### Metrics

Prometheus metrics available at `http://localhost:9090`

```promql
# Task completion rate
rate(openinsight_tasks_completed[5m])

# Average verification confidence
avg(openinsight_verification_confidence)
```

---

## Troubleshooting

### Issue: "No module named 'src'"

```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue: Docker container won't start

```bash
# Check logs
docker-compose logs app

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Gemini API errors

```bash
# Verify API key
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3-1-pro-preview?key=$GEMINI_API_KEY
```

---

## Next Steps

1. **Create custom skills**: `docs/SKILLS.md` → Extend with domain-specific verification
2. **Deploy to production**: `docs/IMPLEMENTATION.md` → Kubernetes, GCP, AWS
3. **Integrate your research**: `docs/IRH_INTEGRATION.md` → Adapt IRH pattern to your domain

---

**Last Updated**: 2026-06-17  
**Support**: See README.md or open an issue on GitHub