![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍OS🤍💙

## Assignments03

### Question 3a: Timing problem `_delay_ms()` with terminal task

`_delay_ms()` works by executing a busy-wait loop — the CPU counts a precise number
of cycles to produce the desired delay. This only works correctly if the CPU runs
uninterrupted for the full duration of that loop.

Once the terminal task is active, the FreeRTOS preemptive scheduler context-switches
between tasks. The `scanf()` call in the terminal task internally calls `stdio_getchar()`
in the USART driver in a tight polling loop, consuming nearly 100% CPU time. When the
scheduler preempts the running light task mid-delay, the busy-wait loop is paused.
The elapsed wall-clock time becomes longer than intended, so the running light appears
slower or inconsistent.

`vTaskGetRunTimeStats()` confirms this: the terminal task is allocated almost all
processor time, leaving only a small slice for the running light task.

---

### Question 3b: Effect of raising the running light task priority by 1

When the running light task has a higher priority than the terminal task, the FreeRTOS
preemptive scheduler always picks it first. The running light task runs uninterrupted
whenever it is ready. The terminal task only gets CPU time when the running light task
is inside its `_delay_ms()` busy-wait — but since `_delay_ms()` never yields, the
terminal task never runs at all. As a result the terminal becomes completely
unresponsive: characters typed are never processed and the direction cannot be changed.

---

### Question 3c: Difference between `_delay_ms()` and `vTaskDelayUntil()`

| | `_delay_ms()` | `vTaskDelayUntil()` |
|---|---|---|
| Mechanism | Busy-wait (CPU cycles counted in a loop) | Blocks the task; CPU is yielded to the scheduler |
| CPU usage during delay | 100% (loop runs continuously) | 0% (task is in Blocked state) |
| Affected by preemption | Yes — interruptions make the delay longer | No — the wake-up moment is absolute |
| Timing accuracy | Degrades with context switches | Consistent regardless of other tasks |

`vTaskDelayUntil()` solves the timing problem because the task releases the CPU while
waiting. The scheduler can run other tasks, and the running light task wakes up exactly
at the intended absolute tick count.

---

### Question 3d: Difference between `vTaskDelayUntil()` and `vTaskDelay()`

| | `vTaskDelay()` | `vTaskDelayUntil()` |
|---|---|---|
| Reference point | Relative — delay starts from the moment the call is made | Absolute — delay ends at a fixed tick count regardless of when the call is made |
| Drift over time | Yes — execution time of the task body accumulates as extra delay | No — the period is constant, drift-free |
| Typical use | Simple one-shot delays | Periodic tasks that must run at a fixed interval |

Example: if the task body takes 5 ms and you call `vTaskDelay(100)`, the effective
period is 105 ms. With `vTaskDelayUntil(&lastWake, 100)` the period stays exactly
100 ms regardless of how long the task body took.

---

### Question 3e: Effect of `configUSE_PREEMPTION = 0` (Cooperative Scheduling)

With preemptive scheduling (`= 1`) the scheduler can interrupt a running task at any
tick interrupt and switch to a higher- or equal-priority task automatically.

With cooperative scheduling (`= 0`) a task keeps the CPU until it voluntarily yields by
calling a FreeRTOS API function that causes a context switch (e.g. `vTaskDelay()`,
`vTaskDelayUntil()`, `taskYIELD()`).

Observed effect: the running light task runs correctly as long as it calls
`vTaskDelayUntil()` (which yields). However, any task that never yields — such as the
terminal task polling in `scanf()` — will monopolise the CPU indefinitely and starve all
other tasks. Cooperative scheduling places full responsibility for fair CPU sharing on
the programmer; a single missing yield call can hang the entire system.