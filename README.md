# SecureAI MicroShield

AI-powered cybersecurity microservices platform running on Kubernetes. Detects anomalous API traffic patterns using Isolation Forest ML models and triggers automated alerts.

## Architecture

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| Backend | Django 6.0 | 8000 | REST API, audit logging, alert management |
| AI Service | FastAPI + scikit-learn | 5000 | Anomaly detection (Isolation Forest) |
| Keycloak | Keycloak 24 | 8080 | Identity & access management |
| PostgreSQL | PostgreSQL 15 | 5432 | Primary database |
| Redis | Redis 7 | 6379 | Caching layer |
| Prometheus | Prometheus | 9090 | Metrics collection |
| Grafana | Grafana | 3000 | Dashboards |
| Loki + Promtail | Grafana Loki | 3100 | Log aggregation |

## Quick Start

```bash
# Start Minikube
minikube start --driver=docker

# Build images inside Minikube's Docker
eval $(minikube docker-env)
docker build -t backend-backend:latest ./backend
docker build -t ai-service:latest ./backend/ai_service

# Deploy
kubectl apply -f backend/k8s/database/
kubectl apply -f backend/k8s/identity/
kubectl apply -f backend/k8s/apps/
kubectl apply -f backend/k8s/monitoring/
kubectl apply -f backend/k8s/base/

# Access via Ingress
minikube tunnel
# Then visit http://secureai.local
```

## DevSecOps Pipeline

Every push to `main` triggers a 4-gate security pipeline:

| Gate | Tool | What It Checks |
|------|------|----------------|
| SAST | Bandit | Static code analysis for Python security issues |
| SCA | pip-audit | Known CVEs in Python dependencies |
| IaC | Checkov | Kubernetes manifest security best practices |
| Container | Trivy | OS and application vulnerabilities in Docker images |

The pipeline **fails** if any HIGH or CRITICAL vulnerability is found.

## Dependency Vulnerability Management

### Policy

- **CRITICAL/HIGH** vulnerabilities in application dependencies (pip packages) must be patched within 48 hours.
- **CRITICAL/HIGH** vulnerabilities in base OS packages are patched by upgrading the base image. If no fix is available upstream, they are documented in `.trivyignore` with a justification and reviewed monthly.
- **MEDIUM/LOW** OS-level vulnerabilities are tracked but do not block the pipeline.

### How We Handle Vulnerabilities

1. **Automated Detection**: The CI pipeline runs `pip-audit` and `trivy` on every push. Failures block merge.
2. **Base Image Selection**: We use `python:3.12-slim-bookworm` (Debian 12) instead of Trixie/latest to minimize the OS CVE surface.
3. **Bundled Package Upgrades**: Dockerfiles include `pip install --upgrade pip setuptools wheel` to patch CVEs in pip-bundled packages (e.g., `jaraco.context`, `wheel`).
4. **Unfixable CVEs**: OS-level CVEs with no upstream fix (typically `linux-libc-dev` kernel headers) are documented in `.trivyignore` with CVE IDs and rationale. These are not exploitable in containerized workloads.
5. **Monthly Review**: The `.trivyignore` file is reviewed monthly. CVEs that receive upstream fixes are removed and the base image is upgraded.

### Running Security Scans Locally

```bash
# SAST
pip install bandit
bandit -r backend/ -x backend/venv --severity-level medium

# SCA
pip install pip-audit
pip-audit -r backend/requirements.txt
pip-audit -r backend/ai_service/requirements.txt

# IaC
pip install checkov
checkov -d backend/k8s/ --framework kubernetes --compact

# Container
trivy image --severity HIGH,CRITICAL --ignore-unfixed backend-backend:latest
trivy image --severity HIGH,CRITICAL --ignore-unfixed ai-service:latest
```
