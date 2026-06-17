# IMPLEMENTATION.md: Backend Scaffolding & Deployment Guide

## Project Structure

```
open_insight3/
├── docs/
│   ├── AGENTS.md              # Multi-agent topology
│   ├── SKILLS.md              # Progressive disclosure skills
│   ├── IRH_INTEGRATION.md     # AgentsOfAcademia integration
│   ├── ARCHITECTURE.md        # System design (NEW)
│   └── IMPLEMENTATION.md      # This file
│
├── src/
│   ├── __init__.py
│   ├── config.py              # Configuration & environment
│   ├── orchestrator.py        # Task decomposition & routing
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py            # AgentBase abstract class
│   │   ├── lit_synthesizer.py # Knowledge synthesis agent
│   │   ├── insight_prover.py  # Hypothesis prover agent
│   │   └── insight_verifier.py# Adversarial verifier agent
│   │
│   ├── skills/
│   │   ├── __init__.py
│   │   ├── skill_loader.py    # Progressive disclosure loader
│   │   ├── base.py            # SkillBase abstract class
│   │   ├── literature_synthesis.py
│   │   ├── hypothesis_generation.py
│   │   ├── statistical_modeling.py
│   │   ├── p_value_stress_tester.py
│   │   └── boundary_evaluator.py
│   │
│   ├── sandbox/
│   │   ├── __init__.py
│   │   ├── docker_runner.py   # Docker execution interface
│   │   ├── code_validator.py  # Code & invariant checks
│   │   └── mcp_server.py      # MCP protocol handler
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── session.py         # Database session factory
│   │   └── queries.py         # Optimized query layer
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── app.py             # FastAPI application
│   │   ├── routes/
│   │   │   ├── agents.py      # Agent endpoints
│   │   │   ├── workflows.py   # Workflow management
│   │   │   ├── verifications.py# Verification status
│   │   │   └── irh.py         # IRH-specific endpoints
│   │   └── schemas.py         # Pydantic models
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py          # Structured logging
│   │   ├── metrics.py         # Prometheus metrics
│   │   ├── state_tree.py      # Global state management
│   │   └── error_handlers.py  # Unified error handling
│   │
│   └── integrations/
│       ├── __init__.py
│       ├── semantic_scholar.py# Academic search API
│       ├── lean4.py           # Lean 4 integration
│       ├── irh_loader.py      # AgentsOfAcademia loader
│       └── gemini.py          # Google Gemini fallback
│
├── docker/
│   ├── Dockerfile             # Main app container
│   ├── Dockerfile.sandbox     # Isolated execution sandbox
│   └── docker-compose.yml     # Multi-service orchestration
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # Unit tests, linting
│       ├── irh-verify.yml     # IRH verification pipeline
│       └── deployment.yml     # Production deployment
│
├── tests/
│   ├── test_agents.py
│   ├── test_skills.py
│   ├── test_sandbox.py
│   ├── test_api.py
│   └── test_irh_integration.py
│
├── requirements.txt           # Python dependencies
├── docker-compose.yml         # Docker services
├── .env.example               # Environment template
├── README.md                  # Quick start
└── pyproject.toml             # Poetry/pip config
```

---

## Core Modules

### 1. Base Agent Class

**File**: `src/agents/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import structlog

logger = structlog.get_logger()

class AgentBase(ABC):
    """Abstract base class for all OpenInsight agents"""
    
    def __init__(self, agent_id: str, model_target: str, allowed_skills: list):
        self.agent_id = agent_id
        self.model_target = model_target  # Claude, o1, DeepSeek, etc.
        self.allowed_skills = allowed_skills
        self.execution_history = []
    
    @abstractmethod
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming task, return results"""
        pass
    
    def invoke_skill(self, skill_name: str, parameters: Dict) -> Dict:
        """Load and invoke a skill with progressive disclosure"""
        if skill_name not in self.allowed_skills:
            raise ValueError(f"Skill {skill_name} not allowed for {self.agent_id}")
        
        # Progressive disclosure: load frontmatter only initially
        skill = SkillLoader.load_frontmatter(skill_name)
        
        # Validate parameters against schema
        SkillLoader.validate_parameters(skill_name, parameters)
        
        # Load full protocol and execute
        result = SkillLoader.execute(skill_name, parameters)
        
        logger.info(
            "skill_invoked",
            agent_id=self.agent_id,
            skill=skill_name,
            execution_mode=result.get("execution_mode")
        )
        
        return result
    
    def log_execution(self, task_id: str, status: str, output: Dict):
        """Log execution to history and database"""
        entry = {
            "task_id": task_id,
            "agent_id": self.agent_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "output_size_kb": len(str(output).encode()) / 1024
        }
        self.execution_history.append(entry)
        logger.info("execution_logged", **entry)
```

### 2. Skill Loader (Progressive Disclosure)

**File**: `src/skills/skill_loader.py`

```python
import yaml
import json
from typing import Dict, Any
from pathlib import Path

class SkillLoader:
    """Progressive disclosure skill loading system"""
    
    SKILLS_DIR = Path(__file__).parent / "definitions"
    CACHE = {}  # In-memory cache for loaded frontmatter
    
    @staticmethod
    def load_frontmatter(skill_name: str) -> Dict:
        """Load YAML frontmatter only (lazy loading)"""
        if skill_name in SkillLoader.CACHE:
            return SkillLoader.CACHE[skill_name]
        
        skill_file = SkillLoader.SKILLS_DIR / f"{skill_name}.md"
        with open(skill_file, 'r') as f:
            content = f.read()
            # Extract YAML frontmatter (between --- delimiters)
            yaml_section = content.split('---')[1]
            frontmatter = yaml.safe_load(yaml_section)
        
        SkillLoader.CACHE[skill_name] = frontmatter
        return frontmatter
    
    @staticmethod
    def load_full_protocol(skill_name: str) -> str:
        """Load full markdown protocol (on-demand)"""
        skill_file = SkillLoader.SKILLS_DIR / f"{skill_name}.md"
        with open(skill_file, 'r') as f:
            content = f.read()
            # Return markdown section after YAML
            return content.split('---')[2]
    
    @staticmethod
    def validate_parameters(skill_name: str, parameters: Dict) -> bool:
        """Validate parameters against skill schema"""
        frontmatter = SkillLoader.load_frontmatter(skill_name)
        required_params = {p['name'] for p in frontmatter['parameters'] if p.get('required')}
        provided_params = set(parameters.keys())
        
        missing = required_params - provided_params
        if missing:
            raise ValueError(f"Missing required parameters: {missing}")
        
        return True
    
    @staticmethod
    def execute(skill_name: str, parameters: Dict) -> Dict:
        """Execute skill with appropriate MCP server or fallback"""
        frontmatter = SkillLoader.load_frontmatter(skill_name)
        
        # Try MCP first
        mcp_result = MCPServer.invoke(
            skill_name=skill_name,
            parameters=parameters,
            timeout=300
        )
        
        if mcp_result['success']:
            mcp_result['execution_mode'] = 'mcp'
            return mcp_result
        
        # Fall back to Gemini
        gemini_result = GeminiExecutor.run(
            skill_name=skill_name,
            parameters=parameters
        )
        gemini_result['execution_mode'] = 'gemini'
        return gemini_result
```

### 3. Docker Sandbox Runner

**File**: `src/sandbox/docker_runner.py`

```python
import docker
import json
import time
from typing import Dict, Tuple

class DockerSandbox:
    """Execute code in isolated Docker containers"""
    
    def __init__(self):
        self.client = docker.from_env()
        self.image = "openinsight-sandbox:latest"
    
    def execute(
        self,
        code: str,
        language: str = "python",
        seed: int = 42,
        timeout: int = 300,
        memory_limit: str = "2GB"
    ) -> Dict:
        """Execute code in sandbox, return results"""
        
        # Create temp file with code
        script_path = f"/tmp/script_{int(time.time())}.{language}"
        with open(script_path, 'w') as f:
            f.write(f"import json\nRANDOM_SEED = {seed}\n")
            f.write(code)
        
        # Mount volumes
        volumes = {
            script_path: {'bind': '/sandbox/script', 'mode': 'ro'},
            '/tmp/output': {'bind': '/sandbox/output', 'mode': 'rw'}
        }
        
        # Run container
        try:
            container = self.client.containers.run(
                self.image,
                command=f"python /sandbox/script",
                volumes=volumes,
                network_disabled=True,
                mem_limit=memory_limit,
                timeout=timeout,
                detach=True
            )
            
            # Wait for completion
            exit_code = container.wait(timeout=timeout)['StatusCode']
            logs = container.logs().decode()
            
            # Parse results
            with open('/tmp/output/results.json', 'r') as f:
                results = json.load(f)
            
            return {
                "status": "success" if exit_code == 0 else "failure",
                "exit_code": exit_code,
                "results": results,
                "logs": logs,
                "execution_mode": "docker"
            }
        
        except docker.errors.ContainerError as e:
            return {
                "status": "failure",
                "error": str(e),
                "execution_mode": "docker"
            }
        
        finally:
            container.remove()
```

### 4. Database Models

**File**: `src/db/models.py`

```python
from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    objective = Column(String)
    status = Column(String)  # active, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    state_tree = Column(JSON)  # Full execution state

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    agent_id = Column(String)
    status = Column(String)
    output = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Verification(Base):
    __tablename__ = "verifications"
    
    id = Column(String, primary_key=True)
    claim = Column(String)
    agent_id = Column(String)
    tier = Column(String)  # dimensional, statistical, formal
    status = Column(String)  # queued, running, passed, failed
    confidence = Column(Float)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
```

### 5. FastAPI Application

**File**: `src/api/app.py`

```python
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI(title="OpenInsight API", version="1.0.0")

@app.post("/api/workflows")
async def create_workflow(objective: str, background_tasks: BackgroundTasks):
    """Create and execute a research workflow"""
    workflow = Orchestrator.create_workflow(objective)
    
    # Execute asynchronously
    background_tasks.add_task(Orchestrator.execute_workflow, workflow.id)
    
    return {
        "workflow_id": workflow.id,
        "status": "queued",
        "created_at": workflow.created_at.isoformat()
    }

@app.get("/api/workflows/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get workflow status and state tree"""
    workflow = Orchestrator.get_workflow(workflow_id)
    return {
        "id": workflow.id,
        "objective": workflow.objective,
        "status": workflow.status,
        "state_tree": workflow.state_tree
    }

@app.get("/api/workflows/{workflow_id}/stream")
async def stream_workflow_events(workflow_id: str):
    """Stream real-time workflow events via Server-Sent Events"""
    async def event_generator():
        while True:
            events = Orchestrator.get_recent_events(workflow_id)
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/verifications")
async def create_verification(claim: str, tier: str, tool: str):
    """Submit claim for verification"""
    verification = Verifier.create_verification(claim, tier, tool)
    return {"id": verification.id, "status": "queued"}
```

---

## Deployment

### Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      DATABASE_URL: postgresql://postgres:password@db:5432/openinsight
    depends_on:
      - db
      - sandbox
    command: uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: openinsight
    volumes:
      - postgres_data:/var/lib/postgresql/data

  sandbox:
    build:
      context: .
      dockerfile: docker/Dockerfile.sandbox
    network_mode: none

volumes:
  postgres_data:
```

### GitHub Actions CI/CD

**File**: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio
      
      - name: Run tests
        run: pytest tests/ -v
      
      - name: Lint with pylint
        run: pylint src/
```

---

**Last Updated**: 2026-06-17  
**Status**: Scaffolding Complete  
**Next**: Agent implementation and skill plugins