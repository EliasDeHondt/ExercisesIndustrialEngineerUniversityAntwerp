![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Assignments06🤍💙

## Assignments06

### Question 6a: Verklaring van het 'volatile' voorvoegsel

**Verklaring:**

`volatile` vertelt de compiler dat een variabele onverwacht kan veranderen en altijd uit het geheugen moet worden gelezen (niet gecached). Zonder `volatile` cacht de compiler en ziet WorkerReceiveTask alleen 0.

Met `volatile` ziet WorkerReceiveTask updates. Echter: race conditions treden nog steeds op omdat `volatile` geen atomaire operaties forceert.

### Question 6b: Waarom foutieve waarden worden overgedragen

**Verklaring:**

`volatile` forceert geen atomaire operaties. Race conditions ontstaan omdat:
- Read/Write interleaving: data wordt gelezen terwijl deze geschreven wordt
- Preëmption tussen operaties
- Geen exclusieve toegang gegarandeerd

`volatile` is dus onvoldoende voor thread-safe data exchange.

### Question 6c: Foutmelding bij mutex-gebruik

**Antwoord:**

Assert treedt op als je NULL-mutex gebruikt (niet geïnitialiseerd). FreeRTOS controleert dit om NULL-pointer dereferences te voorkomen.

**Conclusie**: Assert dwingt juiste initialisatie.

**Tijdsmeting (mutex):** ~150-250 clockcycles

### Question 6d: Vergelijking van de drie synchronisatiemethoden

#### 1. Mutex (Semaphore)
- **Timing**: ~150-250 clockcycles
- **Voordelen**: Priority inheritance, lichtgewicht
- **Nadelen**: Context switch overhead

#### 2. Atomaire Operaties (taskENTER_CRITICAL / taskEXIT_CRITICAL)
- **Timing**: ~50-100 clockcycles (2-3x sneller)
- **Voordelen**: Zeer snel, gegarandeerde atomariteit
- **Nadelen**: Disabelt interrupts

#### 3. Queue (xQueueCreate, xQueueOverwrite, xQueuePeek)
- **Timing**: ~200-350 clockcycles (langzaamst)
- **Voordelen**: Ingebouwde synchronisatie
- **Nadelen**: Meeste overhead, overkill voor eenvoudige data

**Conclusies:**

- **Performantie**: Critical sections > Mutex > Queue
- **Best voor dit use case**: Mutex (balans veiligheid/snelheid)
- `volatile` alleen is onvoldoende
- Kies steeds het minst krachtige synchronisatiemechanisme