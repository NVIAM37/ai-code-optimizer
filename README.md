# Green Code Optimizer - Complete Technical Documentation

> **A project by NVIAM - Network of Vivids Inference And Minds**

**Version:** 1.0  
**Last Updated:** November 2025  
**Project Type:** Full-Stack Web Application for Code Optimization & Green Computing

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Frontend Documentation](#frontend-documentation)
5. [Backend Documentation](#backend-documentation)
6. [Testing Guide](#testing-guide)
7. [Debugging Guide](#debugging-guide)
8. [Commands Reference](#commands-reference)
9. [Performance Metrics](#performance-metrics)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Credits](#credits)

---

## Project Overview

Green Code Optimizer is a full-stack web application designed to help developers write more efficient, sustainable code by analyzing performance metrics and leveraging AI to suggest optimizations.

### Key Features

- Real-time code execution with performance monitoring
- AI-powered code optimization (Google Gemini & Groq)
- Energy consumption and CO2 emission tracking
- Multi-language support (Python, JavaScript, Rust)
- Interactive code editor with Monaco
- Real-time WebSocket log streaming
- Comprehensive analytics dashboard
- Execution history tracking
- OAuth authentication (Google)

### Technology Stack

**Frontend:**

- React 18 + Vite
- TailwindCSS + Framer Motion
- Monaco Editor
- Recharts (Data Visualization)
- Vitest + React Testing Library

**Backend:**

- Node.js + Express
- Custom File-Based JSON Database
- Python Supervisor (Code Execution)
- JWT Authentication + Passport
- WebSocket Server
- AI Integration (Gemini & Groq)

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** (v9 or higher)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/YOUR_USERNAME/ai-code-optimizer.git
    cd ai-code-optimizer
    ```

2.  **Install Frontend Dependencies:**

    ```bash
    cd 1_frontend
    npm install
    cd ..
    ```

3.  **Install Backend Dependencies:**

    ```bash
    cd 2_backend
    npm install
    ```

4.  **Install Python Dependencies:**

    ```bash
    cd 2_backend
    pip install -r requirements.txt
    cd ..
    ```

5.  **Environment Setup:**
    - Copy `.env.example` to `2_backend/.env` (or create it manually).
    - Fill in the required API keys (Gemini API Key is essential).
    ```bash
    cp .env.example 2_backend/.env
    ```

### Running the Application

You can start the entire system (Frontend + Backend) using the provided start scripts in the root directory.

**Windows (PowerShell):**

```powershell
./start.ps1
```

**Linux / macOS:**

```bash
chmod +x start.sh
./start.sh
```

**Manual Start:**

- **Backend:**

  ```bash
  cd 2_backend
  npm run dev
  # Runs on http://localhost:3000
  ```

- **Frontend:**
  ```bash
  cd 1_frontend
  npm run dev
  # Runs on http://localhost:5173
  ```

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Dashboard │  │ Optimizer  │  │  Analytics │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │                │                │                  │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          │    HTTP/REST   │   WebSocket    │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   User   │  │ Process  │  │   Chat   │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌────────────────────────────────────────────────┐         │
│  │        File-Based JSON Database                │         │
│  │  (users.json, sessions.json, history.json)     │         │
│  └────────────────────────────────────────────────┘         │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │   Python     │        │  AI Engines  │
    │  Supervisor  │        │   (Gemini/   │
    │ (Execution)  │        │    Groq)     │
    └──────────────┘        └──────────────┘
            │
    ┌───────┴────────┐
    ▼                ▼
┌─────────┐    ┌─────────┐
│CodeCarbon│    │ Psutil  │
│(Energy) │    │ (CPU/RAM)│
└─────────┘    └─────────┘
```

### Data Flow

1. User writes code in Monaco Editor
2. Frontend sends code via HTTP POST to `/process`
3. Backend validates API keys and creates temp file
4. Backend spawns Python supervisor process
5. Supervisor executes code and measures metrics
6. Metrics streamed to frontend via WebSocket
7. Backend calls AI engine for optimization
8. Optimized code returned and displayed
9. Session saved to JSON database
10. History updated in real-time

---

## Frontend Documentation

### Project Structure

```
1_frontend/
├── src/
│   ├── assets/              # Images, icons
│   ├── components/          # Reusable UI components
│   │   ├── Layout/
│   │   │   ├── AppLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── CodeEditor.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── SettingsPanel.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx  # Global auth state
│   ├── pages/
│   │   ├── Analytics.jsx
│   │   ├── Dashboard.jsx
│   │   ├── History.jsx
│   │   ├── Login.jsx
│   │   ├── Optimizer.jsx
│   │   ├── Profile.jsx
│   │   └── Signup.jsx
│   ├── tests/               # Vitest test files
│   │   ├── Analytics.test.jsx
│   │   ├── AuthContext.test.jsx
│   │   ├── ChatWindow.test.jsx
│   │   ├── Dashboard.test.jsx
│   │   ├── History.test.jsx
│   │   ├── Login.test.jsx
│   │   ├── Profile.test.jsx
│   │   └── Signup.test.jsx
│   ├── api.js               # Axios instance
│   ├── App.jsx              # Router setup
│   └── main.jsx             # Entry point
├── public/
├── dist/                    # Build output
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Core Components

#### Optimizer.jsx - Main Workspace

The heart of the application where users write and optimize code.

**State Management:**

```
const [code, setCode] = useState('');
const [optimizedCode, setOptimizedCode] = useState('');
const [language, setLanguage] = useState('python');
const [metrics, setMetrics] = useState(null);
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(false);
```

**WebSocket Connection:**

```
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3000');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'metrics-detail') setMetrics(data.metrics);
    if (data.type === 'optimized-output') appendLog(data.output);
  };

  return () => ws.close();
}, []);
```

**Features:**

- Dual editor layout (original vs optimized)
- Real-time terminal output
- Advanced mode with granular controls
- Metrics comparison panel
- Language selector (Python, JavaScript, Rust)

#### SettingsPanel.jsx - Configuration

Modal for AI provider configuration.

**API Key Management:**

```
const handleSaveApiKey = async () => {
  await api.put('/user/api-keys', {
    provider: selectedProvider,
    apiKey: apiKey
  });
  toast.success('API Key saved');
};
```

**Model Fetching:**

```
const fetchModels = async (provider) => {
  const response = await api.get(`/api/models/${provider}`);
  setAvailableModels(response.data.models);
};
```

#### Dashboard.jsx - Analytics Overview

Displays user statistics and recent activity.

**Data Fetching:**

```
useEffect(() => {
  const fetchStats = async () => {
    const res = await api.get('/user/statistics');
    setStats(res.data.statistics);
  };
  fetchStats();
}, []);
```

**Metrics Displayed:**

- Total optimizations count
- Total energy saved (Joules)
- Total time saved (ms)
- Average performance gain (%)
- Recent optimization history
- Language distribution chart

#### AuthContext.jsx - Authentication State

Global authentication provider.

**Context Structure:**

```
const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false
});
```

**Token Management:**

```
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;

  localStorage.setItem('token', token);
  setUser(user);
  setToken(token);
};
```

### API Integration

#### Axios Configuration (api.js)

```
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### WebSocket Communication

**Connection Setup:**

```
const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('✅ Connected to WebSocket');
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

socket.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

socket.onclose = () => {
  console.log('🔌 WebSocket disconnected');
};
```

**Message Types:**

- `original-output`: Logs from original code
- `optimized-output`: Logs from optimized code
- `metrics-detail`: Performance metrics
- `error`: Error messages

### Routing Configuration

```
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="optimizer" element={<Optimizer />} />
            <Route path="history" element={<History />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Styling & Theme

**TailwindCSS Configuration:**

```
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#16161c',
        'dark-panel': '#1e1e1e',
        'accent-green': '#00ff9d',
        'accent-blue': '#0088FE'
      }
    }
  }
}
```

**Custom Scrollbar:**

```
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #00ff9d;
  border-radius: 4px;
}
```

---

## Backend Documentation

### Project Structure

```
2_backend/
├── src/
│   ├── ai_engine/
│   │   ├── gemini.js       # Google Gemini integration
│   │   ├── groq.js         # Groq Cloud integration
│   │   └── prompts.js      # AI prompts
│   ├── config/
│   │   ├── database.js     # DB initialization
│   │   ├── passport.js     # Auth strategies
│   │   └── json_session_store.js
│   ├── executors/
│   │   └── supervisor.py   # Code execution engine
│   ├── middleware/
│   │   └── auth.js         # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Chat.js
│   │   └── ExecutionHistory.js
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   └── user.js         # User data routes
│   ├── utils/
│   │   ├── JsonModel.js    # Custom DB class
│   │   └── safety.js       # Code safety checks
│   └── server.js           # Main entry point
├── data/                   # JSON database files
│   ├── users.json
│   ├── sessions.json
│   ├── chats.json
│   └── execution_history.json
├── temp_execution/         # Temporary code files
├── tests/
│   ├── auth.test.js
│   ├── user.test.js
│   └── chat.test.js
└── package.json
```

### File-Based Database (JsonModel)

#### Architecture

Custom lightweight database system using JSON files with atomic writes.

**JsonModel Class:**

```
class JsonModel {
  constructor(collectionName, schema) {
    this.collectionName = collectionName;
    this.schema = schema;
    this.filePath = path.join('data', `${collectionName}.json`);
  }

  async find(query = {}) {
    const data = await this.readFile();
    return data.filter(doc => this.matchesQuery(doc, query));
  }

  async findOne(query) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async create(doc) {
    const data = await this.readFile();
    const newDoc = {
      _id: uuidv4(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.push(newDoc);
    await this.writeFile(data);
    return newDoc;
  }

  async updateOne(query, update) {
    const data = await this.readFile();
    const index = data.findIndex(doc => this.matchesQuery(doc, query));

    if (index !== -1) {
      if (update.$set) {
        data[index] = { ...data[index], ...update.$set };
      }
      await this.writeFile(data);
      return data[index];
    }
    return null;
  }

  async deleteOne(query) {
    const data = await this.readFile();
    const newData = data.filter(doc => !this.matchesQuery(doc, query));
    await this.writeFile(newData);
  }
}
```

**Atomic Write Operation:**

```
async writeFile(data) {
  const tmpPath = `${this.filePath}.tmp`;

  // Write to temp file
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2));

  // Atomic rename
  await fs.rename(tmpPath, this.filePath);
}
```

### User Model

```
// models/User.js
import JsonModel from '../utils/JsonModel.js';
import bcrypt from 'bcrypt';

const userSchema = {
  email: String,
  password: String,
  name: String,
  apiKeys: Object,
  settings: Object
};

class User extends JsonModel {
  constructor() {
    super('users', userSchema);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async createUser(userData) {
    const hashedPassword = await this.hashPassword(userData.password);
    return this.create({
      ...userData,
      password: hashedPassword
    });
  }
}

export default new User();
```

### Python Supervisor (Code Execution Engine)

The core execution engine that runs user code safely and measures performance.

**supervisor.py:**

```
import sys
import json
import time
import psutil
import subprocess
from pathlib import Path

def execute_code(file_path, language):
    process = psutil.Process()

    # Start metrics collection
    start_time = time.time()
    start_cpu = process.cpu_percent()
    start_memory = process.memory_info().rss

    # Execute code based on language
    if language == 'python':
        result = subprocess.run(
            ['python', file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
    elif language == 'javascript':
        result = subprocess.run(
            ['node', file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
    elif language == 'rust':
        # Compile and run
        exe_path = file_path.replace('.rs', '')
        subprocess.run(['rustc', file_path, '-o', exe_path])
        result = subprocess.run([exe_path], capture_output=True, text=True)

    # Collect metrics
    end_time = time.time()
    execution_time = (end_time - start_time) * 1000  # ms

    metrics = {
        'execution_time_ms': execution_time,
        'cpu_percent': process.cpu_percent(),
        'memory_mb': process.memory_info().rss / 1024 / 1024,
        'exit_code': result.returncode
    }

    return {
        'stdout': result.stdout,
        'stderr': result.stderr,
        'metrics': metrics
    }

if __name__ == '__main__':
    file_path = sys.argv[1]
    language = sys.argv[2]

    result = execute_code(file_path, language)
    print('---METRICS_START---')
    print(json.dumps(result))
    print('---METRICS_END---')
```

### AI Engine Integration

#### Gemini Integration

```
// ai_engine/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function optimizeWithGemini(code, language, apiKey, options = {}) {
  // Validate API key
  if (!apiKey.startsWith('AIza')) {
    throw new Error('Invalid Gemini API key');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: options.model || 'gemini-2.0-flash-exp'
  });

  const prompt = `
    Optimize the following ${language} code for ${options.optimizationType || 'speed'}.
    Apply ${options.paradigm || 'functional'} programming paradigm.

    Code:
    ${code}

    Return only the optimized code without explanations.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function listGeminiModels(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = await genAI.listModels();
  return models.map(m => m.name);
}
```

#### Groq Integration

```
// ai_engine/groq.js
import Groq from 'groq-sdk';

export async function optimizeWithGroq(code, language, apiKey, options = {}) {
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `Optimize this ${language} code: ${code}`
      }
    ],
    model: options.model || 'llama-3.3-70b-versatile'
  });

  return completion.choices[0].message.content;
}
```

### API Routes

#### Authentication Routes

```
// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.createUser({ email, password, name });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email, name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await User.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### User Routes

```
// routes/user.js
router.get('/profile', authenticateJWT, async (req, res) => {
  const user = await User.findOne({ _id: req.user.id });
  res.json({ user });
});

router.put('/api-keys', authenticateJWT, async (req, res) => {
  const { provider, apiKey } = req.body;

  await User.updateOne(
    { _id: req.user.id },
    { $set: { [`apiKeys.${provider}`]: apiKey } }
  );

  res.json({ success: true });
});

router.get('/statistics', authenticateJWT, async (req, res) => {
  const history = await ExecutionHistory.find({ userId: req.user.id });

  const stats = {
    totalOptimizations: history.length,
    totalEnergySaved: history.reduce((sum, h) => sum + h.energySaved, 0),
    avgPerformanceGain: history.reduce((sum, h) => sum + h.performanceGain, 0) / history.length
  };

  res.json({ statistics: stats });
});
```

### Process Route (Core Optimization)

```
// server.js
app.post('/process', authenticateJWT, async (req, res) => {
  const { code, language, provider, action, ...options } = req.body;

  try {
    // Get API key
    const user = await User.findOne({ _id: req.user.id });
    const apiKey = user.apiKeys[provider];

    // Write code to temp file
    const tempFile = `temp_execution/code_${Date.now()}.${getExtension(language)}`;
    await fs.writeFile(tempFile, code);

    // Execute original code
    const original = await executeCode(tempFile, language);

    let optimized = null;
    if (action === 'optimize' || action === 'full') {
      // Call AI for optimization
      const optimizedCode = provider === 'gemini'
        ? await optimizeWithGemini(code, language, apiKey, options)
        : await optimizeWithGroq(code, language, apiKey, options);

      // Execute optimized code
      const optimizedFile = `temp_execution/optimized_${Date.now()}.${getExtension(language)}`;
      await fs.writeFile(optimizedFile, optimizedCode);
      optimized = await executeCode(optimizedFile, language);

      // Calculate performance gain
      const performanceGain = calculateGain(original.metrics, optimized.metrics);

      // Save to history
      await ExecutionHistory.create({
        userId: req.user.id,
        originalCode: code,
        optimizedCode,
        metrics: { original: original.metrics, optimized: optimized.metrics },
        performanceGain
      });
    }

    res.json({
      original: original.metrics,
      optimized: optimized?.metrics,
      optimizedCode: optimized?.code
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### WebSocket Server

```
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    // Handle incoming messages
  });

  // Broadcast function
  ws.broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
});

// Stream logs during execution
function streamLogs(type, output) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ type, output }));
  });
}
```

---

## Testing Guide

### Frontend Testing

#### Test Suite Overview

Total: **52 Frontend Tests**

**Test Files:**

- Login.test.jsx (7 tests)
- Signup.test.jsx (8 tests)
- Dashboard.test.jsx (5 tests)
- Analytics.test.jsx (3 tests)
- ChatWindow.test.jsx (2 tests)
- History.test.jsx (11 tests)
- Profile.test.jsx (10 tests)
- AuthContext.test.jsx (12 tests)

#### Running Frontend Tests

```
cd 1_frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test src/tests/Login.test.jsx

# Generate coverage report
npm test -- --coverage

# Run tests with UI
npm test -- --ui
```

#### Example Test

```
// tests/Dashboard.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');

    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { user: { id: '1', email: 'test@example.com' } }
        });
      }
      if (url === '/user/statistics') {
        return Promise.resolve({
          data: {
            statistics: {
              totalOptimizations: 25,
              totalEnergySaved: 2500000,
              avgPerformanceGain: 38.5
            }
          }
        });
      }
    });
  });

  it('displays dashboard statistics', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('fetches data on mount', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/user/statistics');
    });
  });
});
```

### Backend Testing

#### Test Suite Overview

Total: **54 Backend Tests**

**Test Files:**

- auth.test.js (15 tests)
- user.test.js (13 tests)
- chat.test.js (8 tests)
- execution_history.test.js (10 tests)
- json_db.test.js (8 tests)

#### Running Backend Tests

```
cd 2_backend

# Run all tests
npm test

# Run specific test file
npm test tests/auth.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

#### Example Backend Test

```
// tests/auth.test.js
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/server.js';

describe('Authentication Routes', () => {
  describe('POST /auth/signup', () => {
    it('should create new user', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.user.email).to.equal('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test'
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(401);
    });
  });
});
```

### Test Coverage Goals

**Current Coverage:**

- Frontend: ~85% statement coverage
- Backend: ~88% statement coverage

**Uncovered Areas:**

- Error boundary fallbacks
- WebSocket edge cases
- AI API failure scenarios
- File system errors

---

## Debugging Guide

### Frontend Debugging

#### Browser Console

The frontend includes comprehensive console logging:

```
[AuthContext] Login attempt for: user@example.com
[AuthContext] Token validation: { isValid: true, userId: '123' }
[API] POST /process { code: '...', language: 'python' }
[WebSocket] Connected to real-time logs
[WebSocket] Received: { type: 'metrics-detail', data: {...} }
```

#### React DevTools

Install React DevTools browser extension to:

- Inspect component hierarchy
- View component props and state
- Track re-renders
- Debug context values

#### Network Tab

Monitor API requests:

- Check request/response headers
- Verify JWT token is sent
- Check response status codes
- View request/response bodies

**Common Status Codes:**

- 200: Success
- 400: Bad request (missing data)
- 401: Unauthorized (invalid token)
- 429: Rate limit exceeded
- 500: Server error

### Backend Debugging

#### Console Logging

The backend provides detailed logs:

```
[SYSTEM] Server started on port 3000
[TOOLCHAIN] python: Python 3.13.9
[TOOLCHAIN] node: v20.10.0
[TOOLCHAIN] rustc: rustc 1.75.0
[AUTH] Login attempt: user@example.com
[AUTH] JWT generated for user: 123
[API KEY] Provider: gemini, Key present: YES
[EXEC] Starting code execution: temp_12345.py
[EXEC] Execution completed in 234ms
[AI] Optimizing with gemini model: gemini-2.0-flash-exp
[AI] Optimization completed
[METRICS] Performance gain: 42.3%
```

#### Debug Mode

Enable debug mode:

```
export DEBUG=*
npm run dev
```

This will show:

- All SQL-like queries to JSON DB
- File I/O operations
- WebSocket messages
- HTTP request/response details

#### Logging Best Practices

```
// Add timestamps
console.log(`[${new Date().toISOString()}] User logged in`);

// Use prefixes for categorization
console.log('[DB] Finding user:', email);
console.log('[API] Calling Gemini API');
console.log('[EXEC] Running Python code');

// Log errors with context
console.error('[ERROR]', {
  timestamp: new Date(),
  endpoint: '/process',
  error: error.message,
  stack: error.stack,
  userId: req.user?.id
});
```

### Common Issues & Solutions

#### "WebSocket disconnected"

**Cause:** Backend server not running  
**Solution:**

```
cd 2_backend
npm run dev
```

#### "Optimization Failed"

**Cause:** Invalid or missing API key  
**Solution:**

1. Go to Settings panel
2. Select provider (Gemini/Groq)
3. Enter valid API key
4. Gemini keys start with "AIza"

#### "Toolchain not found"

**Cause:** Required language runtime missing  
**Solution:**

```
# Install Python
python --version  # Should show Python 3.x

# Install Node.js
node --version  # Should show v18 or higher

# Install Rust (optional)
rustc --version
```

#### "Rate Limit Exceeded"

**Cause:** Too many API requests  
**Solution:**

- Wait 15-30 minutes
- Switch to different provider
- Use different API key

#### Database Errors

**Cause:** Corrupted JSON file  
**Solution:**

```
cd 2_backend
rm data/*.json
npm run dev  # Will recreate empty files
```

---

## Commands Reference

### Frontend Commands

```
cd 1_frontend

# Development
npm ci                    # Install dependencies (clean install)
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run all tests
npm test -- --watch      # Run tests in watch mode
npm test -- --coverage   # Generate coverage report
npm test -- --ui         # Run tests with UI

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier
```

### Backend Commands

```
cd 2_backend

# Development
npm ci                   # Install dependencies
npm run dev             # Start with nodemon (auto-restart)
npm start               # Start production server

# Testing
npm test                # Run all tests
npm test tests/auth.test.js  # Run specific test
npm test -- --coverage  # Generate coverage report

# Database
node src/test_json_db.js       # Test database operations
node src/test_user_hydration.js # Test user model
```

### System Commands

```
# Start both servers (Windows)
.\start.ps1

# Start both servers (Linux/Mac)
./start.sh

# Health check
node health_check.mjs
```

### Python Supervisor

```
# Test code execution
python src/executors/supervisor.py temp_code.py python

# Install Python dependencies
pip install psutil codecarbon pynvml
```

### Git Commands

```
# Save progress
git add .
git commit -m "Description of changes"
git push origin main

# Create feature branch
git checkout -b feature/new-feature
git push origin feature/new-feature

# Pull latest changes
git pull origin main
```

### Database Management

```
# Backup data
cp -r 2_backend/data 2_backend/data_backup

# Reset database
rm 2_backend/data/*.json

# View database
cat 2_backend/data/users.json | jq
```

---

## Performance Metrics

### Metrics Calculation

#### Execution Time

**Source:** Python `time.time()`  
**Unit:** Milliseconds (ms)  
**Calculation:**

```
start = time.time()
# Execute code
end = time.time()
execution_time_ms = (end - start) * 1000
```

#### Energy Consumption

**Source:** CodeCarbon library  
**Unit:** Joules (J)  
**Calculation:**

```
from codecarbon import EmissionsTracker

tracker = EmissionsTracker()
tracker.start()
# Execute code
emissions = tracker.stop()
energy_joules = emissions.energy_consumed * 3600000  # kWh to J
```

**Fallback Estimation:**

```
energy = (execution_time_seconds * cpu_percent / 100) * tdp_watts
```

#### CO2 Emissions

**Source:** Derived from energy  
**Unit:** Kilograms (kg)  
**Calculation:**

```
co2_kg = (energy_kwh * carbon_intensity_kg_per_kwh)
```

Default carbon intensity: 0.475 kg/kWh (global average)

#### Memory Usage

**Source:** `psutil.Process().memory_info()`  
**Unit:** Megabytes (MB)  
**Calculation:**

```
import psutil

process = psutil.Process()
memory_bytes = process.memory_info().rss  # Resident Set Size
memory_mb = memory_bytes / 1024 / 1024
```

#### CPU Usage

**Source:** `psutil.Process().cpu_percent()`  
**Unit:** Percentage (%)  
**Calculation:**

```
cpu_percent = process.cpu_percent(interval=1.0)
```

#### Performance Gain

**Formula:**

```
performance_gain = ((original_time - optimized_time) / original_time) * 100
```

**Example:**

```
Original: 1000ms
Optimized: 600ms
Gain: ((1000 - 600) / 1000) * 100 = 40%
```

### Metrics Display

**Terminal Output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ORIGINAL CODE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Time:   1234 ms
 Energy: 0.345 J
 CO2:    0.000164 kg
 Memory: 45.2 MB
 CPU:    78.3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 OPTIMIZED CODE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Time:   687 ms        ↓ 44.3%
 Energy: 0.192 J       ↓ 44.3%
 CO2:    0.000091 kg   ↓ 44.5%
 Memory: 38.7 MB       ↓ 14.4%
 CPU:    65.1%         ↓ 16.9%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PERFORMANCE GAIN: 44.3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Deployment

### Production Build

#### Frontend

```
cd 1_frontend

# Build for production
npm run build

# Output in dist/ directory
# Copy to web server (nginx, Apache, etc.)
```

#### Nginx Configuration

```
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/green-optimizer/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Backend

```
cd 2_backend

# Install dependencies
npm ci --production

# Start with PM2
pm2 start src/server.js --name green-optimizer

# View logs
pm2 logs green-optimizer

# Monitor
pm2 monit
```

### Environment Variables

**Frontend (.env):**

```
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

**Backend (.env):**

```
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
FRONTEND_URL=https://yourdomain.com
```

### Docker Deployment

**Dockerfile (Frontend):**

```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile (Backend):**

```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**docker-compose.yml:**

```
version: '3.8'

services:
  frontend:
    build: ./1_frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./2_backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./2_backend/data:/app/data
```

---

## Troubleshooting

### Frontend Issues

**Issue: White screen after login**  
Solution: Check browser console for errors, verify API URL in .env

**Issue: WebSocket not connecting**  
Solution: Ensure backend is running, check CORS settings

**Issue: Charts not rendering**  
Solution: Verify data format, check Recharts console errors

### Backend Issues

**Issue: "Module not found"**  
Solution: Run `npm ci` to install dependencies

**Issue: "Port 3000 already in use"**  
Solution:

```
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Issue: Database corruption**  
Solution:

```
cd 2_backend
rm data/*.json
npm run dev  # Recreates files
```

### Performance Issues

**Issue: Slow optimization**  
Solution:

- Check AI API response time
- Use faster model (Groq)
- Reduce code complexity

**Issue: High memory usage**  
Solution:

- Clear temp_execution folder
- Restart backend server
- Check for memory leaks in code

---

## System Requirements

### Development

**Operating System:**

- Windows 10/11
- macOS 12+
- Linux (Ubuntu 20.04+)

**Software:**

- Node.js 18+ (20 recommended)
- Python 3.9+
- Git
- Modern browser (Chrome, Firefox, Edge)

**Optional:**

- Rust (for Rust code optimization)
- Docker (for containerization)

### Production

**Server:**

- 2+ CPU cores
- 4GB+ RAM
- 10GB+ storage
- Ubuntu 20.04+ or similar

**Network:**

- Static IP or domain
- SSL certificate (Let's Encrypt)
- Open ports: 80, 443, 3000

---

## Security Considerations

### API Keys

- Never commit API keys to Git
- Store in environment variables
- Use .env files (add to .gitignore)
- Rotate keys regularly

### Authentication

- JWT tokens expire after 7 days
- Passwords hashed with bcrypt (10 rounds)
- HTTPS required in production
- CORS configured for frontend domain

### Code Execution

- Python supervisor runs in isolated process
- 30-second timeout for code execution
- File system access restricted
- Dangerous functions blocked (eval, exec)

---

## Contributing

### Code Style

**JavaScript/JSX:**

- Use ESLint configuration
- 2-space indentation
- Semicolons required
- Single quotes for strings

**Python:**

- Follow PEP 8
- 4-space indentation
- Type hints preferred

### Git Workflow

1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit pull request

### Testing Requirements

- All new features must have tests
- Maintain 80%+ code coverage
- Tests must pass before merge

---

## License

MIT License - See LICENSE file for details

---

## Support & Contact

**Documentation:** This file  
**Issues:** GitHub Issues  
**Discussions:** GitHub Discussions

---

## Credits

**Core system and final build created collaboratively by Lokesh, Harsh, and Sineha.**

---

**End of Documentation**

_Last updated: November 2025_
_Version: 1.0_
