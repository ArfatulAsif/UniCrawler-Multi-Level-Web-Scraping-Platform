

# **Project: UniCrawler High-End**

### **Mission Statement**

To build a scalable, distributed crawler capable of extracting specific intelligence (scholarships, admissions, research grants) from modern, complex university websites and streaming the results instantly to a user dashboard without persistent storage latency.

----------




## **1. System Architecture**

The system follows a **Event-Driven, Stateless Architecture**. It is designed to be a "Pipe," not a "Bucket." Data flows through it; it doesn't stay in it.

### **The Data Flow (Lifecycle of a Request)**

1.  **Initiation:** User submits `cam.ac.uk` + `["Scholarship", "PhD"]` via React Frontend.
    
2.  **Dispatch:** FastAPI generates a `Job ID` (e.g., `job_123`) and pushes the seed URL to Redis Queue.
    
3.  **Connection:** React immediately subscribes to WebSocket channel `ws://api/stream/job_123`.
    
4.  **The Swarm:** 10+ Celery Workers (in Docker) pick up tasks in parallel.
    
    -   **Worker A** parses HTML.
        
    -   **Worker B** renders JavaScript (Playwright).
        
    -   **Worker C** extracts text from a PDF.
        
5.  **Discovery:** When a worker finds a match, it publishes the data to Redis Pub/Sub.
    
6.  **Delivery:** FastAPI's WebSocket listener catches the message and pushes it to React.
    
7.  **Visualization:** The user sees the result appear instantly on the dashboard.
    

----------

## **2. Project Directory Structure**

The project is split into two distinct repositories/folders: `backend` and `frontend`.

### **A. Backend Structure (Python/FastAPI)**

Plaintext

```
uni_crawler_backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Entry point (FastAPI App)
│   │
│   ├── api/                     # API Interface
│   │   ├── __init__.py
│   │   ├── routes.py            # POST /crawl (Starts job)
│   │   └── websocket.py         # WS /stream/{job_id} (Data Pipe)
│   │
│   ├── core/                    # Infrastructure
│   │   ├── config.py            # Loads .env variables
│   │   ├── celery_app.py        # Task Queue Configuration
│   │   └── redis_client.py      # Async Redis Connection
│   │
│   ├── crawler/                 # The Intelligence Engine
│   │   ├── __init__.py
│   │   ├── manager.py           # Logic: Decisions & Scoring
│   │   ├── fetcher.py           # Tool: Hybrid HTTPX/Playwright
│   │   ├── extractor.py         # Tool: Selectolax/PyPDF Parser
│   │   └── utils.py             # User-Agent rotation, URL cleaning
│   │
│   ├── tasks/                   # The Workers
│   │   ├── __init__.py
│   │   └── worker.py            # The Celery Task definitions
│   │
│   └── schemas/                 # Data Models
│       └── messages.py          # Pydantic models for WebSocket msgs
│
├── .env                         # Secrets (Redis URL, concurrency)
├── docker-compose.yml           # Orchestration
├── Dockerfile.api               # API Container Image
├── Dockerfile.worker            # Worker Container Image
└── requirements.txt             # Dependencies

```

### **B. Frontend Structure (React/TypeScript)**

Plaintext

```
uni_crawler_frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── CrawlForm.tsx        # Input for URL & Keywords
│   │   ├── ResultsTable.tsx     # Live Data Grid
│   │   └── StatusBadge.tsx      # Connection Indicator
│   │
│   ├── hooks/
│   │   └── useCrawler.ts        # WebSocket & State Logic
│   │
│   ├── types/
│   │   └── index.ts             # TS Interfaces (CrawlResult)
│   │
│   ├── App.tsx                  # Layout
│   ├── main.tsx                 # Entry
│   └── index.css                # Tailwind Styles
│
├── package.json
├── tailwind.config.js
└── tsconfig.json

```

----------


<img src="1.png">

<img src="2.png">

<img src="3.png">




## **3. Detailed Functionality**

### **Backend Functionality**

#### **1. The Hybrid Fetcher (`app/crawler/fetcher.py`)**

-   **Smart Switching:**
    
    -   Tries `httpx` (Async HTTP) first for speed (100ms).
        
    -   If response body < 2kb or contains `<div id="root">`, it assumes a React App.
        
    -   **Fallback:** Launches `Playwright` (Headless Chromium) to execute JS and wait for content (2-5s).
        
-   **PDF Interception:**
    
    -   Detects `Content-Type: application/pdf`.
        
    -   Downloads bytes directly instead of parsing as HTML.
        

#### **2. The Universal Parser (`app/crawler/extractor.py`)**

-   **HTML:** Uses `selectolax` to remove "noise" (navbars, footers, sidebars).
    
-   **PDF:** Uses `pypdf` to extract text layers from documents.
    
-   **Keyword Scoring:** Checks if keywords (e.g., "Scholarship") appear in the _content area_, not just the menu.
    

#### **3. The Real-Time Stream (`app/api/websocket.py`)**

-   **Pub/Sub:** Uses Redis Channels.
    
-   **Mechanism:**
    
    -   `Frontend` connects to `ws://.../stream/job_123`.
        
    -   `Worker` finds data -> `redis.publish('job_123', json_data)`.
        
    -   `WebSocket` receives -> `await websocket.send_json(data)`.
        

#### **4. Distributed Workers (`app/tasks/worker.py`)**

-   **Concurrency:** Runs multiple worker processes per container.
    
-   **Deduplication:** Uses a Redis Set (`visited:job_123`) to ensure no URL is crawled twice.
    
-   **Recursion:** If a worker finds a new link on the same domain, it pushes it back to the queue for _another_ worker to pick up.
    

----------

### **Frontend Functionality**

#### **1. The Dashboard (`App.tsx`)**

-   **Input:** Accepts a target URL and a list of tags (keywords).
    
-   **State:** Tracks `Connecting`, `Scanning`, `Idle`.
    

#### **2. The Live Hook (`useCrawler.ts`)**

-   **Connection Management:** Automatically opens/closes WebSockets.
    
-   **Buffer:** Appends new results to the top of the list (`[new, ...old]`).
    
-   **Error Handling:** Detects if the backend disconnects and alerts the user.
    

#### **3. The Visualization (`ResultsTable.tsx`)**

-   **Instant Feedback:** Rows animate in as they arrive. Row after Row.
    
-   **Context:** Shows a text snippet (context) of where the keyword was found (e.g., "...students are eligible for the **Full Ride Scholarship** if...").
    
-   **Action:** Provides a direct link to the source page/PDF.
    

----------

## **4. Deployment & Orchestration**

The system is deployed using **Docker Compose**, creating a self-contained ecosystem.

**`docker-compose.yml` Configuration:**

**Service**

**Image**

**Role**

**`redis`**

`redis:alpine`

**The Brain.** Holds the Job Queue, Visited Set, and Pub/Sub channels.

**`api`**

`Dockerfile.api`

**The Face.** Exposes port `8000`. Handles HTTP/WS requests.

**`worker`**

`Dockerfile.worker`

**The Muscle.** Replicated 4x. Each container runs 10 concurrent threads.

**Scaling Command:**

To increase crawling power from 40 to 100 concurrent browsers:

Bash

```
docker-compose up -d --scale worker=10

```

----------

## **5. How to Run (Development)**

**Step 1: Start Infrastructure**

Bash

```
cd uni_crawler_backend
docker-compose up -d redis

```

**Step 2: Start Backend**

Bash

```
# Terminal 1 (API)
uvicorn app.main:app --reload

# Terminal 2 (Worker)
celery -A app.core.celery_app worker --loglevel=info

```

**Step 3: Start Frontend**

Bash

```
cd uni_crawler_frontend
npm run dev

```

**Step 4: Execute**

1.  Open `localhost:5173`.
    
2.  Enter `https://www.cam.ac.uk`.
    
3.  Add Keyword: `Scholarship`.
    
4.  Click **Launch**.
    
5.  Watch data stream in.This is the **Master Documentation** for **UniCrawler High-End**.

This document serves as the blueprint for building a distributed, real-time intelligence gathering system. It details the architecture, directory structure, and the exact flow of data from a raw URL to the user's screen.

----------

# **Project: UniCrawler High-End**

### **Mission Statement**

To build a scalable, distributed crawler capable of extracting specific intelligence (scholarships, admissions, research grants) from modern, complex university websites and streaming the results instantly to a user dashboard without persistent storage latency.

----------

## **1. System Architecture**

The system follows a **Event-Driven, Stateless Architecture**. It is designed to be a "Pipe," not a "Bucket." Data flows through it; it doesn't stay in it.

### **The Data Flow (Lifecycle of a Request)**

1.  **Initiation:** User submits `cam.ac.uk` + `["Scholarship", "PhD"]` via React Frontend.
    
2.  **Dispatch:** FastAPI generates a `Job ID` (e.g., `job_123`) and pushes the seed URL to Redis Queue.
    
3.  **Connection:** React immediately subscribes to WebSocket channel `ws://api/stream/job_123`.
    
4.  **The Swarm:** 10+ Celery Workers (in Docker) pick up tasks in parallel.
    
    -   **Worker A** parses HTML.
        
    -   **Worker B** renders JavaScript (Playwright).
        
    -   **Worker C** extracts text from a PDF.
        
5.  **Discovery:** When a worker finds a match, it publishes the data to Redis Pub/Sub.
    
6.  **Delivery:** FastAPI's WebSocket listener catches the message and pushes it to React.
    
7.  **Visualization:** The user sees the result appear instantly on the dashboard.
    

----------

## **2. Project Directory Structure**

The project is split into two distinct repositories/folders: `backend` and `frontend`.

### **A. Backend Structure (Python/FastAPI)**

Plaintext

```
uni_crawler_backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Entry point (FastAPI App)
│   │
│   ├── api/                     # API Interface
│   │   ├── __init__.py
│   │   ├── routes.py            # POST /crawl (Starts job)
│   │   └── websocket.py         # WS /stream/{job_id} (Data Pipe)
│   │
│   ├── core/                    # Infrastructure
│   │   ├── config.py            # Loads .env variables
│   │   ├── celery_app.py        # Task Queue Configuration
│   │   └── redis_client.py      # Async Redis Connection
│   │
│   ├── crawler/                 # The Intelligence Engine
│   │   ├── __init__.py
│   │   ├── manager.py           # Logic: Decisions & Scoring
│   │   ├── fetcher.py           # Tool: Hybrid HTTPX/Playwright
│   │   ├── extractor.py         # Tool: Selectolax/PyPDF Parser
│   │   └── utils.py             # User-Agent rotation, URL cleaning
│   │
│   ├── tasks/                   # The Workers
│   │   ├── __init__.py
│   │   └── worker.py            # The Celery Task definitions
│   │
│   └── schemas/                 # Data Models
│       └── messages.py          # Pydantic models for WebSocket msgs
│
├── .env                         # Secrets (Redis URL, concurrency)
├── docker-compose.yml           # Orchestration
├── Dockerfile.api               # API Container Image
├── Dockerfile.worker            # Worker Container Image
└── requirements.txt             # Dependencies

```

### **B. Frontend Structure (React/TypeScript)**

Plaintext

```
uni_crawler_frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── CrawlForm.tsx        # Input for URL & Keywords
│   │   ├── ResultsTable.tsx     # Live Data Grid
│   │   └── StatusBadge.tsx      # Connection Indicator
│   │
│   ├── hooks/
│   │   └── useCrawler.ts        # WebSocket & State Logic
│   │
│   ├── types/
│   │   └── index.ts             # TS Interfaces (CrawlResult)
│   │
│   ├── App.tsx                  # Layout
│   ├── main.tsx                 # Entry
│   └── index.css                # Tailwind Styles
│
├── package.json
├── tailwind.config.js
└── tsconfig.json

```

----------

## **3. Detailed Functionality**

### **Backend Functionality**

#### **1. The Hybrid Fetcher (`app/crawler/fetcher.py`)**

-   **Smart Switching:**
    
    -   Tries `httpx` (Async HTTP) first for speed (100ms).
        
    -   If response body < 2kb or contains `<div id="root">`, it assumes a React App.
        
    -   **Fallback:** Launches `Playwright` (Headless Chromium) to execute JS and wait for content (2-5s).
        
-   **PDF Interception:**
    
    -   Detects `Content-Type: application/pdf`.
        
    -   Downloads bytes directly instead of parsing as HTML.
        

#### **2. The Universal Parser (`app/crawler/extractor.py`)**

-   **HTML:** Uses `selectolax` to remove "noise" (navbars, footers, sidebars).
    
-   **PDF:** Uses `pypdf` to extract text layers from documents.
    
-   **Keyword Scoring:** Checks if keywords (e.g., "Scholarship") appear in the _content area_, not just the menu.
    

#### **3. The Real-Time Stream (`app/api/websocket.py`)**

-   **Pub/Sub:** Uses Redis Channels.
    
-   **Mechanism:**
    
    -   `Frontend` connects to `ws://.../stream/job_123`.
        
    -   `Worker` finds data -> `redis.publish('job_123', json_data)`.
        
    -   `WebSocket` receives -> `await websocket.send_json(data)`.
        

#### **4. Distributed Workers (`app/tasks/worker.py`)**

-   **Concurrency:** Runs multiple worker processes per container.
    
-   **Deduplication:** Uses a Redis Set (`visited:job_123`) to ensure no URL is crawled twice.
    
-   **Recursion:** If a worker finds a new link on the same domain, it pushes it back to the queue for _another_ worker to pick up.
    

----------

### **Frontend Functionality**

#### **1. The Dashboard (`App.tsx`)**

-   **Input:** Accepts a target URL and a list of tags (keywords).
    
-   **State:** Tracks `Connecting`, `Scanning`, `Idle`.
    

#### **2. The Live Hook (`useCrawler.ts`)**

-   **Connection Management:** Automatically opens/closes WebSockets.
    
-   **Buffer:** Appends new results to the top of the list (`[new, ...old]`).
    
-   **Error Handling:** Detects if the backend disconnects and alerts the user.
    

#### **3. The Visualization (`ResultsTable.tsx`)**

-   **Instant Feedback:** Rows animate in as they arrive.
    
-   **Context:** Shows a text snippet (context) of where the keyword was found (e.g., "...students are eligible for the **Full Ride Scholarship** if...").
    
-   **Action:** Provides a direct link to the source page/PDF.
    

----------

