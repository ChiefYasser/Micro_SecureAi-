SecureAI MicroShield
AI-powered cybersecurity microservices platform running on Kubernetes. Detects anomalous API traffic patterns using Isolation Forest ML models and triggers automated alerts via a real-time Security Operations Center (SOC) dashboard.
Architecture
Service	Tech	Port	Purpose
Frontend	React 18 + Vite	5173	SOC Dashboard UI and OIDC Auth handling
Backend	Django 6.0	8000	REST API, audit logging, alert management
AI Service	FastAPI + scikit-learn	5000	Anomaly detection (Isolation Forest)
Keycloak	Keycloak 24	8080	Identity & access management (OIDC)
PostgreSQL	PostgreSQL 15	5432	Primary relational database
Redis	Redis 7	6379	High-speed security cache & rate-limiting
Prometheus	Prometheus	9090	Systems and security metrics collection
Grafana	Grafana	3000	Visual SOC dashboards
Loki + Promtail	Grafana Loki	3100	Distributed log aggregation
Quick Start
Infrastructure Setup
code
Bash
# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Enable NGINX Ingress
minikube addons enable ingress
Build and Load Images
code
Bash
# Build backend and AI images
docker build -t backend-backend:latest ./backend
docker build -t ai-service:latest ./backend/ai_service
docker build -t frontend-ui:latest ./frontend

# Load images into Minikube internal registry
& 'C:\Program Files\Kubernetes\Minikube\minikube.exe' image load backend-backend:latest
& 'C:\Program Files\Kubernetes\Minikube\minikube.exe' image load ai-service:latest
& 'C:\Program Files\Kubernetes\Minikube\minikube.exe' image load frontend-ui:latest
Deployment
code
Bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/database/
kubectl apply -f k8s/identity/
kubectl apply -f k8s/apps/
kubectl apply -f k8s/monitoring/
kubectl apply -f k8s/base/

# Access via Ingress (Windows)
minikube tunnel
# Ensure C:\Windows\System32\drivers\etc\hosts contains:
# 127.0.0.1 secureai.local
Security Features
Zero-Trust Identity: Implements OpenID Connect (OIDC) via Keycloak. No credentials are stored locally; all access is governed by RS256 signed JWT tokens.
Behavioral AI: Real-time outlier detection using an Isolation Forest microservice. Analyzes request frequency, payload size, and latency to identify zero-day threats.
Observability: Integrated PLG Stack (Prometheus, Loki, Grafana) providing full forensic traceability from network metrics down to individual container logs.
Container Hardening: All deployments enforce non-root execution, dropped Linux capabilities, and read-only filesystems where possible.
DevSecOps Pipeline
Every push to main triggers an automated 4-gate security validation:
Gate	Tool	What It Checks
SAST	Bandit	Static code analysis for Python security vulnerabilities
SCA	pip-audit	Known CVEs in Python and Frontend dependencies
IaC	Checkov	Kubernetes manifest security context and best practices
Container	Trivy	OS-level vulnerabilities within the Docker images
The pipeline strictly fails if any HIGH or CRITICAL vulnerability is detected.
Dependency Vulnerability Management
Policy
High/Critical Severity: Must be remediated by version upgrade within 48 hours.
Frontend Auditing: Node.js dependencies are audited for supply-chain vulnerabilities using npm audit and Trivy filesystem scans.
Base Image Hardening: All microservices utilize python:3.12-slim-bookworm or node:20-slim to minimize the OS attack surface.
Exceptions: Unfixable upstream OS vulnerabilities are documented in .trivyignore with technical justification and reviewed monthly.
Running Security Scans Locally
code
Bash
# Python SAST
bandit -r backend/ -x backend/venv --severity-level medium

# Dependency Audit (Backend & AI)
pip-audit -r backend/requirements.txt
pip-audit -r backend/ai_service/requirements.txt

# Infrastructure Validation
checkov -d k8s/ --framework kubernetes --compact

# Container Scan
trivy image --severity HIGH,CRITICAL backend-backend:latest
trivy image --severity HIGH,CRITICAL frontend-ui:latest
SecureAI MicroShield | End-of-Studies Project (2026)
the Goat Yassir Nmar