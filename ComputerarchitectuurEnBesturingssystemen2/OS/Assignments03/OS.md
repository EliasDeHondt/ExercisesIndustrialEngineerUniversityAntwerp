# Oefening 3: Multitasking - FreeRTOS Tasks

## Antwoorden Portfolio

### 3a: Timing probleem _delay_ms() met terminal task

**Waarom de timing van `_delay_ms()` niet meer klopt:**

Wanneer de terminal task actief is, verbruikt deze task bijna 100% van de processortijd vanwege de `scanf()`/`getchar()` aanroepen. Deze I/O-functies zijn **blocking calls** die de terminal task in een polling-achtige state houden.

De `_delay_ms()` functie werkt door een deterministische delay loop uit te voeren:
- Internally voert `_delay_ms()` een lus uit waarvan het aantal processorcycli gekend is
- Deze berekening gaat ervan uit dat de task **continue processortijd** krijgt
- Wanneer de terminal task actief is, wordt de running light task regelmatig onderbroken door context switches
- Dit betekent dat de looplicht task niet meer uninterrupted 500ms kan draaien

**Bewijs met vTaskGetRunTimeStats():**

Via de `stats` commando in de terminal kunnen we zien:
- Terminal task: ~100% CPU time (vanwege polling in `scanf()`)
- Running light task: zeer weinig CPU time (wordt frequent onderbroken)

De processor wisselt voortdurend tussen de tasks, waardoor `_delay_ms()` zijn timing verliest.

---

### 3b: Effect verhoging prioriteit looplicht task

**Wat gebeurt er wanneer we de prioriteit van de looplicht task met '1' verhogen:**

Bij het verhogen van de running light prioriteit naar `tskIDLE_PRIORITY + 2` (hoger dan terminal op `tskIDLE_PRIORITY + 1`):

- De running light task krijgt **voorrang** wanneer deze ready is
- De terminal task wordt nu vaker onderbroken
- Het looplicht gaat sneller lopen/werkt beter
- De terminal responsiveness daalt aanzienlijk

**Verklaring:**

Met preemptive scheduling wint de higher-priority task. Nu wordt:
- Running light (priority 2): Krijgt meer CPU tijd, minder context switches
- Terminal (priority 1): Wordt regelmatig onderbroken door running light

Dit toont aan dat prioriteit in FreeRTOS direct de scheduulbeslissingen beïnvloedt.

---

### 3c: Verschil `_delay_ms()` vs `vTaskDelayUntil()`

**Verschillen:**

| Aspect | `_delay_ms()` | `vTaskDelayUntil()` |
|--------|---------------|-------------------|
| **Type** | Busy-wait delay | Task yield (cooperative) |
| **CPU gebruik** | Hoog (polling loop) | Laag (task gesuspendeerd) |
| **Precisie** | Afhankelijk van CPU beschikbaarheid | Hoog (gebaseerd op OS tick) |
| **Effect op andere tasks** | Blokkeert andere tasks op lage prioriteit | Staat andere tasks toe uit te voeren |
| **Context switches** | Geen (CPU in delay loop) | Ja (task yielded naar scheduler) |

Met `vTaskDelayUntil()`:
```c
TickType_t xLastWakeTime = xTaskGetTickCount();
while (1) {
    // Do work
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(500));
}
```

Dit is veel beter voor multitasking omdat het CPU-tijd aan andere tasks geeft.

---

### 3d: Verschil `vTaskDelayUntil()` vs `vTaskDelay()`

**Verschillen:**

| Aspect | `vTaskDelayUntil()` | `vTaskDelay()` |
|--------|-------------------|---------------|
| **Timing basis** | Absolute time (previous wake time) | Relative time (current moment) |
| **Jitter** | Zeer laag/geen | Kan accumulative jitter hebben |
| **Periodic tasks** | Geoptimaliseerd voor | Minder geschikt voor |
| **Gebruik** | `vTaskDelayUntil(&lastWakeTime, ticks)` | `vTaskDelay(ticks)` |

**Voorbeeld:**
- `vTaskDelayUntil()`: "Volgende activatie op exact T+500ms van start"
- `vTaskDelay()`: "Wacht 500ms van NU (wanneer task wakker wordt)"

Als een task 10ms werk doet en dan `vTaskDelay(500)` aanroept, wacht het 500ms VANAF het waker worden. De cyclustijd varieert dus.

Met `vTaskDelayUntil()` blijft de cyclustijd consistent op 510ms (10ms werk + 500ms delay).

---

### 3e: Invloed `configUSE_PREEMPTION = 0` (Cooperative Scheduling)

**Wat verandert er:**

Bij `configUSE_PREEMPTION = 0` schakelen we over van **preemptive** naar **cooperative** scheduling:

**Gedrag:**
- Tasks geven **nooit automatisch** CPU-tijd af
- Context switch gebeurt ALLEEN wanneer:
  - Een task expliciet `vTaskDelay()`, `vTaskDelayUntil()`, of soortgelijke aanroept
  - Een hogere prioriteit task wakker wordt en de huidige task geen block call doet
  
**Observaties:**
- Geen meer willekeurige context switches
- Running light timing kan meer stabiel worden
- Terminal responsiveness daalt drastisch (terminal task houdt CPU vast in scanning loop)
- Geen concurrency voor I/O operaties
- Deterministische volgorde van task executie

**Voordeel:** Minder CPU overhead door context switching
**Nadeel:** Slecht voor I/O-bound tasks (terminal polling)

Na deze test: `configUSE_PREEMPTION` teruggezet op '1'.

---

## Test resultaten

- [ ] Looplicht task werkt met `_delay_ms()` zonder terminal
- [ ] Terminal task geaccepteerd commando's (links/rechts)
- [ ] CPU statistieken zichtbaar via `stats` commando
- [ ] Timing problemen waargenomen met terminal actief
- [ ] Prioriteit aanpassingen effect zichtbaar
- [ ] `vTaskDelayUntil()` implementatie test geslaagd
- [ ] Cooperative scheduling test geslaagd
