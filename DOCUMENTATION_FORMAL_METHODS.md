# Formal Methods Integration

## Overview
This project integrates **Formal Methods (FM)** to ensure the reliability, correctness, and safety of the Green Code Optimizer. We employ **Design by Contract (DbC)** for runtime verification and **Linear Temporal Logic (LTL)** for specifying system properties.

## 1. Design by Contract (DbC)

We apply DbC principles to the `supervisor.py` execution engine to strictly enforce the validity of collected metrics.

### Contracts

#### Pre-conditions
- **Input Validity**: The command to run must be a non-empty string.
- **Environment**: The execution environment (Python/Node/Rust) must be available and executable.

#### Post-conditions
- **Metric Non-Negativity**: All measured physical metrics (Time, Energy, RAM, CPU) must be non-negative.
  - `assert metrics['duration'] >= 0`
  - `assert metrics['energy_joules'] >= 0`
- **Optimization Validity** (Orchestrator Level): The optimized code must not degrade performance by more than a defined threshold (3%).
  - `assert optimized_time <= original_time * 1.03`

### Implementation
Runtime assertions are injected into the execution flow. If a post-condition is violated, the system flags a **DbC Failure**, preventing invalid data from being presented to the user as a success.

## 2. Linear Temporal Logic (LTL)

We use LTL to formally specify the temporal properties of the system, ensuring safety and liveness.

### Safety Properties (Bad things never happen)
- **$\square (Execution \rightarrow \neg SystemCrash)$**: Globally, execution implies no system crash.
- **$\square (Optimize \rightarrow \neg DataLeak)$**: Globally, optimization processes must not leak user code to unauthorized logs.
- **$\square (MetricCollection \rightarrow \neg NegativeValues)$**: Globally, metric collection never results in negative values.

### Liveness Properties (Good things eventually happen)
- **$\square (Request \rightarrow \diamond Response)$**: Globally, every user request is eventually followed by a response (success or error).
- **$\square (OptimizationStart \rightarrow \diamond (Success \lor Failure))$**: Globally, once optimization starts, it eventually terminates with a result.

## 3. Verification Strategy

- **Runtime Verification**: The `supervisor.py` script acts as a runtime monitor, checking assertions during every execution.
- **Static Analysis**: The orchestrator (`server.js`) performs static checks on the optimization results (Fallback Mechanism) before accepting them.
