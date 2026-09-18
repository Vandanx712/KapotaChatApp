# The Master DevOps & Production Deployment Handbook
### The Universal Architecture Decision Engine & Hands-on Production Engineering Playbook

---

## Master Table of Contents

### PART I: The Universal Deployment & Architecture Decision Engine
1. [The 5-Dimensional Project Assessment Framework (How to Analyze ANY Project)](#1-the-5-dimensional-project-assessment-framework-how-to-analyze-any-project)
2. [The Hosting Platform Spectrum: Where Should You Deploy?](#2-the-hosting-platform-spectrum-where-should-you-deploy)
   - [PaaS vs. Serverless Containers vs. IaaS VMs vs. Kubernetes](#paas-vs-serverless-containers-vs-iaas-vms-vs-kubernetes)
   - [Visual Decision Tree: "Where Should I Host My App?"](#visual-decision-tree-where-should-i-host-my-app)
3. [Real-Time Protocols: WebSockets vs. SSE vs. Polling vs. Webhooks](#3-real-time-protocols-websockets-vs-sse-vs-polling-vs-webhooks)
4. [Database & Storage Selection Matrix](#4-database--storage-selection-matrix)
5. [6 Real-World Project Archetypes & Their Exact Recommended Stacks](#5-6-real-world-project-archetypes--their-exact-recommended-stacks)
6. [The Cost vs. Complexity Roadmap (From $0 to $1,000+/month)](#6-the-cost-vs-complexity-roadmap-from-0-to-1000month)

---

### PART II: Core DevOps Mechanics & Production Engineering
7. [Introduction to DevOps & The Deployment Lifecycle](#7-introduction-to-devops--the-deployment-lifecycle)
8. [Containers & Docker: The Engine of Modern Deployment](#8-containers--docker-the-engine-of-modern-deployment)
   - [Virtual Machines (VMs) vs. Containers](#virtual-machines-vms-vs-containers)
   - [The Complete Dockerfile Instruction Encyclopedia (FROM, CMD, EXPOSE, etc.)](#the-complete-dockerfile-instruction-encyclopedia)
   - [Deep Dive: The Critical Role of .dockerignore](#deep-dive-the-critical-role-of-dockerignore)
   - [Backend Dockerfile: Line-by-Line Anatomy](#backend-dockerfile-line-by-line-anatomy)
   - [Frontend Multi-Stage Dockerfile (Vite/React + Nginx)](#frontend-multi-stage-dockerfile-vitereact--nginx)
   - [The React Router SPA Reload Problem & Nginx Fix](#the-react-router-spa-reload-problem--nginx-fix)
9. [Container Orchestration with Docker Compose](#9-container-orchestration-with-docker-compose)
   - [Why One Container Per Process?](#why-one-container-per-process)
   - [Deep Dive: Docker Internal DNS & Service Discovery](#deep-dive-docker-internal-dns--service-discovery)
   - [Port Mapping (`ports`) vs. Port Isolation (`expose`)](#port-mapping-ports-vs-port-isolation-expose)
   - [Volumes & Data Durability for Redis & BullMQ](#volumes--data-durability-for-redis--bullmq)
   - [Startup Order & Health Checks (`depends_on` with `service_healthy`)](#startup-order--health-checks-depends_on-with-service_healthy)
   - [Reference `docker-compose.yml`: Line-by-Line Anatomy](#reference-docker-composeyml-line-by-line-anatomy)
10. [Networking, Reverse Proxies & WebSockets](#10-networking-reverse-proxies--websockets)
   - [Why Put Nginx in Front of Node.js? (Reverse Proxy Architecture)](#why-put-nginx-in-front-of-nodejs-reverse-proxy-architecture)
   - [The Complete Nginx Directive Encyclopedia](#the-complete-nginx-directive-encyclopedia)
   - [Deep Dive: The WebSocket Protocol & The Upgrade Handshake](#deep-dive-the-websocket-protocol--the-upgrade-handshake)
   - [The Idle Disconnect Problem (`proxy_read_timeout`)](#the-idle-disconnect-problem-proxy_read_timeout)
   - [SSL/TLS Automation: The ACME Protocol & Certbot](#ssltls-automation-the-acme-protocol--certbot)
   - [Production `nginx.conf`: Line-by-Line Anatomy](#production-nginxconf-line-by-line-anatomy)
   - [Mobile App (React Native) HTTPS & WSS Requirements](#mobile-app-react-native-https--wss-requirements)
11. [AWS Cloud Infrastructure Fundamentals](#11-aws-cloud-infrastructure-fundamentals)
   - [AWS Regions, Latency & The Global Infrastructure](#aws-regions-latency--the-global-infrastructure)
   - [EC2 Instance Selection & Hardware Sizing](#ec2-instance-selection--hardware-sizing)
   - [The Swap Space Lifesaver: Preventing Linux OOM Crashes](#the-swap-space-lifesaver-preventing-linux-oom-crashes)
   - [Security Groups: Hypervisor-Level Firewall Mastery](#security-groups-hypervisor-level-firewall-mastery)
   - [Static IPs with AWS Elastic IP](#static-ips-with-aws-elastic-ip)
   - [DNS Configuration (Route 53, Cloudflare, Namecheap)](#dns-configuration-route-53-cloudflare-namecheap)
   - [SSH Access & Ubuntu Server Initialization Script](#ssh-access--ubuntu-server-initialization-script)
12. [Databases, Queues & Stateless Architecture](#12-databases-queues--stateless-architecture)
   - [The Golden Rule: Stateless Compute](#the-golden-rule-stateless-compute)
   - [MongoDB in Production: Atlas vs. Self-Hosted Docker](#mongodb-in-production-atlas-vs-self-hosted-docker)
   - [Mongoose Connection Pooling & Reconnect Resilience](#mongoose-connection-pooling--reconnect-resilience)
   - [Redis Deep Dive: BullMQ Queue Persistence & Eviction Policies](#redis-deep-dive-bullmq-queue-persistence--eviction-policies)
   - [Decoupled Object Storage: Cloudinary / S3 CDN Architecture](#decoupled-object-storage-cloudinary--s3-cdn-architecture)
13. [Security, Environment Variables & SSL/TLS](#13-security-environment-variables--ssltls)
   - [The 12-Factor App: Configuration & Secret Management](#the-12-factor-app-configuration--secret-management)
   - [Hardening Production Secrets on EC2 (`chmod 600`)](#hardening-production-secrets-on-ec2-chmod-600)
   - [CORS Security for Web and React Native Mobile Clients](#cors-security-for-web-and-react-native-mobile-clients)
   - [JWT Cryptographic Key Generation & Production Cookies](#jwt-cryptographic-key-generation--production-cookies)
14. [CI/CD (Continuous Integration & Continuous Deployment)](#14-cicd-continuous-integration--continuous-deployment)
   - [Continuous Integration (CI) vs. Continuous Deployment (CD)](#continuous-integration-ci-vs-continuous-deployment-cd)
   - [Why Build in GitHub Actions Instead of the Production Server?](#why-build-in-github-actions-instead-of-the-production-server)
   - [Container Registry Strategy & Immutable Commit Tagging](#container-registry-strategy--immutable-commit-tagging)
   - [Zero-Downtime Deployment Flow Over SSH](#zero-downtime-deployment-flow-over-ssh)
   - [GitHub Actions Pipeline (`deploy.yml`): Line-by-Line Anatomy](#github-actions-pipeline-deployyml-line-by-line-anatomy)
   - [Configuring Repository Secrets in GitHub](#configuring-repository-secrets-in-github)
15. [Observability: Logging, Monitoring & Maintenance](#15-observability-logging-monitoring--maintenance)
   - [The Three Pillars of Observability in Production](#the-three-pillars-of-observability-in-production)
   - [The Docker Log Disk-Full Trap & Rotation Fix](#the-docker-log-disk-full-trap--rotation-fix)
   - [Deep Health Checks: Building `/api/health` for Express & Redis](#deep-health-checks-building-apihealth-for-express--redis)
   - [Essential Server Monitoring Tools (`docker stats`, `htop`, `df -h`)](#essential-server-monitoring-tools-docker-stats-htop-df--h)
   - [Automated Maintenance Runbook & Safe Disk Pruning](#automated-maintenance-runbook--safe-disk-pruning)

---

### PART III: Reference Blueprints & Cheat Sheets
16. [Kapota Implementation Blueprint (Reference Architecture)](#16-kapota-implementation-blueprint-reference-architecture)
17. [Essential DevOps Command Cheat Sheet & Glossary](#17-essential-devops-command-cheat-sheet--glossary)

---

# PART I: The Universal Deployment & Architecture Decision Engine
### How to Analyze Any Project and Choose the Best-Fit Stack

Before writing a single line of Dockerfile or purchasing cloud servers, every software engineer must answer one critical question:
**"What is the simplest, most reliable, and most cost-effective architecture for this specific application?"**

Too many developers jump straight into complex tools (like Kubernetes or AWS ECS) for simple apps, or deploy stateful real-time apps to serverless platforms where they fail. This section gives you the **exact decision engine** used by senior cloud architects to choose the right strategy for *any* project.

---

## 1. The 5-Dimensional Project Assessment Framework (How to Analyze ANY Project)

Whenever you start or evaluate a new project, evaluate it across these 5 dimensions:

```
                  ┌───────────────────────────────────────────────┐
                  │    THE 5-DIMENSIONAL PROJECT EVALUATION       │
                  └───────────────────────┬───────────────────────┘
                                          │
       ┌───────────────┬──────────────────┼──────────────────┬───────────────┐
       ▼               ▼                  ▼                  ▼               ▼
┌─────────────┐ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ ┌─────────────┐
│ 1. COMPUTE  │ │ 2. TRAFFIC  │    │  3. STATE   │    │  4. SCALE   │ │  5. BUDGET  │
│ Static SPA, │ │ REST, SSE,  │    │ Stateless,  │    │ Sporadic,   │ │ Solo ($0),  │
│ SSR, Daemon │ │ WebSockets, │    │ SQL, NoSQL, │    │ Steady, or  │ │ MVP ($20),  │
│ or Worker?  │ │ or Webhook? │    │ Queue, S3?  │    │ Peak burst? │ │ Scale ($500)│
└─────────────┘ └─────────────┘    └─────────────┘    └─────────────┘ └─────────────┘
```

### Dimension 1: Compute & Runtime Profile
Ask: *"What is running the code, and how long does it take to execute?"*
- **Static Frontend**: Pre-compiled HTML, CSS, and JS (Vite React, Vue, Astro, vanilla JS). Does not need a server runtime; only needs an HTTP file server or CDN.
- **Server-Side Rendered (SSR) Frontend**: Generates HTML dynamically on every request (Next.js, Remix, Nuxt). Requires a Node.js runtime or Edge compute worker.
- **Long-Running API Daemon**: Listens continuously on a TCP port for requests (Express, FastAPI, NestJS, Go Gin, Django, Spring Boot).
- **Background Worker**: Consumes tasks from a message queue asynchronously (BullMQ, Celery, RabbitMQ consumers). Needs persistent CPU, NOT web ingress.
- **Compute/GPU-Heavy Workload**: Machine learning inference, image transcoding (ffmpeg/sharp), PDF generation. Requires high CPU or specialized GPUs.

### Dimension 2: Communication & Protocol Model
Ask: *"How do clients talk to the server?"*
- **Stateless HTTP Request-Response**: Standard REST or GraphQL. Client asks, server answers, connection closes. Ideal for serverless and auto-scaling containers.
- **Unidirectional Streaming (Server-Sent Events / SSE)**: Server streams data continuously to the client over standard HTTP (e.g. ChatGPT / Gemini AI token streaming, live stock prices).
- **Bidirectional Persistent Connections (WebSockets)**: Client and server communicate full-duplex with sub-millisecond latency (e.g. Chat applications, collaborative canvas, multiplayer games). **Requires long-lived, stateful server instances**.
- **Asynchronous Webhooks**: Third-party servers push events to you (e.g. Stripe checkout completion, GitHub push events).

### Dimension 3: State & Persistence Demands
Ask: *"Where does the data live when the server reboots?"*
- **Purely Stateless**: All state is stored in external databases or JWT cookies. Containers can be killed and restarted at any time without side effects.
- **Relational ACID Data**: Highly structured, relational data requiring strict transactional integrity and complex joins (PostgreSQL, MySQL).
- **Flexible Document Data**: Rapidly evolving schema, nested objects, polymorphic chat payloads (MongoDB, DynamoDB).
- **In-Memory Cache & Queues**: High-throughput, sub-millisecond key-value storage (Redis, KeyDB).
- **Blob / Media Storage**: User-uploaded images, videos, audio notes, PDFs. **Must always be offloaded to Object Storage (S3/Cloudinary/R2)**.

### Dimension 4: Scale & Traffic Predictability
Ask: *"What does traffic look like over 24 hours?"*
- **Sporadic / Idle Traffic**: App is unused for hours, then receives bursts (Internal company tools, portfolio sites, small utilities). **Best Fit**: Serverless (scales to zero, costs $0 when idle).
- **Steady / Predictable Traffic**: Constant flow of 10–500 requests/second. **Best Fit**: Dedicated Virtual Machines (EC2 / VPS) or reserved containers.
- **Massive High-Concurrency Peaks**: Flash sales, breaking news events. **Best Fit**: Auto-scaling container clusters (AWS ECS Fargate / Google Cloud Run / EKS).

### Dimension 5: Operational Budget & Team Size
Ask: *"How much money can we spend, and who will maintain the infrastructure?"*
- **Hobby / Solo Developer ($0 – $15/mo)**: Maximum automation, zero server management. Use free PaaS (Vercel, Cloudflare, Supabase, Neon) or a single budget VPS (Hetzner, DigitalOcean, AWS EC2 t3.micro/small).
- **Funded Startup ($50 – $300/mo)**: Reliability and room for growth over DIY maintenance. Use managed services (AWS ECS Fargate, MongoDB Atlas, AWS RDS, Cloudinary).
- **Enterprise / High-Compliance ($1,000+/mo)**: Strict SLAs, SOC2 compliance, multi-region failover. Multi-account AWS architecture or Kubernetes.

---

## 2. The Hosting Platform Spectrum: Where Should You Deploy?

There is no single "best" hosting platform. The right choice depends on your project's architecture:

### PaaS vs. Serverless Containers vs. IaaS VMs vs. Kubernetes

| Feature | **Tier 1: PaaS (Render, Railway, Fly.io, Vercel)** | **Tier 2: Serverless Containers (Cloud Run, ECS Fargate)** | **Tier 3: IaaS VMs (AWS EC2, DigitalOcean, Hetzner)** | **Tier 4: Kubernetes (AWS EKS, GCP GKE)** |
| :--- | :--- | :--- | :--- | :--- |
| **DevOps Effort** | **Almost Zero** (Git push to deploy) | **Low** (Build image, cloud handles host) | **Moderate** (Configure OS, Docker, Nginx, SSL) | **Extremely High** (Cluster management, manifests, ingress) |
| **Monthly Cost** | Free to ~$25/mo (Scales exponentially!) | Pay strictly per vCPU/RAM second | Fixed, highly predictable ($5 - $20/mo) | High base cost ($70+/mo minimum just for control plane) |
| **WebSocket Support** | Varies (often timeout or connection limits) | Good (Cloud Run has 60m timeout; Fargate unlimited) | **Perfect** (Native persistent TCP connections) | **Perfect** (Dynamic ingress routing) |
| **Scale to Zero?** | Yes on free tiers (causes sleep/cold starts) | **Yes** (Pay $0 when nobody visits) | No (VM runs 24/7 at fixed monthly price) | No (Worker nodes run 24/7) |
| **Best For** | MVPs, Next.js frontends, hackathons, prototypes | APIs, Microservices, event-driven backends | Full-stack apps, WebSockets, background queues, cost control | Large enterprise orgs with 50+ microservices |

#### The Hidden Cost Trap of PaaS & Serverless:
- **PaaS (e.g. Render/Railway)**: Great for the first 3 months. But as your database grows and you need more RAM, prices scale 5x to 10x higher than raw virtual machines.
- **Serverless (e.g. AWS Lambda / Vercel)**: Exceptional for sporadic web apps. But if you run continuous background queue workers or long-lived WebSockets, serverless becomes **massively more expensive** than a $15/month EC2 instance.

---

### Visual Decision Tree: "Where Should I Host My App?"

Use this flowchart to determine the ideal hosting strategy for *any* application:

```mermaid
flowchart TD
    Start["New Project: What are you building?"] --> Q1{"Is it purely static HTML/CSS/JS (Vite, React SPA, Astro)?"}
    
    Q1 -->|Yes| StaticHost["Deploy to Global Edge CDN<br/><b>Vercel / Cloudflare Pages / AWS S3+CloudFront</b><br/>Cost: $0/mo | Maintenance: Zero"]
    
    Q1 -->|No, has backend code| Q2{"Does it require persistent WebSockets<br/>or long-running background workers (BullMQ/Celery)?"}
    
    Q2 -->|No, standard stateless REST/GraphQL API| Q3{"What is your traffic pattern?"}
    
    Q3 -->|Sporadic / Bursty / Unknown| ServCont["Serverless Containers<br/><b>Google Cloud Run / AWS ECS Fargate</b><br/>Scale to zero | Pay only when used"]
    Q3 -->|Predictable steady traffic| PaaS_or_VM{"Do you want to manage Linux/Docker?"}
    PaaS_or_VM -->|No, want zero DevOps| PaaS["PaaS<br/><b>Render / Railway / Fly.io</b>"]
    PaaS_or_VM -->|Yes, want lowest cost & full control| VM1["Virtual Machine<br/><b>AWS EC2 / DigitalOcean / Hetzner</b> + Docker"]
    
    Q2 -->|Yes: Real-Time Chat, Games, or Queues| Q4{"What is your budget & operational scale?"}
    
    Q4 -->|Hobby / MVP / Startup (< $50/mo)| VM2["<b>IaaS VM (AWS EC2) + Docker Compose + Nginx</b><br/>(Kapota Architecture)<br/>Predictable cost ($5-$15/mo) | Full control"]
    Q4 -->|Funded Startup / High Auto-Scaling ($100-$500/mo)| Fargate["<b>AWS ECS Fargate + Application Load Balancer + Redis</b><br/>Zero server patching | Auto-scaling tasks"]
    Q4 -->|Enterprise / 50+ Microservices (> $2,000/mo)| K8s["<b>Kubernetes (AWS EKS / GCP GKE)</b><br/>Maximum elasticity | Multi-team orchestration"]
```

---

## 3. Real-Time Protocols: WebSockets vs. SSE vs. Polling vs. Webhooks

When building interactive applications, choosing the wrong communication protocol leads to battery drain, proxy timeouts, or massive server costs:

| Protocol | Direction | Transport | Proxy / Nginx Complexity | Reconnection Handling | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WebSockets** | **Bidirectional** (Full-Duplex) | TCP (Upgraded from HTTP/1.1) | **High** (Requires `Upgrade` & `Connection` headers + 24h timeouts) | Manual or handled by client libraries (Socket.IO) | **Chat apps**, multiplayer gaming, real-time whiteboards, collaborative docs. |
| **Server-Sent Events (SSE)** | **Unidirectional** (Server $\rightarrow$ Client) | Standard HTTP/2 or HTTP/1.1 | **Low** (Standard HTTP streaming; no special upgrade needed) | **Native** (Browsers auto-reconnect via `EventSource` API) | **AI Token Streaming (ChatGPT/Gemini)**, live stock feeds, dashboard metrics, notification badges. |
| **HTTP Long-Polling** | Unidirectional (Simulated) | Repeated HTTP requests | **Zero** (Standard HTTP) | Manual | Fallback when WebSockets are blocked by restrictive corporate firewalls. |
| **Webhooks** | Server $\rightarrow$ Server | Asynchronous HTTP POST | **Zero** | Handled by sender retries | Payment confirmations (Stripe), CI triggers (GitHub), email deliveries (SendGrid). |

> [!TIP]
> **Architectural Rule of Thumb**:
> - If the client **only reads** continuous updates (like an AI streaming text or a stock ticker), use **Server-Sent Events (SSE)**. It is simpler, lighter on servers, and requires no custom WebSocket proxying!
> - If the client **both sends and receives** rapid messages (like a real-time chat app or game), use **WebSockets (Socket.IO)**.

---

## 4. Database & Storage Selection Matrix

A core DevOps duty is picking the right persistence engine for each data category:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      THE PERSISTENCE SELECTION MATRIX                   │
├───────────────────┬─────────────────────────┬───────────────────────────┤
│ Data Category     │ Recommended Engine      │ When to Choose This       │
├───────────────────┼─────────────────────────┼───────────────────────────┤
│ Structured / ACID │ PostgreSQL / MySQL      │ User accounts, payments,  │
│                   │ (Managed: Supabase,     │ relational business data, │
│                   │ Neon, AWS RDS)          │ e-commerce orders, audits │
├───────────────────┼─────────────────────────┼───────────────────────────┤
│ Flexible / JSON   │ MongoDB / DynamoDB      │ Chat messages, dynamic    │
│ Document          │ (Managed: Atlas)        │ room configs, polymorphic │
│                   │                         │ device payloads           │
├───────────────────┼─────────────────────────┼───────────────────────────┤
│ In-Memory Cache   │ Redis / KeyDB           │ Session store, rate limit,│
│ & Job Queues      │ (Docker Vol / Upstash)  │ BullMQ background queues  │
├───────────────────┼─────────────────────────┼───────────────────────────┤
│ Media & Objects   │ S3 / Cloudflare R2 /    │ Images, voice notes, PDFs,│
│ (Files)           │ Cloudinary              │ videos. NEVER on VM disk! │
├───────────────────┼─────────────────────────┼───────────────────────────┤
│ AI Embeddings     │ pgvector (Postgres) /   │ RAG pipelines, semantic   │
│ & Vector Search   │ Pinecone / Qdrant       │ search, AI memory         │
└───────────────────┴─────────────────────────┴───────────────────────────┘
```

#### The "Managed DBaaS vs. Self-Hosted Docker" Decision:
- **Always use Managed DBaaS** for primary databases in production (e.g. MongoDB Atlas, Supabase/Neon PostgreSQL). The cost of a DB crash, corrupted disk, or lost backup far exceeds the few dollars saved by self-hosting on a single VM.
- **Self-host in Docker** for auxiliary, ephemeral stores like **Redis** (caching and queues), where data can be backed up via simple volume snapshots or recreated without business ruin.

---

## 5. 6 Real-World Project Archetypes & Their Exact Recommended Stacks

Use these battle-tested blueprints for your future projects:

### Archetype 1: Static Portfolio, Blog, or Documentation Site
- **Stack**: Astro, Vite + React, or Docusaurus.
- **Hosting**: Cloudflare Pages, Vercel, or AWS S3 + CloudFront CDN.
- **Database**: None (Markdown / Git-based).
- **Cost**: **$0 / month**.
- **DevOps**: Zero servers. Git push automatically builds and deploys to global edge nodes.

### Archetype 2: Modern SaaS Web Application (CRUD / B2B)
- **Stack**: Next.js (SSR + React) + Node.js / Go backend.
- **Hosting**:
  - Frontend: Vercel or AWS CloudFront.
  - Backend: AWS ECS Fargate or Render.
- **Database**: PostgreSQL on Supabase or AWS RDS.
- **Storage**: AWS S3 or Cloudflare R2 for user documents.
- **Cost**: **$20 – $70 / month**.

### Archetype 3: Real-Time Interactive App (Chat, Whiteboard, Collab) — *Kapota Case*
- **Stack**: React Vite SPA + Node.js (Express + Socket.IO) + BullMQ Worker + Redis.
- **Hosting**: AWS EC2 (`t3.small`) with Docker Compose + Nginx Reverse Proxy (SSL).
- **Database**: MongoDB Atlas (Chat & Users) + Redis Named Volume (BullMQ & Cache).
- **Storage**: Cloudinary (Media, Audio, Photos).
- **Cost**: **~$14 – $20 / month**.

### Archetype 4: Heavy Background Processing & Data Scraper
- **Stack**: Python (FastAPI + Celery) or Node.js (BullMQ) + Headless Chromium/Puppeteer.
- **Hosting**: AWS EC2 instance (`c6i.large` compute-optimized) or multiple worker containers.
- **Queue/Database**: Redis + PostgreSQL.
- **DevOps**: Dedicated worker containers isolated from web ingress, managed by Docker Compose or ECS.

### Archetype 5: AI / Generative LLM Application
- **Stack**: Next.js / React UI + Python FastAPI backend + LangChain / LlamaIndex.
- **Communication**: **Server-Sent Events (SSE)** for real-time word-by-word streaming.
- **Hosting**: Google Cloud Run (handles bursty AI traffic with scale-to-zero) + Modal / RunPod (if running custom GPU models).
- **Database**: PostgreSQL with `pgvector` for semantic search embeddings.
- **Cost**: **$5 – $50 / month** (scales strictly with API usage).

### Archetype 6: Mobile App Backend (iOS & Android)
- **Stack**: React Native / Flutter client + Node.js / NestJS API.
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Apple APNs.
- **Hosting**: AWS EC2 + Docker Compose + Let's Encrypt SSL (Mandatory for iOS ATS and Android cleartext rules).
- **Media**: Cloudinary or AWS S3 with signed upload URLs.
- **Cost**: **~$15 / month**.

---

## 6. The Cost vs. Complexity Roadmap (From $0 to $1,000+/month)

How your infrastructure should evolve as your project grows:

```
[Phase 1: Free / Hobby ($0)] 
  ├── Frontend: Cloudflare Pages / Vercel Free Tier
  ├── Database: Supabase / Neon / Atlas Free Tier
  └── Compute:  Serverless edge functions

[Phase 2: The Bootstrapped MVP ($10 - $25/mo)]  <--- KAPOTA IS HERE
  ├── Compute:  AWS EC2 (t3.small) with Docker Compose + Nginx
  ├── Database: MongoDB Atlas / Managed Postgres
  └── Media:    Cloudinary / Cloudflare R2

[Phase 3: The Scaling Startup ($100 - $500/mo)]
  ├── Compute:  AWS ECS Fargate (Auto-scaling container tasks)
  ├── Ingress:  AWS Application Load Balancer (ALB) + ACM SSL
  ├── Database: AWS RDS Multi-AZ + ElastiCache Redis Cluster
  └── Storage:  AWS S3 + CloudFront CDN

[Phase 4: High-Scale Enterprise ($1,000+/mo)]
  ├── Compute:  AWS EKS (Kubernetes) or Multi-Region Fargate
  ├── Network:  AWS Global Accelerator + Cloudflare Enterprise WAF
  └── Infra:    Terraform / OpenTofu Infrastructure-as-Code (IaC)
```

---

# PART II: Core DevOps Mechanics & Production Engineering
### Hands-on Technical Mastery (Docker, Nginx, AWS, CI/CD, Observability)

Now that you know how to analyze any project and choose its architecture, Part II covers the **deep technical mechanics** to build, secure, and operate production-grade containerized systems.

---

## 7. Introduction to DevOps & The Deployment Lifecycle


### What is DevOps?
DevOps is the combination of cultural philosophies, practices, and tools that increases an organization's ability to deliver applications and services at high velocity.

Before DevOps:
- **Developers ("Dev")**: Wrote code on their local machines ("It works on my machine!") and threw it over the wall.
- **System Administrators ("Ops")**: Manually configured servers, installed software, and handled crashes when the code broke in production due to different environments.

With DevOps:
- Software delivery is automated, reproducible, and treated as code (**Infrastructure as Code**).
- The same artifact (container) that runs locally runs identically on staging and production servers.

### The Deployment Environments
A standard software release travels through distinct stages:

```
[Local Development]  --->  [Staging / Preview]  --->  [Production]
 (Your Laptop/PC)          (Identical to Prod,        (Live users, high
  Rapid iteration,          testing environment)       security, monitored)
  hot reload, mocks
```

### Core DevOps Philosophy: "Cattle vs. Pets"
- **The Old Way ("Pets")**: A server is lovingly named, manually configured over years, and nurtured. If it gets infected or fails, everyone panics because nobody remembers how to rebuild it from scratch.
- **The Cloud/DevOps Way ("Cattle")**: Servers and containers are numbered, identical, automated, and disposable. If a server or container becomes unhealthy, you kill it and spawn a brand-new identical one in seconds.

---

## 8. Containers & Docker: The Engine of Modern Deployment

### Virtual Machines (VMs) vs. Containers
To deploy software reliably, we must isolate it from the host machine's differences (operating system versions, installed libraries, node versions).

```
+------------------------------------+      +------------------------------------+
|        VIRTUAL MACHINE (VM)        |      |          DOCKER CONTAINER          |
+------------------------------------+      +------------------------------------+
| App 1       | App 2                |      | App 1              | App 2         |
| Bins/Libs   | Bins/Libs            |      | Bins/Libs          | Bins/Libs     |
| Guest OS    | Guest OS (Heavy GBs) |      +--------------------+---------------+
+-------------+----------------------+      | Container Engine (Docker Engine)   |
| Hypervisor (e.g., VMware, KVM)     |      +------------------------------------+
+------------------------------------+      | Host Operating System (Linux)      |
| Host Hardware / Server             |      | Host Hardware / Server             |
+------------------------------------+      +------------------------------------+
```
- **VMs**: Virtualize hardware and boot a whole guest operating system. Heavy (gigabytes), slow to boot (minutes), high memory overhead.
- **Docker Containers**: Share the host Linux kernel while isolating processes, filesystem, and networking using Linux kernel features (`namespaces` and `cgroups`). Extremely lightweight (megabytes), boot in sub-seconds.

### Key Docker Concepts
1. **Dockerfile**: A plain-text recipe with instructions to assemble a container image.
2. **Image**: An immutable, read-only snapshot containing the application code, runtime (e.g. Node.js), system packages, and dependencies.
3. **Container**: A running instance of an image. You can run 10 containers from a single image.
4. **Registry**: A storage repository for images (Docker Hub, GitHub Container Registry - GHCR, AWS ECR).

---

### The Complete Dockerfile Instruction Encyclopedia

A Dockerfile is read sequentially from top to bottom. Every instruction creates an immutable, cached layer in the resulting image. Here is the exhaustive reference for all essential instructions:

| Instruction | What It Does | Example Syntax | When to Use / Production Gotchas |
| :--- | :--- | :--- | :--- |
| **`FROM`** | Sets the base image and begins a new build stage. | `FROM node:20-alpine AS builder` | Always specify an explicit version tag (e.g. `node:20-alpine`). Never use `:latest` in production to prevent unexpected breaking updates. |
| **`WORKDIR`** | Sets the working directory for all subsequent instructions. | `WORKDIR /usr/src/app` | Always use `WORKDIR` instead of `RUN cd /app`. Docker creates the directory automatically if it does not exist. |
| **`COPY`** | Copies files from the host machine into the container filesystem. | `COPY package*.json ./` | Preferred over `ADD` for 95% of use cases because of its transparency and predictability. |
| **`ADD`** | Like `COPY`, but automatically extracts `.tar` archives and downloads from URLs. | `ADD release.tar.gz /opt/app/` | Use only when you want automatic tarball unpacking. Otherwise, stick to `COPY`. |
| **`RUN`** | Executes commands **during the build process** to create new image layers. | `RUN npm ci --omit=dev` | Chain related commands with `&&` and delete temporary caches in the same layer to keep image sizes small. |
| **`CMD`** | The default command to execute **when the container boots**. | `CMD ["node", "src/server.js"]` | Easily overridden at runtime. Always use the JSON array Exec form `["cmd", "arg"]` so Linux signals (`SIGTERM`) reach Node.js directly. |
| **`ENTRYPOINT`**| Sets the fixed executable command for the container. | `ENTRYPOINT ["docker-entrypoint.sh"]` | Unlike `CMD`, parameters passed to `docker run` are appended to `ENTRYPOINT` rather than replacing it. |
| **`EXPOSE`** | Documents which port the container listens on at runtime. | `EXPOSE 5001` | **Does NOT publish the port!** It serves as internal documentation. To make it accessible, use `-p 5001:5001` or Compose `ports:`. |
| **`ENV`** | Sets persistent environment variables inside the image & running container. | `ENV NODE_ENV=production` | Available during build and container execution. Never hardcode passwords or sensitive API keys in `ENV`! |
| **`ARG`** | Defines build-time variables passed via `docker build --build-arg`. | `ARG APP_VERSION=1.0.0` | Discarded after the image finishes building. Not accessible inside the running container. |
| **`USER`** | Sets the user name/UID for subsequent commands and container execution. | `USER node` | **Critical Security Practice**: By default, Docker runs as `root`. Switching to an unprivileged user (like `node`) blocks container-escape exploits. |
| **`VOLUME`** | Declares that a directory should be mounted as an external persistent volume. | `VOLUME ["/data"]` | Informs Docker that data written to this path should be bypassed from the container's copy-on-write union filesystem. |
| **`HEALTHCHECK`**| Tells Docker how to verify if the container is healthy and responding. | `HEALTHCHECK CMD wget -q --spider http://localhost:5001/api/health \|\| exit 1` | Instructs Docker and orchestrators to restart the container if the health check fails repeatedly. |
| **`STOPSIGNAL`**| Configures the system call signal sent to the container to exit. | `STOPSIGNAL SIGTERM` | Default is `SIGTERM`. Useful if an application requires `SIGINT` or `SIGQUIT` for graceful shutdown. |

---

### Multi-Stage Builds (The Professional Standard)
In production, image size and security matter. You should never ship developer tools (compilers, git, devDependencies) to production.

#### Example: Frontend Multi-Stage Build
1. **Stage 1 (Builder)**: Uses `node:20-alpine`. Installs all dependencies (`devDependencies` like Vite, Tailwind, PostCSS). Compiles TypeScript/JSX into static HTML, JavaScript, and CSS in the `/dist` directory.
2. **Stage 2 (Production Runner)**: Uses `nginx:alpine` (~25MB). Copies *only* the compiled `/dist` files from Stage 1 into the Nginx web root. The Node.js runtime and devDependencies are discarded completely.

#### Example: Backend Multi-Stage Build
1. **Stage 1 (Install)**: Installs dependencies (`npm ci --omit=dev`).
2. **Stage 2 (Runner)**: Copies production `node_modules` and source code. Runs under an unprivileged user (`USER node` instead of `root`) so attackers cannot take over the host if a vulnerability is exploited.

### Layer Caching Optimization
Docker builds images layer by layer. If a layer hasn't changed, Docker reuses the cache:
- **Bad Dockerfile**:
  ```dockerfile
  COPY . .
  RUN npm install
  ```
  *Problem*: Any small change to a `.js` file busts the cache and forces `npm install` to run every single build.
- **Optimized Dockerfile**:
  ```dockerfile
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY . .
  ```
  *Benefit*: `npm ci` is only executed when `package.json` or `package-lock.json` changes!

### Deep Dive: The Critical Role of `.dockerignore`
When you execute `docker build`, the Docker CLI bundles every file in your directory and sends it to the Docker engine as the **Build Context**. Without a `.dockerignore`, two major disasters happen:

1. **Native Binary Conflicts (Windows vs. Linux)**:
   Kapota's backend depends on [`bcrypt`](file:///D:/personal_projects/KapotaChatApp/backend/package.json#L17). `bcrypt` contains native C++ bindings compiled specifically for your host OS architecture (e.g. Windows x64). If your local `node_modules` is copied into the Linux container (`node:alpine`), the container will fail to start with cryptic errors like:
   `Error: /usr/src/app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header`
   Ignoring `node_modules` forces Docker to install and compile clean, Linux-native binaries inside the container during `npm ci`.
2. **Credential Leakage**:
   If local `.env` files are included in the build context, they become permanently embedded inside the Docker image layers. Anyone who can inspect or pull your container can read your database connection strings, JWT keys, and API secrets.
3. **Build Speed**:
   Uploading hundreds of megabytes of local dependencies over the Docker daemon socket drastically slows down build times.

```text
# Standard .dockerignore for Kapota (Backend & Frontend)
node_modules
.env
.env.local
.git
.gitignore
npm-debug.log
dist
```

### Kapota Backend Dockerfile: Line-by-Line Anatomy

```dockerfile
# 1. Base Image: Minimal Linux Alpine with Node.js 20 LTS runtime
FROM node:20-alpine

# 2. Set the working directory inside the container's virtual filesystem
WORKDIR /usr/src/app

# 3. Layer Caching: Copy package manifests first
COPY package*.json ./

# 4. Clean, reproducible production install (skips devDependencies like nodemon)
RUN npm ci --omit=dev

# 5. Copy the rest of the application source code into the container
COPY . .

# 6. Security Hardening: Switch execution from root to unprivileged 'node' user
USER node

# 7. Document the port Express will listen on inside the container
EXPOSE 5001

# 8. Default runtime command (Starts the API + Socket.io Server)
CMD ["node", "src/server.js"]
```

#### Architecture Pattern: Single Image, Dual Role (API & BullMQ Worker)
Notice how Kapota has two backend tasks:
- `src/server.js`: Handles incoming HTTP REST APIs and real-time Socket.io connections.
- `src/lib/worker.js`: Handles background BullMQ queue jobs (emails, notifications).

**Do you need two separate Dockerfiles? No.**
You build **one** single image (`kapota-backend`). In your orchestrator (Docker Compose), you launch two containers from this same image:
- Container 1 (`backend-api`): Uses default `CMD ["node", "src/server.js"]`.
- Container 2 (`backend-worker`): Overrides command with `command: ["node", "src/lib/worker.js"]`.

### Kapota Frontend Multi-Stage Dockerfile: Line-by-Line Anatomy

Frontend applications built with Vite + React 19 ([frontend/package.json](file:///D:/personal_projects/KapotaChatApp/frontend/package.json)) do not need Node.js in production. They compile down to static HTML, CSS, and JavaScript.

```dockerfile
# =======================================================
# STAGE 1: Build Environment (Temporary Compiler)
# =======================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install ALL dependencies (including devDependencies like Vite, Tailwind, PostCSS)
RUN npm ci

# Copy full frontend source code
COPY . .

# Compile JSX/TSX and CSS into the optimized /app/dist directory
RUN npm run build

# =======================================================
# STAGE 2: Production Web Server (Ultra-lightweight Runner)
# =======================================================
FROM nginx:alpine

# Copy custom Nginx virtual host configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY the compiled static bundle from Stage 1 into Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in the foreground so the container stays alive
CMD ["nginx", "-g", "daemon off;"]
```

### The React Router SPA Reload Problem & Nginx Fix

In a Single Page Application (SPA) using `react-router-dom`:
- When navigating from `/` to `/chat`, the browser does not request a new HTML page from the server; JavaScript updates the URL and DOM dynamically.
- If a user presses **F5 (Reload)** while at `https://yourdomain.com/chat`:
  - The browser asks Nginx: *"Send me the file at path `/chat`."*
  - Nginx checks the filesystem for `/usr/share/nginx/html/chat`. It doesn't exist!
  - By default, Nginx returns **404 Not Found**.

#### The Nginx Configuration Fix (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        # Crucial directive: if the exact file or directory doesn't exist, serve index.html!
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression for faster load times
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```
With `try_files $uri $uri/ /index.html;`, Nginx returns `index.html`, React loads, React Router inspects the URL `/chat`, and immediately mounts the chat page!

---

## 9. Container Orchestration with Docker Compose

When an application has multiple services (e.g., Frontend, Backend API, Worker, Redis), managing them with standalone `docker run` commands becomes unmanageable.

### What is Docker Compose?
Docker Compose is a declarative tool that lets you define, configure, and run multi-container Docker applications using a single YAML file (`docker-compose.yml`). Instead of running 4 different terminal commands with 20 flags each, you type `docker compose up -d` to launch your entire infrastructure in harmony.

---

### Why One Container Per Process?
In Node.js, the runtime event loop is **single-threaded**.

In Kapota, you have two backend workloads:
1. `src/server.js`: Handles incoming HTTP REST APIs and real-time Socket.io chat messages.
2. `src/lib/worker.js`: Listens to BullMQ to process background tasks (e.g., sending verification emails via Nodemailer, uploading media to Cloudinary, geolocation calculations).

#### The Problem with Running Both in One Container:
If a user triggers an action that queues 500 emails, the worker consumes heavy CPU cycles.
- In a shared process/container, the Node.js event loop gets blocked.
- Socket.IO heartbeat pings get delayed $\rightarrow$ **active chat users get disconnected and experience reconnect storms**.
- If the email worker encounters an unhandled rejection and crashes the process, **the entire chat application goes down**.

#### The Solution (Process Isolation):
- Run `backend` in its own container dedicated 100% to incoming web traffic and real-time chat.
- Run `worker` in its own container dedicated 100% to queue processing.
- If the worker spikes to 100% CPU or crashes, the chat server continues running smoothly.

---

### Deep Dive: Docker Internal DNS & Service Discovery
How do containers communicate with one another without hardcoding IP addresses?

```
      +--------------------------------------------------------+
      |        Docker Custom Bridge Network (kapota-network)   |
      |                                                        |
      |   Embedded DNS Server (127.0.0.11)                     |
      |   Resolves "redis"   ---> 172.20.0.2                   |
      |   Resolves "backend" ---> 172.20.0.3                   |
      |                                                        |
      |  +----------------+              +------------------+  |
      |  | backend        |              | redis            |  |
      |  | (Express/Node) |  TCP :6379   | (Redis 7 Alpine) |  |
      |  | Host: "redis"  +------------->| IP: 172.20.0.2   |  |
      |  +----------------+              +------------------+  |
      +--------------------------------------------------------+
```

1. When you create a custom network in Docker Compose, Docker automatically runs an **embedded DNS server** at IP `127.0.0.11`.
2. Every container's hostname matches its **service name** in `docker-compose.yml`.
3. In [backend/.env.example](file:///D:/personal_projects/KapotaChatApp/backend/.env.example#L37):
   ```env
   REDIS_HOST=redis
   REDIS_PORT=6379
   ```
   When your Node.js code executes `new Redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT })`, Docker's internal DNS automatically routes the traffic to the `redis` container.

> [!WARNING]
> **The `localhost` Pitfall**:
> Inside a Docker container, `localhost` refers to **that specific container's own virtual network loopback**, NOT your physical computer and NOT other containers. If your backend tries to connect to `localhost:6379`, it looks for Redis inside the backend container itself and crashes with `ECONNREFUSED`.

---

### Port Mapping (`ports`) vs. Port Isolation (`expose`)

Understanding the difference between `ports` and `expose` is critical for production security:

| Directive | Syntax | Behavior | Security Level |
| :--- | :--- | :--- | :--- |
| **`ports`** (Publish) | `"5001:5001"` | Opens port 5001 on the **host machine's physical network**. Accessible to the outside world. | Publicly accessible unless blocked by firewall. |
| **`expose`** (Isolate) | `- "5001"` | Documents the port for **internal container-to-container communication only**. Not reachable from the outside world. | **Highest Security**. Completely hidden from the public internet. |

#### The Golden Rule of Database & Redis Security:
**Never expose port 6379 (Redis) or 27017 (MongoDB) to the public host in production!**
Databases exposed on public ports without firewalls are scanned and ransomed by automated internet bots within minutes.
In `docker-compose.yml`, Redis should have **no `ports:` section**. Only your internal containers (`backend` and `worker`) can talk to it over `kapota-network`.

---

### Volumes & Data Durability for Redis & BullMQ
Containers are **ephemeral** (disposable). When a container is stopped or removed:
```bash
docker compose down
```
All data written inside the container's virtual filesystem is erased.

#### Why BullMQ Needs a Named Volume:
BullMQ stores queue states (pending jobs, delayed jobs, retries, active jobs) directly in Redis keys. If your server reboots or you update the Redis image without a volume, **all pending queue jobs and user notifications are permanently lost**.

#### How Docker Volumes Solve This:
A **Docker Named Volume** tells the host operating system:
*"Store the contents of `/data` in a persistent folder on the host machine's SSD that survives container recreation."*

In Redis, we enable **Append-Only File (AOF)** persistence (`redis-server --appendonly yes`) so every write operation is logged to the volume in real time:
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

### Startup Order & Health Checks (`depends_on` with `service_healthy`)

#### The Common Rookie Bug:
```yaml
# ❌ Flawed configuration
backend:
  depends_on:
    - redis
```
In Docker, basic `depends_on` only checks if the Redis container process has **started**, not whether Redis is actually **ready to accept TCP connections**.
If the Node.js backend starts 200 milliseconds before Redis finishes booting, Node fails to connect and crashes immediately.

#### The Professional Production Solution:
Add a **health check** to Redis that periodically executes `redis-cli ping`. Configure the backend and worker to only boot once Redis reports `service_healthy`:

```yaml
# ✅ Production-grade configuration
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    depends_on:
      redis:
        condition: service_healthy
```

---

### Kapota `docker-compose.yml`: Line-by-Line Anatomy

Here is the complete reference orchestration file designed specifically for Kapota:

```yaml
services:
  # =======================================================
  # 1. Redis: In-memory store for BullMQ Queues & Caching
  # =======================================================
  redis:
    image: redis:7-alpine
    container_name: kapota-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - kapota-network
    # Notice: NO "ports:" section! Redis is protected inside kapota-network.
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # =======================================================
  # 2. Backend API & Real-Time Socket.io Server
  # =======================================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kapota-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "5001:5001"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - kapota-network

  # =======================================================
  # 3. BullMQ Background Worker (Same Image, Worker Command)
  # =======================================================
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kapota-worker
    restart: unless-stopped
    # Override default CMD to run the worker process instead of server.js:
    command: ["node", "src/lib/worker.js"]
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - kapota-network

  # =======================================================
  # 4. Frontend Web App (Nginx serving compiled React Vite)
  # =======================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: kapota-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - kapota-network

# =======================================================
# Persistent Storage Volumes
# =======================================================
volumes:
  redis_data:
    driver: local

# =======================================================
# Isolated Container Bridge Network
# =======================================================
networks:
  kapota-network:
    driver: bridge
```

---

## 10. Networking, Reverse Proxies & WebSockets

### Why Put Nginx in Front of Node.js? (Reverse Proxy Architecture)
In production, you should **never** expose your Node.js application directly to the public internet on ports 80/443. Instead, you position an enterprise-grade reverse proxy like **Nginx** at the edge.

```
                              PUBLIC INTERNET
                                     │
                     ┌───────────────┴───────────────┐
                     │ Port 80 (HTTP)                │ Port 443 (HTTPS / WSS)
                     │ (Redirect to 443)             │
                     ▼                               ▼
      ┌─────────────────────────────────────────────────────────────┐
      │                        NGINX PROXY                          │
      │  - SSL/TLS Termination (Let's Encrypt)                      │
      │  - Unified Domain Ingress (Zero CORS issues for Web)        │
      │  - Gzip / Brotli Static Asset Compression                   │
      │  - Slowloris & Request Buffer Protection                    │
      └──────────────┬───────────────────────────────┬──────────────┘
                     │                               │
        Path: / or /assets/*                         │ Path: /api/*
                     │                               │ Path: /socket.io/*
                     ▼                               ▼
      ┌─────────────────────────────┐ ┌─────────────────────────────┐
      │     frontend Container      │ │      backend Container      │
      │  (Nginx serving Vite React) │ │    (Node.js / Socket.io)    │
      │     Internal Port: 80       │ │     Internal Port: 5001     │
      └─────────────────────────────┘ └─────────────────────────────┘
```

#### The 5 Critical Jobs of Nginx in Production:
1. **SSL/TLS Termination**:
   Public clients connect over encrypted HTTPS (Port 443) or secure WebSockets (WSS). Nginx handles the heavy CPU mathematical decryption at the boundary and forwards clean, unencrypted HTTP traffic internally to your Node.js container. This frees up the single-threaded Node.js event loop from cryptographic overhead.
2. **Unified Origin (Zero CORS Overhead for Web)**:
   By having Nginx serve both your React frontend (`/`) and Express backend (`/api`) under a single domain (e.g. `https://kapota.com`), browsers treat them as the **same origin**.
   - No CORS preflight `OPTIONS` requests for web requests.
   - HTTP-only authentication cookies work seamlessly without cross-domain cookie restrictions.
3. **Slowloris & Buffer Overflow Defense**:
   Node.js allocates memory for every open HTTP connection. If an attacker slowly sends HTTP headers (1 byte every 10 seconds), Node.js rapidly exhausts memory and crashes. Nginx buffers the entire request in C before passing it to Node.js in a single burst.
4. **Static File Performance & Caching**:
   Nginx serves static images, CSS, and compiled JavaScript bundles up to 10x faster than Node.js, utilizing Linux kernel `sendfile` optimizations and caching headers.
5. **Single Ingress Point for Firewalls**:
   Only Nginx needs public ports (80 and 443) open. The rest of your application stack (`backend:5001`, `redis:6379`) remains completely invisible to the outside world.

---

### The Complete Nginx Directive Encyclopedia

Nginx operates as an asynchronous, event-driven reverse proxy. Its configuration file is composed of **contexts** (enclosed in curly braces `{}`) and **directives** (individual statements terminated with a semicolon `;`).

Here is the exhaustive reference for all essential Nginx directives in modern web and real-time deployments:

#### 1. Core Server & Listener Directives
| Directive | Syntax & Example | Meaning & Purpose |
| :--- | :--- | :--- |
| **`server`** | `server { ... }` | Declares a virtual server block handling requests for specific domains and ports. |
| **`listen`** | `listen 80;`<br>`listen 443 ssl http2;`<br>`listen [::]:80;` | Specifies the TCP port, IPv4/IPv6 address, and protocol (SSL, HTTP/2) Nginx listens on. |
| **`server_name`** | `server_name kapota.com www.kapota.com;` | Compares the incoming HTTP `Host` header against domain names to determine which `server` block handles the request. |

#### 2. Location & Routing Directives
| Directive | Syntax & Example | Meaning & Purpose |
| :--- | :--- | :--- |
| **`location /`** | Prefix match: `location /api/ { ... }` | Matches any URI that begins with the specified string. |
| **`location =`** | Exact match: `location = /favicon.ico` | Matches only when the URI matches the exact string. Highest priority. |
| **`location ~`** | Regex match: `location ~ \.(png\|jpg)$` | Evaluates regular expressions (case-sensitive). `~*` is case-insensitive. |
| **`root`** | `root /usr/share/nginx/html;` | Defines the root directory on the local filesystem from which files are served. |
| **`index`** | `index index.html index.htm;` | Specifies the default file name Nginx looks for when a directory path is requested. |
| **`try_files`** | `try_files $uri $uri/ /index.html;` | **Essential for SPAs (React Router)**: Checks if the requested file exists, then if a folder exists, and if not, falls back to `/index.html` instead of throwing a 404. |

#### 3. Reverse Proxy & Upstream Directives
| Directive | Syntax & Example | Meaning & Purpose |
| :--- | :--- | :--- |
| **`proxy_pass`** | `proxy_pass http://backend:5001;` | Passes incoming requests over TCP/HTTP to an upstream service or container. |
| **`proxy_http_version`**| `proxy_http_version 1.1;` | **Mandatory for WebSockets & Keep-Alive**: Default is HTTP/1.0, which closes connections immediately. |
| **`proxy_set_header`** | `proxy_set_header Host $host;`<br>`proxy_set_header X-Real-IP $remote_addr;`<br>`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`<br>`proxy_set_header X-Forwarded-Proto $scheme;` | Rewrites or appends request headers sent to the upstream backend so the backend knows the real client IP, protocol, and domain. |
| **`proxy_read_timeout`**| `proxy_read_timeout 86400s;` | Maximum time Nginx waits for the upstream server to return data. Default is 60s (breaks idle WebSockets!). |
| **`proxy_send_timeout`**| `proxy_send_timeout 86400s;` | Maximum time allowed between two successive write operations sent to the upstream. |
| **`proxy_connect_timeout`**| `proxy_connect_timeout 60s;` | Timeout for establishing a TCP handshake with the upstream service. |

#### 4. Traffic Control, Security & Compression
| Directive | Syntax & Example | Meaning & Purpose |
| :--- | :--- | :--- |
| **`client_max_body_size`**| `client_max_body_size 50M;` | Caps the maximum size of file uploads. Prevents malicious or massive uploads from exhausting Node.js memory (`413 Entity Too Large`). |
| **`gzip`** | `gzip on;` | Enables real-time gzip compression for text-based responses to reduce bandwidth by up to 75%. |
| **`gzip_types`** | `gzip_types text/plain text/css application/json application/javascript;` | Specifies MIME types to compress (HTML is always compressed by default). |
| **`add_header`** | `add_header X-Frame-Options "SAMEORIGIN";`<br>`add_header Strict-Transport-Security "max-age=31536000";` | Injects custom security headers into responses sent back to the browser (clickjacking and HTTPS enforcement). |
| **`return`** | `return 301 https://$host$request_uri;` | Immediately terminates request processing and returns an HTTP status code or permanent redirect. |
| **`map`** | `map $http_upgrade $connection_upgrade { default upgrade; '' close; }` | Dynamically evaluates variables. In WebSockets, if client sends `Upgrade`, set `Connection: upgrade`; otherwise, set `Connection: close`. |

---

### Deep Dive: The WebSocket Protocol & The Upgrade Handshake

Unlike REST APIs which follow a short-lived Request $\rightarrow$ Response pattern, real-time chat in Kapota relies on **Socket.IO over WebSockets**. WebSockets maintain a persistent, bidirectional TCP connection between the client and the server.

#### The WebSocket Handshake Flow:
1. The client initiates a standard HTTP/1.1 GET request with special upgrade headers:
   ```http
   GET /socket.io/?EIO=4&transport=websocket HTTP/1.1
   Host: kapota.com
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13
   ```
2. The server responds with an HTTP status **`101 Switching Protocols`**:
   ```http
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   ```
3. The TCP connection stays open indefinitely, switching from HTTP to the binary/text WebSocket framing protocol.

#### Why Standard Proxies Break WebSockets:
By default, standard HTTP reverse proxies strip "hop-by-hop" headers (including `Upgrade` and `Connection`) per RFC 2616.
If Nginx strips these headers:
- The backend never receives the `Upgrade: websocket` directive.
- The WebSocket handshake fails.
- Socket.IO is forced to degrade to inefficient HTTP Long-Polling (making thousands of repetitive HTTP POST/GET requests every few seconds).

#### The Nginx Solution (`map` directive):
```nginx
# Map connection upgrade header dynamically:
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    location /socket.io/ {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;

        # Forward the Hop-by-Hop headers:
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### The Idle Disconnect Problem (`proxy_read_timeout`)

#### The Problem:
By default, Nginx has a `proxy_read_timeout` of **60 seconds**.
If two users are in a chat room and neither sends a message for 60 seconds:
- Nginx assumes the connection is dead.
- Nginx unilaterally closes the TCP connection.
- The client detects a disconnect, triggers reconnect logic, and floods your server with reconnect storms.

#### The Fix:
Extend the Nginx proxy timeout to 24 hours (`86400s`) and let Socket.IO's internal heartbeat ping-pong mechanism handle connection health:
```nginx
proxy_read_timeout 86400s;
proxy_send_timeout 86400s;
```

---

### SSL/TLS Automation: The ACME Protocol & Certbot

In modern production, unencrypted HTTP (`http://`) and raw WebSockets (`ws://`) are unusable:
- Passwords, chat messages, and JWT tokens travel across public Wi-Fi in plain text.
- Browsers disable camera, microphone, and geolocation APIs on non-HTTPS origins.
- iOS App Transport Security (ATS) and Android 9+ block non-HTTPS traffic by default.

#### How Let's Encrypt Works (The ACME Protocol):
Let's Encrypt is a free, automated Certificate Authority (CA) that issues 90-day SSL/TLS certificates using the **ACME (Automated Certificate Management Environment)** protocol.

```
+------------------------------------------------------------------+
|                   LET'S ENCRYPT ISSUANCE FLOW                    |
+------------------------------------------------------------------+
 1. Certbot on Server requests certificate for 'kapota.com'
    │
    ▼
 2. Let's Encrypt CA provides a random cryptographic challenge token
    │
    ▼
 3. Certbot places token at:
    http://kapota.com/.well-known/acme-challenge/<TOKEN>
    │
    ▼
 4. Let's Encrypt CA server validates token over Port 80
    │
    ▼
 5. Validation succeeds! CA issues:
    - fullchain.pem (Public Certificate)
    - privkey.pem   (Private Secret Key)
```

#### Zero-Downtime Auto-Renewal:
Let's Encrypt certificates are valid for 90 days. Certbot installs a systemd timer that runs twice daily. When a certificate is within 30 days of expiration, Certbot automatically renews it and reloads Nginx without downtime:
```bash
certbot renew --quiet
```

---

### Kapota Production `nginx.conf`: Line-by-Line Anatomy

Here is the complete, battle-tested Nginx reverse proxy configuration for your production server:

```nginx
# Map the WebSocket Upgrade header dynamically
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# =======================================================
# 1. HTTP Server Block (Port 80)
# Handles ACME challenge & forces redirect to HTTPS
# =======================================================
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt verification path
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# =======================================================
# 2. HTTPS Server Block (Port 443)
# Secure SSL termination & intelligent traffic routing
# =======================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Modern SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Maximum file upload size (matches Cloudinary media uploads)
    client_max_body_size 50M;

    # ---------------------------------------------------
    # Route A: REST API Endpoints
    # ---------------------------------------------------
    location /api/ {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ---------------------------------------------------
    # Route B: Real-Time WebSockets (Socket.IO)
    # ---------------------------------------------------
    location /socket.io/ {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;

        # Upgrade headers for persistent WebSocket connection
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 24-hour timeout prevents idle disconnects
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # ---------------------------------------------------
    # Route C: React Frontend Web Application (Vite SPA)
    # ---------------------------------------------------
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Mobile App (React Native) HTTPS & WSS Requirements

Because you also have a mobile app client for Kapota, mobile operating systems impose strict networking rules:

1. **iOS App Transport Security (ATS)**:
   Apple requires all network requests from iOS apps to use TLS 1.2 or TLS 1.3 with forward secrecy. Any connection to an insecure `http://` or `ws://` domain is blocked at the operating system level unless explicitly bypassed in `Info.plist` (which Apple often rejects during App Store review).
2. **Android Cleartext Traffic Restriction**:
   Starting with Android 9 (API level 28), cleartext HTTP traffic is blocked by default.
3. **Public CA Trust**:
   Self-signed certificates fail on mobile devices unless a custom root certificate is manually installed on each test phone. Because Let's Encrypt certificates are signed by **ISRG Root X1**, they are recognized and trusted natively by 100% of Android and iOS devices.

#### Mobile Endpoint Configuration:
In your React Native environment:
- **API Base URL**: `https://yourdomain.com/api`
- **Socket.io URL**: `https://yourdomain.com` (Socket.IO client automatically negotiates `wss://`)

---

## 11. AWS Cloud Infrastructure Fundamentals

### AWS Regions, Latency & The Global Infrastructure
AWS operates data centers across the globe grouped into **Regions** (e.g. `ap-south-1` in Mumbai, `us-east-1` in North Virginia, `eu-central-1` in Frankfurt). Each Region contains multiple isolated **Availability Zones (AZs)**.

```
┌────────────────────────────────────────────────────────┐
│ AWS Region (e.g., ap-south-1 Mumbai)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ VPC (Virtual Private Cloud - Your Network)       │  │
│  │                                                  │  │
│  │   ┌───────────────────────────────────────────┐  │  │
│  │   │ Security Group (Firewall)                 │  │  │
│  │   │ Allow: Port 22 (SSH), 80 (HTTP), 443(HTTPS)│ │  │
│  │   │ Deny:  All other ports (5001, 6379, etc.) │  │  │
│  │   │                                           │  │  │
│  │   │   ┌───────────────────────────────────┐   │  │  │
│  │   │   │ EC2 Instance (Ubuntu 24.04 LTS)   │   │  │  │
│  │   │   │ Type: t3.small (2 vCPU, 2GB RAM)  │   │  │  │
│  │   │   │ Storage: 25GB gp3 SSD             │   │  │  │
│  │   │   │ Swap: 2GB Virtual Memory File     │   │  │  │
│  │   │   │                                   │   │  │  │
│  │   │   │  [Docker Engine]                  │   │  │  │
│  │   │   │   ├── Nginx (Reverse Proxy :443)  │   │  │  │
│  │   │   │   ├── Backend (Socket.io/API)     │   │  │  │
│  │   │   │   ├── Worker (BullMQ Consumer)    │   │  │  │
│  │   │   │   └── Redis (Queue & Caching)     │   │  │  │
│  │   │   └───────────────────────────────────┘   │  │  │
│  │   └─────────────────────▲─────────────────────┘  │  │
│  └─────────────────────────┼────────────────────────┘  │
│                            │ Attached Static IP        │
│                     ┌──────┴──────┐                    │
│                     │ Elastic IP  │ (Permanent IPv4)   │
│                     └──────▲──────┘                    │
└────────────────────────────┼───────────────────────────┘
                             │ DNS (A Record)
                      [yourdomain.com]
```

#### Why Region Selection Matters for Kapota:
Real-time chat requires low network ping latency.
- If your users are primarily in India, hosting in `ap-south-1` (Mumbai) yields **~15–30ms** latency.
- Hosting in `us-east-1` (Virginia) forces every chat keystroke and message to cross two oceans, resulting in **~220–280ms** latency.
- **Rule of Thumb**: Always select the AWS region closest to your target audience.

---

### EC2 Instance Selection & Hardware Sizing for Kapota

An **EC2 (Elastic Compute Cloud)** instance is a virtual server running in AWS's cloud hypervisor.

#### Choosing the Right Instance Family:
| Instance Type | vCPU | RAM | Monthly Cost | Suitability for Kapota |
| :--- | :--- | :--- | :--- | :--- |
| **`t2.micro` / `t3.micro`** | 1 | 1 GB | ~$0 (Free Tier) | **Risky without Swap**: Running 4 containers (`frontend`, `backend`, `worker`, `redis`) will exhaust 1 GB RAM quickly during builds. |
| **`t3.small` (Recommended)** | 2 | 2 GB | ~$14 / month | **Optimal Sweet Spot**: Easily handles all 4 containers, Socket.IO connections, BullMQ queue spikes, and Node builds. |
| **`t4g.small` (ARM Graviton)**| 2 | 2 GB | ~$12 / month | High performance per dollar, but requires building ARM-compatible Docker images. |

#### Disk Storage (EBS):
- Select **EBS (Elastic Block Store)** type **`gp3`** (General Purpose SSD).
- Provision **25 GB to 30 GB**. This leaves ample space for Ubuntu OS files (~4GB), Docker container images (~3GB), persistent Redis data, and system logs.

---

### The Swap Space Lifesaver: Preventing Linux OOM Crashes

On cost-effective cloud VMs (1GB to 2GB RAM), running `npm run build` or handling sudden traffic spikes can momentarily consume all available physical memory.

#### What Happens When RAM Hits 100%?
The Linux kernel invokes the dreaded **OOM (Out Of Memory) Killer**.
The OOM killer scans all active processes, assigns them an "OOM score", and forcibly kills the most memory-intensive process with a `SIGKILL -9`. Often, this kills your Node.js backend or the Docker daemon itself!

#### The Solution: Linux Swap Space
Swap space is an allocated file on your SSD that acts as virtual overflow memory. When physical RAM fills up, Linux moves idle memory pages to Swap, preventing catastrophic server crashes.

#### Commands to Configure a Permanent 2GB Swap on Ubuntu:
```bash
# 1. Allocate a 2GB file on the SSD
sudo fallocate -l 2G /swapfile

# 2. Restrict permissions (only root can read/write swap)
sudo chmod 600 /swapfile

# 3. Format the file as Linux swap space
sudo mkswap /swapfile

# 4. Activate the swap file
sudo swapon /swapfile

# 5. Make it permanent across server reboots:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 6. Verify swap is active:
free -h
```

---

### Security Groups: Hypervisor-Level Firewall Mastery

An AWS **Security Group** acts as a virtual firewall for your EC2 instance. Unlike software firewalls running inside Linux (like `ufw`), AWS Security Groups filter traffic at the AWS hypervisor level before malicious packets ever reach your operating system.

#### Security Group Rules for Kapota:

| Type | Port Range | Protocol | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | `22` | TCP | `My IP` (`your.home.ip/32`) | Secure server administration. **Never set to `0.0.0.0/0`!** |
| **HTTP** | `80` | TCP | `0.0.0.0/0` | Port 80 for Let's Encrypt validation & HTTPS redirect. |
| **HTTPS**| `443` | TCP | `0.0.0.0/0` | Encrypted Web, Mobile API, and Secure WebSocket traffic. |

> [!CAUTION]
> **Strict Firewall Rule**:
> Never add inbound rules for Port `5001` (Backend) or Port `6379` (Redis). Because Nginx handles all public traffic on Port 80/443 and speaks to containers internally, your backend and database remain 100% shielded from internet scanners.

---

### Static IPs with AWS Elastic IP

By default, standard EC2 public IPv4 addresses are **dynamic**:
- If you reboot your instance, the IP address stays the same.
- **However**, if you ever **Stop** and **Start** the instance (e.g. to change instance size or maintenance), AWS releases the IP and assigns a completely new random public IP!
- If this happens, your domain DNS breaks immediately, and all users lose access to Kapota.

#### The Solution:
Allocate an **AWS Elastic IP (EIP)** and associate it with your EC2 instance.
- An Elastic IP is a permanent, static IPv4 address dedicated to your AWS account.
- **AWS Cost Rule**: Elastic IPs are **100% free** as long as they are attached to an active, running EC2 instance.

---

### DNS Configuration (Route 53, Cloudflare, Namecheap)

Once your Elastic IP is attached to your EC2 instance (e.g., `13.233.45.67`), you point your custom domain to it using DNS records.

In your DNS provider dashboard (e.g. Cloudflare, Route 53, GoDaddy):

| Record Type | Host / Name | Value / Target | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A Record** | `@` (or `yourdomain.com`) | `13.233.45.67` (Elastic IP) | `300` (5 mins) | Maps root domain to server |
| **A Record** or **CNAME** | `www` | `13.233.45.67` or `yourdomain.com` | `300` (5 mins) | Maps www subdomain |
| **A Record** (Optional) | `api` | `13.233.45.67` | `300` (5 mins) | Dedicated mobile API subdomain |

*(Setting TTL to 300 seconds during setup ensures DNS updates take effect in minutes rather than hours).*

---

### SSH Access & Ubuntu Server Initialization Script

To connect securely to your newly launched AWS EC2 instance from your computer:

#### 1. Secure Your Key Pair (`.pem` file):
- **On Windows (PowerShell)**:
  ```powershell
  icacls "your-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
  ```
- **On macOS / Linux**:
  ```bash
  chmod 400 your-key.pem
  ```

#### 2. Connect via SSH:
```bash
ssh -i "path/to/your-key.pem" ubuntu@<YOUR_ELASTIC_IP>
```

#### 3. Ubuntu Server Initialization Script (One-Time Setup):
Once connected to your Ubuntu 24.04 server, run these commands to configure the host for Docker:

```bash
# 1. Update operating system packages
sudo apt update && sudo apt upgrade -y

# 2. Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release htop ufw

# 3. Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine, CLI, and Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Allow 'ubuntu' user to run Docker commands without 'sudo'
sudo usermod -aG docker ubuntu

# 6. Apply group changes (or log out and log back in)
newgrp docker

# 7. Verify Docker installation
docker --version
docker compose version
```

Now your AWS cloud server is fully hardened, equipped with virtual memory swap protection, and ready to orchestrate your Docker containers!

---

## 12. Databases, Queues & Stateless Architecture

### The Golden Rule: Stateless Compute
In professional cloud DevOps, your backend application servers must be **100% stateless**:
- No user session data is held in Node.js server RAM.
- No user-uploaded files or images are stored on the local container hard drive.
- Any container can be killed, restarted, or duplicated across 10 servers without losing a single message or disconnecting active sessions.

```
      ┌─────────────────────────────────────────────────────────────┐
      │               STATELESS COMPUTE (Disposable)                │
      │                                                             │
      │    ┌──────────────────┐             ┌──────────────────┐    │
      │    │ backend-api      │             │ backend-worker   │    │
      │    │ (Socket.io/REST) │             │ (BullMQ Worker)  │    │
      │    └────────┬─────────┘             └────────┬─────────┘    │
      └─────────────┼────────────────────────────────┼──────────────┘
                    │                                │
                    ▼                                ▼
      ┌─────────────────────────────────────────────────────────────┐
      │                PERSISTENCE LAYER (Durable)                  │
      │                                                             │
      │   MongoDB Atlas       Redis (Docker Vol)       Cloudinary   │
      │   (User & Chat Data)  (Queue Durability)       (Media CDN)  │
      └─────────────────────────────────────────────────────────────┘
```

---

### MongoDB in Production: Atlas vs. Self-Hosted Docker

A common junior mistake is running `image: mongo` inside Docker on a single budget cloud server. Here is why that is an anti-pattern for Kapota:

| Factor | **Self-Hosted Docker Mongo (Bad for Prod)** | **MongoDB Atlas (Managed DBaaS)** |
| :--- | :--- | :--- |
| **RAM Overhead** | MongoDB's WiredTiger storage engine reserves **50% of total RAM** by default. On a 2GB EC2 server, Mongo will starve Node.js and Redis, causing immediate memory crashes. | Runs on dedicated external cloud infrastructure. Zero RAM consumed on your EC2 instance. |
| **High Availability** | Single container. If the host SSD fails or the server reboots, the database goes down. | Automated **3-node Replica Set** (Primary + 2 Secondaries) with automatic failover in < 5 seconds. |
| **Disaster Recovery** | Manual backup scripts that are rarely tested. | Automated hourly snapshots and continuous point-in-time rollback. |
| **Network Security** | Vulnerable if port 27017 is accidentally exposed. | Protected by strict IP Access Lists and SSL/TLS encryption in transit. |

#### Production Atlas Whitelist Best Practice:
Never set your MongoDB Atlas Network Access to `0.0.0.0/0` (Allow from anywhere) in production.
Once your AWS EC2 instance has an **Elastic IP** (e.g. `13.233.45.67`), add **only** that specific IP (`13.233.45.67/32`) to the Atlas IP Access List. If an attacker gains your database credentials, they still cannot connect from outside your EC2 server!

---

### Mongoose Connection Pooling & Reconnect Resilience

When Express boots inside Docker, it must establish a resilient connection pool to MongoDB:

```javascript
// Production-hardened Mongoose connection logic
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL, {
      maxPoolSize: 10,             // Maintain up to 10 open socket connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas is unreachable
      socketTimeoutMS: 45000,      // Close idle sockets after 45s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1); // Exit process so Docker restart policy can reboot
  }
};
```

#### Graceful Shutdown Handling:
When you deploy a new version of Kapota, Docker sends a `SIGTERM` signal to the container. The backend should close database connections cleanly before exiting:
```javascript
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing MongoDB connections...");
  await mongoose.connection.close();
  process.exit(0);
});
```

---

### Redis Deep Dive: BullMQ Queue Persistence & Eviction Policies

Redis is an in-memory data structure store. In Kapota, it serves as the backbone for **BullMQ** (handling email notifications, background calculations, and message queues).

#### The Eviction Trap (`maxmemory-policy`):
By default, some Redis installations use an eviction policy like `volatile-lru` or `allkeys-lru`. If memory usage peaks, Redis silently purges the oldest keys.
> [!CAUTION]
> **Queue Corruption Danger**:
> BullMQ stores job states across multiple linked keys (hashes, sorted sets, streams). If Redis evicts a single key because RAM is full, the BullMQ queue state becomes corrupted and jobs vanish without an error!
> **The Fix**: Always configure Redis with `maxmemory-policy noeviction`. If memory fills up, Redis returns an out-of-memory error to the application instead of secretly discarding jobs.

#### Dual Persistence: RDB + AOF
To ensure zero data loss during server maintenance:
1. **RDB (Redis Database File)**: Creates compact point-in-time binary snapshots on disk every few minutes.
2. **AOF (Append-Only File)**: Logs every single write command received by Redis to an append-only log file.
In `docker-compose.yml`, we enable `appendonly yes` and mount `redis_data:/data`.

---

### Decoupled Object Storage: Cloudinary CDN Architecture

In [backend/package.json](file:///D:/personal_projects/KapotaChatApp/backend/package.json), Kapota uses [`cloudinary`](file:///D:/personal_projects/KapotaChatApp/backend/package.json#L19).

#### Why Never Store Files on the Local Server Filesystem?
1. **Ephemeral Containers**: If you save user avatars or voice notes to a local `/uploads` folder, the next time Docker redeploys or restarts, all user media is wiped.
2. **Disk Exhaustion**: Uploaded images and videos rapidly consume the EC2 SSD, bringing down the operating system.
3. **Bandwidth Choke**: Serving high-resolution photos through Node.js ties up network bandwidth and process threads.

#### The Cloudinary Flow:
```
User Device (Web/Mobile)
         │
         │ 1. Uploads Image/Voice Note
         ▼
  Express Backend (:5001)
         │
         │ 2. Streams buffer directly to Cloudinary API
         ▼
  Cloudinary Cloud Storage
         │
         │ 3. Stores file & transforms (crops, optimizes WebP)
         │ 4. Returns permanent CDN URL (e.g., https://res.cloudinary.com/...)
         ▼
  Express Backend
         │
         │ 5. Saves ONLY the lightweight URL string into MongoDB
         ▼
  MongoDB Atlas
```
When another user views the chat message, their browser or phone downloads the image directly from Cloudinary's worldwide Content Delivery Network (CDN), placing **zero bandwidth load** on your EC2 server.

---

## 13. Security, Environment Variables & SSL/TLS

### The 12-Factor App: Configuration & Secret Management
The industry-standard **12-Factor App** methodology mandates complete separation of code from configuration.

1. **Zero Secrets in Git**:
   Your `.gitignore` and `.dockerignore` must always include:
   ```text
   .env
   .env.production
   .env.local
   *.pem
   ```
2. **Template Blueprint (`.env.example`)**:
   Commit only [backend/.env.example](file:///D:/personal_projects/KapotaChatApp/backend/.env.example) to Git, containing empty keys with descriptive documentation so developers and CI/CD pipelines know which environment variables are required.

---

### Hardening Production Secrets on EC2 (`chmod 600`)

On your production AWS EC2 instance, you create a real `.env` file containing live credentials. To prevent unauthorized Linux users or malicious processes from reading your database strings:

```bash
# Set file ownership to ubuntu user
chown ubuntu:ubuntu /home/ubuntu/KapotaChatApp/backend/.env

# Restrict permissions: Read & Write for owner ONLY
chmod 600 /home/ubuntu/KapotaChatApp/backend/.env
```

| Permission Digit | Meaning | Binary | Who Can Access |
| :--- | :--- | :--- | :--- |
| **`6`** (Owner) | Read (4) + Write (2) | `rw-` | `ubuntu` (Admin) |
| **`0`** (Group) | No access | `---` | None |
| **`0`** (Others)| No access | `---` | None |

---

### CORS Security for Web and React Native Mobile Clients

**CORS (Cross-Origin Resource Sharing)** is a browser security mechanism designed to prevent malicious websites from making unauthorized requests to your API.

#### The Important Distinction: Browsers vs. Mobile Apps
- **Web Browsers**: Always attach an `Origin` HTTP header (e.g. `Origin: https://kapota.com`). If the server does not return `Access-Control-Allow-Origin`, the browser blocks the response.
- **Native Mobile Apps (React Native / Expo)**: Do **not** run inside a web browser and often do **not** send an `Origin` header (or send custom schemes like `exp://` or `null`).

#### Production CORS Configuration in Express:
```javascript
import cors from "cors";

const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. "https://kapota.com"
  process.env.RN_URL,       // e.g. "exp://192.168.1.5:8081" (during dev)
];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow mobile apps & Postman (requests with NO origin header)
    if (!origin) return callback(null, true);

    // 2. Allow whitelisted web domains
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // 3. Block unauthorized web origins
    return callback(new Error("Blocked by CORS policy"));
  },
  credentials: true, // Allow cookies and authorization headers
}));
```

---

### JWT Cryptographic Key Generation & Production Cookies

In [backend/.env.example](file:///D:/personal_projects/KapotaChatApp/backend/.env.example#L6), you have `JWT_SECRET`.

#### Generating a Production-Grade Secret:
Never use human passwords (like `mysecretpassword123`) for signing JWTs. Generate a cryptographically secure, high-entropy 256-bit key:
```bash
# Run on your server terminal:
openssl rand -base64 48
```
*(Example output: `9tG7xQ1LzK4pWm0YvB8eJn2Ra5Ts3Ud6Fh8Vc9Xb0Mn2Kj5Lq1P=`)*

#### Hardening Authentication Cookies in Express:
When setting authentication cookies in production:
```javascript
res.cookie("jwt", token, {
  httpOnly: true, // Immune to JavaScript XSS attacks (document.cookie cannot read it)
  secure: process.env.NODE_ENV === "production", // Transmitted ONLY over HTTPS
  sameSite: "lax", // Protects against Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
});
```

---

## 14. CI/CD (Continuous Integration & Continuous Deployment)

CI/CD completely eliminates manual, error-prone deployment routines ("deploying by hand over SSH late at night").

```
Developer pushes code to 'main'
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS (Automated Cloud CI Runner: 4-Core, 16GB)    │
│  1. Checkout code & run linter                              │
│  2. Set up Docker Buildx with GitHub Layer Cache            │
│  3. Log in to GitHub Container Registry (ghcr.io)           │
│  4. Build & Push Frontend Image (:sha, :latest)             │
│  5. Build & Push Backend/Worker Image (:sha, :latest)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Secure SSH Trigger
┌─────────────────────────────────────────────────────────────┐
│ AWS EC2 PRODUCTION SERVER                                   │
│  1. Background pull of prebuilt images:                     │
│     docker compose pull                                     │
│  2. Near-zero downtime container reload:                    │
│     docker compose up -d --remove-orphans                   │
│  3. Prune old dangling image layers to save SSD space:      │
│     docker image prune -f                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Continuous Integration (CI) vs. Continuous Deployment (CD)

- **Continuous Integration (CI)**:
  The practice of automatically testing and validating code every time a developer commits. Linters check for syntax errors, test suites execute, and Docker images are compiled in an isolated GitHub sandbox. If a build breaks, the pipeline fails immediately, **preventing defective code from ever touching your production server**.
- **Continuous Deployment (CD)**:
  The practice of automatically releasing validated code to production servers without manual human steps. When a commit passes all CI checks on the `main` branch, the deployment pipeline executes the release automatically.

---

### Why Build in GitHub Actions Instead of the Production Server?

A very common junior DevOps mistake is logging into the EC2 server, running `git pull`, and typing `docker compose build`.

#### Why Building on the Server is Dangerous:
1. **CPU & RAM Starvation**:
   Compiling a Vite React frontend (`npm run build`) and compiling Node.js dependencies consumes huge amounts of CPU and memory. On a budget cloud instance (like `t3.small`), running `docker build` will spike CPU to 100% and consume available RAM.
   **Result**: Active WebSocket connections lag, chat messages drop, and users experience reconnect disconnects while you deploy!
2. **GitHub Runners are Free, Fast, and Disposable**:
   GitHub Actions provides dedicated virtual machines with 4 vCPUs, 16 GB RAM, and multi-gigabit internet bandwidth for free (standard tier). Heavy image compilation happens entirely off-server.
3. **The EC2 Server Stays Fast**:
   By building images in GitHub Actions, your EC2 server only needs to do one lightweight task: **download the prebuilt image and restart the container** (`docker compose pull && docker compose up -d`), which takes less than 2 seconds!

---

### Container Registry Strategy & Immutable Commit Tagging

A **Container Registry** is a cloud library for storing and distributing Docker images. We use **GitHub Container Registry (GHCR)** (`ghcr.io`) because it lives right next to your code repository and requires zero external accounts.

#### The Dual Tagging Strategy:
For every image built, we assign two tags:
1. **`:latest`**:
   Points to the most recent deployment. Used by `docker-compose.yml` on the server to easily pull the newest release.
2. **`:${{ github.sha }}`** (e.g. `:sha-f3a9b1c`):
   An immutable snapshot permanently tied to the exact 7-character Git commit hash that produced it.

#### The 5-Second Instant Rollback:
If a deployment ever introduces a critical bug:
- You don't need to rebuild code or scramble through git commits.
- You simply update the image tag in your server's Compose file to the previous commit hash:
  ```yaml
  image: ghcr.io/yourusername/kapota-backend:sha-abc1234
  ```
- Run `docker compose up -d`, and the healthy previous version is instantly restored in seconds.

---

### Zero-Downtime Deployment Flow Over SSH

When deploying an update to an active real-time chat application, you want minimal disruption to connected users.

#### How the Automated CD Step Works:
1. **Background Image Download**:
   ```bash
   docker compose pull
   ```
   Docker downloads the new image layers over the network in the background while your old containers are **still actively serving chat users**.
2. **Instant Container Recreation**:
   ```bash
   docker compose up -d --remove-orphans
   ```
   Docker inspects the downloaded images against running containers. If an image changed, Docker stops the old container and boots the new container in milliseconds.
3. **Garbage Collection (Disk Maintenance)**:
   ```bash
   docker image prune -f
   ```
   Over weeks of deployments, old image layers accumulate on the SSD. Pruning deletes dangling, unused image layers, keeping hard drive usage minimal.

---

### Kapota GitHub Actions Pipeline (`deploy.yml`): Line-by-Line Anatomy

Here is the complete, production-ready workflow file to be placed at `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy Kapota to AWS

# Trigger this pipeline automatically on any push to the main branch
on:
  push:
    branches:
      - main
  workflow_dispatch: # Allows manual trigger from GitHub UI if needed

# Grant permissions to write Docker images to GitHub Container Registry
permissions:
  contents: read
  packages: write

jobs:
  # =======================================================
  # JOB 1: Build & Push Docker Images to GHCR
  # =======================================================
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx (Advanced Layer Caching)
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Build & Push Backend Image
      - name: Build & Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:latest
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Build & Push Frontend Image
      - name: Build & Push Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/frontend:latest
            ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # =======================================================
  # JOB 2: Deploy to AWS EC2 via SSH
  # =======================================================
  deploy:
    needs: build-and-push # Only runs after images are successfully built & pushed
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to AWS EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            # Navigate to project directory on EC2
            cd /home/ubuntu/KapotaChatApp

            # Log in to GHCR on the EC2 server to pull private images
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin

            # Pull newly pushed images
            docker compose pull

            # Recreate containers with new images
            docker compose up -d --remove-orphans

            # Clean up old unused images
            docker image prune -f
```

---

### Configuring Repository Secrets in GitHub

To allow GitHub Actions to communicate securely with your AWS EC2 server without exposing private credentials in code:

In your GitHub repository, navigate to:
**Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions $\rightarrow$ New repository secret**

| Secret Name | Value to Enter | Description |
| :--- | :--- | :--- |
| **`EC2_HOST`** | `13.233.45.67` | Your AWS Elastic IP address |
| **`EC2_USER`** | `ubuntu` | Default SSH username for Ubuntu |
| **`EC2_SSH_KEY`** | `-----BEGIN RSA PRIVATE KEY----- ...` | The complete text content of your `.pem` key file |

*(Note: `GITHUB_TOKEN` is automatically created and injected by GitHub on every run—no manual configuration required!)*

---

## 15. Observability: Logging, Monitoring & Maintenance

DevOps does not end when your code is deployed. Operating software reliably over months and years ("Day 2 Operations") requires **observability** and proactive maintenance.

---

### The Three Pillars of Observability in Production

To troubleshoot a production incident without guessing, you need three distinct types of telemetry:

```
                  ┌─────────────────────────────────────────┐
                  │       THE OBSERVABILITY TRIAD           │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
  │     LOGS     │              │   METRICS    │              │ HEALTHCHECKS │
  │ Discrete     │              │ Numeric      │              │ Automated    │
  │ event traces │              │ data points  │              │ dependency   │
  │ (Who did     │              │ over time    │              │ readiness    │
  │ what & why)  │              │ (CPU, RAM)   │              │ probes       │
  └──────────────┘              └──────────────┘              └──────────────┘
```

1. **Logs**:
   Structured event records emitted by your application (e.g. user authentication events, unhandled rejection stack traces, WebSocket disconnect reasons).
2. **Metrics**:
   Aggregated numerical indicators over time:
   - System metrics: CPU utilization %, physical RAM vs Swap usage %, disk I/O.
   - Application metrics: Active Socket.IO WebSocket connections, HTTP response latency, BullMQ queue depth.
3. **Health Checks**:
   Automated synthetic probes that test whether your application and its downstream dependencies (MongoDB Atlas and Redis) are functioning properly.

---

### The Docker Log Disk-Full Trap & Rotation Fix

The single most common cause of unexpected server crashes for Node.js Docker deployments is **unrotated JSON log files**.

#### The Danger:
By default, Docker captures all `console.log()`, `console.error()`, and Nginx access logs and writes them to a hidden JSON file on the host SSD:
`/var/lib/docker/containers/<container-id>/<container-id>-json.log`

- By default, Docker has **no file size limit**.
- In a chat application, millions of real-time messages, heartbeats, and HTTP requests cause this file to grow to 10GB, 20GB, or 30GB over weeks.
- **When the SSD reaches 100% full**:
  - The Linux operating system cannot write temporary files.
  - Node.js crashes with `ENOSPC: no space left on device`.
  - Database writes fail, and SSH access can freeze.

#### The Production Fix (Docker Compose Log Rotation):
In `docker-compose.yml`, configure strict rotation caps on every service:

```yaml
services:
  backend:
    image: ghcr.io/yourusername/kapota-backend:latest
    logging:
      driver: "json-file"
      options:
        max-size: "20m" # Roll over when log reaches 20 Megabytes
        max-file: "3"   # Keep only the last 3 files (Max 60MB total disk usage)
```
*(With this setting, the container logs will never consume more than 60MB of disk space, permanently protecting your server).*

---

### Deep Health Checks: Building `/api/health` for Express & Redis

#### The Rookie Mistake: Shallow Health Checks
```javascript
// ❌ Flawed: Shallow health check
app.get("/api/health", (req, res) => res.status(200).send("OK"));
```
*Why this fails*: If MongoDB Atlas or Redis crashes, Express continues returning `200 OK` because the Node.js process is still running, even though 100% of user requests are failing!

#### The Professional Standard: Deep Dependency Probe
A true production health check actively verifies connectivity to your backing services:

```javascript
// ✅ Production-grade deep health check endpoint
import mongoose from "mongoose";
import { redisClient } from "./lib/redis.js";

app.get("/api/health", async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: "OK",
    services: {
      database: "UNKNOWN",
      redis: "UNKNOWN",
    },
  };

  try {
    // 1. Check MongoDB connectivity
    if (mongoose.connection.readyState === 1) {
      health.services.database = "HEALTHY";
    } else {
      health.services.database = "DISCONNECTED";
      health.status = "DEGRADED";
    }

    // 2. Check Redis ping
    const redisPing = await redisClient.ping();
    if (redisPing === "PONG") {
      health.services.redis = "HEALTHY";
    } else {
      health.services.redis = "UNRESPONSIVE";
      health.status = "DEGRADED";
    }

    const statusCode = health.status === "OK" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    health.status = "DOWN";
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

#### Connecting to Docker Healthcheck:
In `docker-compose.yml`, tell Docker to ping this endpoint every 30 seconds:
```yaml
backend:
  healthcheck:
    test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 15s
```
If MongoDB or Redis fails and the healthcheck fails 3 times in a row, Docker flags the container as `unhealthy` and automatically triggers a restart!

---

### Essential Server Monitoring Tools (`docker stats`, `htop`, `df -h`)

When SSHed into your production EC2 server, use these native Linux commands to diagnose server health:

#### 1. Live Container Resource Usage (`docker stats`):
```bash
docker stats
```
Displays an interactive live dashboard showing:
- Container Name (`kapota-backend`, `kapota-worker`, `kapota-redis`)
- CPU % (instantly identifies runaway infinite loops)
- Memory Usage vs Limit (shows if you are nearing physical RAM capacity)
- Network I/O (monitors WebSocket chat traffic bandwidth)

#### 2. System Process & CPU Inspector (`htop`):
```bash
htop
```
- Press `P` to sort processes by highest CPU usage.
- Press `M` to sort processes by highest Memory consumption.
- Press `q` to exit.

#### 3. Disk Space Check (`df -h`):
```bash
df -h
```
Shows the percentage used on `/` (root filesystem). If `Use%` exceeds 85%, disk cleanup is urgently needed.

#### 4. Memory and Swap Consumption (`free -h`):
```bash
free -h
```
Shows exact physical RAM used, free RAM, and whether Linux is utilizing your Swapfile.

#### 5. Real-Time Tail of Container Logs:
```bash
# View last 100 lines and follow live logs for the backend:
docker compose logs -f --tail=100 backend

# View logs for worker only:
docker compose logs -f --tail=50 worker
```

---

### Automated Maintenance Runbook & Safe Disk Pruning

Over weeks of continuous deployment, old Docker image layers and build caches remain on the server SSD.

#### Manual Safe Cleanup Command:
```bash
# Deletes dangling image layers, stopped containers, and unused build caches:
docker system prune -f
```

> [!WARNING]
> **Never include `--volumes` in production**:
> Running `docker system prune --volumes` can wipe out unattached Docker volumes, potentially deleting your persistent Redis queue data! Always use `docker system prune -f` without the `--volumes` flag.

#### Automated Weekly Disk Maintenance (Linux Cron Job):
Set up a cron job so your Ubuntu server cleans up old image layers automatically every Sunday at 3:00 AM:

```bash
# 1. Open crontab editor
crontab -e

# 2. Add this line at the bottom:
0 3 * * 0 /usr/bin/docker system prune -f >> /var/log/docker-prune.log 2>&1
```

Now, your production deployment has complete automated monitoring, disk explosion immunity, deep health checks, and routine self-cleaning!

---

## 16. Kapota Implementation Blueprint (Reference Architecture)

When you decide to implement, this is the clean, production-grade structure we will set up:

```
KapotaChatApp/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI/CD pipeline
├── backend/
│   ├── Dockerfile              # Multi-stage Node.js container
│   ├── .dockerignore           # Prevents node_modules/.env from copying
│   └── src/
├── frontend/
│   ├── Dockerfile              # Multi-stage: Node build -> Nginx alpine
│   ├── nginx.conf              # SPA routing (try_files) & compression
│   ├── .dockerignore
│   └── src/
├── nginx/
│   └── default.conf            # Main reverse proxy (SSL, WebSocket, /api routing)
├── docker-compose.yml          # Coordinates web, api, worker, redis, nginx
└── .env.production.example     # Template for all production secrets
```

---

## 17. Essential DevOps Command Cheat Sheet & Glossary

### Daily Docker Commands
| Command | What It Does |
| :--- | :--- |
| `docker compose up -d --build` | Builds images, creates networks/volumes, and runs in background |
| `docker compose ps` | Displays status of all running containers |
| `docker compose logs -f <service>` | Streams real-time logs for a specific service (e.g. `backend`) |
| `docker compose restart <service>` | Safely restarts a single container |
| `docker compose down` | Stops and removes all containers and networks |
| `docker exec -it <container> sh` | Opens an interactive terminal shell inside a running container |
| `docker system prune -af` | Cleans up unused containers, images, and build caches |

### Server Health Commands (Linux / Ubuntu)
| Command | What It Does |
| :--- | :--- |
| `htop` | Real-time interactive CPU, RAM, and process monitor |
| `df -h` | Shows available disk space on all mounted drives |
| `free -m` | Displays used and available physical RAM and swap memory in MB |
| `journalctl -u docker -n 50 --no-pager` | Shows system logs for the Docker service |

### Key Glossary Terms
- **Reverse Proxy**: A server that sits in front of one or more web servers, intercepting requests and routing them appropriately.
- **WebSocket Upgrade**: An HTTP mechanism allowing a client to negotiate switching protocols from HTTP/1.1 to full-duplex TCP WebSockets.
- **Statelessness**: Designing an application so that no client state or persistent files are stored on the server running the code.
- **CIDR Block**: A method for allocating IP addresses and routing IP packets (e.g. `0.0.0.0/0` means all internet addresses).
- **Sticky Sessions**: A load balancing technique that routes a client's requests to the exact same backend server (essential for multi-instance Socket.IO when a Redis adapter is not used).

---

> [!TIP]
> Keep this document as your conceptual handbook. Whenever you feel ready to start actual implementation, let me know, and we will take it step-by-step!
