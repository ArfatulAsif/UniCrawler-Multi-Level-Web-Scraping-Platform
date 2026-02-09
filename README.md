

# **Project: UniCrawler BFS-Spider**

### **Mission Statement**

To build a scalable, distributed crawler capable of extracting specific intelligence (scholarships, admissions, research grants) from modern, complex university websites and streaming the results instantly to a user dashboard without persistent storage latency.

----------


# View Platform:

<img src="4.gif">




## **1. System Architecture**

The system follows a **Event-Driven, Stateless Architecture**. It is designed to be a "Pipe," not a "Bucket." Data flows through it; it doesn't stay in it.

### **The Data Flow (Lifecycle of a Request)**

1.  **Initiation:** User submits `cam.ac.uk` + `["Scholarship", "PhD"]` via React Frontend.
    
2.  **Dispatch:** FastAPI generates a `Job ID` (e.g., `job_123`) and pushes the seed URL to Redis Queue.
    
3.  **Connection:** React immediately subscribes to WebSocket channel `ws://api/stream/job_123`.
    
4.  **The Swarm:** 10+ Celery Workers (in Docker) pick up tasks in parallel.
    
    -   **Worker A** parses HTML.
        
    -   **Worker B** renders JavaScript (Playwright).
    
    -
    
    -

        
5.  **Discovery:** When a worker finds a match, it publishes the data to Redis Pub/Sub.
    
6.  **Delivery:** FastAPI's WebSocket listener catches the message and pushes it to React.
    
7.  **Visualization:** The user sees the result appear instantly on the dashboard.
    

----------


## Run the Project:

**Backend**
```
cd uni_crawler_backend
docker-compose up --build

```

**Frontend**
```
cd uni_crawler_frontend
npm run dev

```


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

# Page:


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


<br>
<br>
<br>


# Concept Implemented In this Project:


### **Core Architecture & Design**

-   **Event-Driven Architecture:** The system reacts to events (user requests, found links) rather than storing state in a traditional database.
    
-   **Stateless Design ("Pipe not Bucket"):** Data is streamed instantly to the client rather than being saved to a persistent disk database, reducing latency.
    
-   **Microservices Pattern:** Separation of concerns between the API server (FastAPI) and the background workers (Celery).
    

### **Concurrency & Distributed Systems**

-   **Distributed Task Queues:** Using **Celery** to manage and distribute scraping jobs across multiple workers.
    
-   **Parallel Processing:** Running a "swarm" of workers to process multiple URLs simultaneously.
    
-   **Pub/Sub Messaging:** Using **Redis** to broadcast messages from workers to the API for real-time delivery.
    

### **Web Scraping & Algorithms**

-   **Breadth-First Search (BFS):** The crawling algorithm that explores neighbor nodes (links) layer by layer.
    
-   **Hybrid Rendering Strategy:** Smart switching between lightweight HTTP requests (**HTTPX**) and heavy headless browsing (**Playwright**) based on page complexity.
    
-   **Recursive Crawling:** Workers triggering new jobs for discovered links within the same domain.
    
-   **Set-Based Deduplication:** Using Redis Sets to track visited URLs in O(1) time to prevent infinite loops.
    


### **Frontend & Real-Time UX**

-   **WebSocket Communication:** Establishing persistent, bi-directional connections for live data streaming.
    


<br>
<br>

# How Implemented:



Here is the mapping of your **High-Level Concepts** to your specific **File Structure**.

This serves as a technical tour of your codebase.

----------

### **1. Core Architecture & Design**

-   **Microservices Pattern**
    
    -   **Where:** `docker-compose.yml`
        
    -   **How:** You defined two distinct services: `api` (the brain/interface) and `worker` (the muscle). They scale independently. If you need 50 crawlers, you just scale the `worker` container, while the `api` container stays the same.
        
-   **Stateless Design ("Pipe not Bucket")**
    
    -   **Where:** `app/api/websocket.py` & `app/tasks/worker.py`
        
    -   **How:** Notice that `worker.py` **never** does `database.save()`. Instead, it does `redis_client.publish()`. The data exists only for the millisecond it takes to travel from the Worker $\to$ Redis $\to$ WebSocket $\to$ React.
        

----------

### **2. Concurrency & Distributed Systems**

-   **Distributed Task Queues (Celery)**
    
    -   **Where:** `app/core/celery_app.py`
        
    -   **How:** This file configures Celery to use Redis as a "Broker". It tells the system: "When I say `crawl_task.delay()`, don't run it here. Package it up and send it to Redis for any available worker to grab."
        
-   **Parallel Processing (The Swarm)**
    
    -   **Where:** `app/tasks/worker.py` (specifically `@celery_app.task`)
        
    -   **How:** When you run `docker-compose up --scale worker=4`, you spin up 4 copies of this file. They all listen to the same queue and process different URLs simultaneously.
        
-   **Pub/Sub Messaging**
    
    -   **Where:** `app/api/websocket.py` (The Subscriber) & `app/tasks/worker.py` (The Publisher)
        
    -   **How:**
        
        -   **Worker:** `redis_client.publish(f"job:{job_id}", json_payload)` (Shouts the result).
            
        -   **API:** `pubsub.subscribe(f"job:{job_id}")` (Listens for the result and pushes it to the socket).
            

----------

### **3. Web Scraping & Algorithms**

-   **Breadth-First Search (BFS)**
    
    -   **Where:** `app/tasks/worker.py`
        
    -   **How:** The `level` parameter acts as the BFS depth tracker.
        
        -   **Start:** User requests `level=2`.
            
        -   **Logic:** The worker finds links and calls `crawl_page_task.delay(..., level=level-1)`.
            
        -   **Stop:** When `level=0`, the recursion stops. This ensures you scan "neighbors" before going deeper.
            
-   **Hybrid Rendering Strategy**
    
    -   **Where:** `app/crawler/fetcher.py`
        
    -   **How:** The `fetch` method has an `if/else` block.
        
        -   **Step 1:** Try `httpx.get()` (Fast, 0.1s).
            
        -   **Step 2:** If the response is tiny or empty (React app), catch the error and switch to `_fetch_with_browser()` (Playwright, 3s).
            
-   **Recursive Crawling & Domain Guard**
    
    -   **Where:** `app/crawler/utils.py` (Function `is_same_domain`)
        
    -   **How:** Before triggering a new crawl task, the worker checks:
        
        `if URLUtils.is_same_domain(current_url, new_link): crawl_task.delay(...)`
        
        This ensures your bot doesn't accidentally wander off from `harvard.edu` to `facebook.com`.
        
-   **Set-Based Deduplication (O(1))**
    
    -   **Where:** `app/tasks/worker.py`
        
    -   **How:**
        
        Python
        
        ```
        if redis_client.sismember(f"visited:{job_id}", url): return
        redis_client.sadd(f"visited:{job_id}", url)
        
        ```
        
        This leverages Redis Sets to instantly check if a URL has been seen, even if you have processed 1 million pages.
        

----------

### **4. Frontend & Real-Time UX**

-   **WebSocket Communication**
    
    -   **Where:** `src/hooks/useCrawler.ts`
        
    -   **How:**
        
        TypeScript
        
        ```
        const ws = new WebSocket(`ws://localhost:8000/api/stream/${jobId}`);
        ws.onmessage = (event) => { setResults(...) };
        
        ```
        
        This hook manages the persistent connection. It listens for the "pings" from the backend and updates the React state essentially frame-by-frame.
        
-   **Data Visualization ("The Waterfall")**
    
    -   **Where:** `src/components/ResultsTable.tsx`
        
    -   **How:** The `results` array in React is prepended (`[newItem, ...oldItems]`). The table renders this array. Because the updates happen in real-time, the user sees rows "slide down" as the crawler discovers them.



---
---

# Full Architecture:

<img src="architecture.png">



---
---


# 𝐓𝐞𝐜𝐡 𝐒𝐭𝐚𝐜𝐤: 🐍 Python, ⚡ FastAPI, 🔁 Celery, 🧠 Redis, ⚛️ React, 🐳 Docker





# How Multiprocessing is implemented (Step-by-Step) (Using Celery and Redis)

Your project achieves multiprocessing by spinning up **multiple independent worker processes**. These processes run at the same time (in parallel), each picking up a different URL from the queue.

**The Flow:**

**User Click**  **API (FastAPI)**  **Redis Queue**  **Celery Manager**  **Worker Processes (CPU Cores)**

1. **Trigger:** User sends a request (URL + Keywords).
2. **Dispatch:** `routes.py` receives the request  pushes a task to **Redis**.
3. **Distribution:** **Celery** (running in the background) sees the new task in Redis.
4. **Forking:** Celery assigns the task to an available **Worker Process** (e.g., Worker 1).
5. **Execution:** Worker 1 starts crawling `cam.ac.uk`.
6. **Discovery:** Worker 1 finds 5 new links.
7. **Parallelism:** Worker 1 pushes those 5 links back to **Redis**.
8. **Scaling:** Celery sees 5 new tasks  assigns them to **Worker 2**, **Worker 3**, **Worker 4**, etc.
9. **Result:** Now, 5 workers are crawling 5 different pages **at the exact same time**.

---

### **2. File Interaction Sequence**

This is the exact path the code takes when a user starts a crawl.

**A. The Trigger (Frontend  API)**
`App.tsx`  `useCrawler.ts`  `routes.py`

> *(User clicks "Start"  React calls POST /crawl  FastAPI receives it)*

**B. The Handoff (API  Queue)**
`routes.py`  `celery_app.py`  **Redis Database**

> *(FastAPI generates Job ID  Puts "Start Task" into Redis Memory)*

**C. The Execution (Queue  Worker)**
**Redis**  `worker.py` (@celery.task)

> *(Celery detects the message  Wakes up a Worker process  Runs `crawl_page_task`)*

**D. The Intelligence (Worker Logic)**
`worker.py`  `fetcher.py`  `extractor.py`  `manager.py`

> *(Worker downloads HTML  Cleans it  Ranks relevance)*

**E. The Delivery (Worker  Frontend)**
`worker.py`  **Redis Pub/Sub**  `websocket.py`  `useCrawler.ts`  `ResultsTable.tsx`

> *(Worker shouts "Found it!"  API hears it  Pushes to React  Table updates)*

---

### **3. Tech Stack Breakdown**

| Component | Technology Used | File Location |
| --- | --- | --- |
| **Frontend UI** | **React (Vite) + TypeScript** | `src/App.tsx` |
| **Styling** | **Tailwind CSS** | `src/index.css` |
| **API Server** | **FastAPI (Python)** | `app/main.py` |
| **Task Queue** | **Celery** | `app/core/celery_app.py` |
| **Message Broker** | **Redis** | `docker-compose.yml` |
| **HTML Fetcher** | **HTTPX (Async)** | `app/crawler/fetcher.py` |
| **JS Rendering** | **Playwright (Headless Chrome)** | `app/crawler/fetcher.py` |
| **HTML Parser** | **Selectolax** (High Speed) | `app/crawler/extractor.py` |
| **PDF Parser** | **PyPDF** | `app/crawler/extractor.py` |
| **Real-Time** | **WebSockets** | `app/api/websocket.py` |
| **Container** | **Docker** | `Dockerfile.api` |






# Top concept: Multiprocessing, Celery, and Redis:

### **1. Multiprocessing (The Execution Model)**

When you run the command `celery -A app worker --concurrency=4`, the operating system performs a **process fork**.

-   **Replication:** The system creates **4 complete, independent copies** of your entire running Python program in RAM.
    
-   **Isolation:** Each of the 4 copies has its own private memory space and its own Python Interpreter instance. They do **not** share variables or memory.
    
-   **True Parallelism:** Because they are separate processes, the Operating System can assign each copy to a different physical CPU core. They execute instructions at the exact same time.
    

### **2. Redis (The Shared State & Broker)**

Since the 4 worker processes have isolated memory, they cannot talk to each other directly. Redis acts as the **centralized external storage** that all 4 copies can access.

-   **The Queue (Broker):** Redis maintains a **FIFO (First-In-First-Out) List** of tasks. It stores the serialized data (JSON) for every URL that needs to be crawled.
    
-   **The State:** Redis stores the `visited` set. All 4 processes check this single external set to see if a URL has been crawled, ensuring synchronization across the distributed system.
    

### **3. Celery (The Orchestrator)**

Celery is the **protocol and management layer** that connects your Python code to Redis.

-   **Serialization:** When `crawl_page.delay()` is called, Celery takes the function arguments, converts them into a specific JSON format (serialization), and pushes that payload into the Redis List.
    
-   **Deserialization:** When a Worker Process is idle, Celery pulls the JSON payload from Redis, converts it back into Python objects (deserialization), and executes the function.
    

### **Difference from Multithreading**

-   **Multithreading:** Creates 4 threads inside **one** process. They share the **same** memory space and the **same** Python Interpreter. In Python, the **Global Interpreter Lock (GIL)** forces them to run one at a time (time-slicing), meaning they cannot utilize multiple CPU cores for calculation-heavy tasks.
    
-   **Multiprocessing (Your Project):** Bypasses the GIL completely because each of the 4 copies has its own lock. This allows 100% CPU utilization across multiple cores.






