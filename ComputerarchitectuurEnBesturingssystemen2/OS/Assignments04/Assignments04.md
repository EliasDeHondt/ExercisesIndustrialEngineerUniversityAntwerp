![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Assignments04🤍💙

## Assignments04

### Question 4a: Output pvPortMalloc() en xPortGetFreeHeapSize() test

**Testresultaten:**

```
=== OEFENING 4 - DYNAMISCHE GEHEUGENALLOCATIE ===
Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit): 32
[0] Allocatie van 32 bytes:
  - Basisadres: 0x2B8C
  - Vrij geheugen voor: 14991 bytes
  - Vrij geheugen na: 14955 bytes
  - Werkelijke allocatie: 36 bytes (overhead: 4 bytes)
```

- In welke richting (stijgende / dalende adressen) worden de adressen op de heap 
toegekend?
> De adressen worden toegekend in stijgende richting (van laag naar hoog).

- Hoeveel bytes overhead is er bij het alloceren van een geheugenblok?
> Er is een overhead van 4 bytes per allocatie (om metadata op te slaan).

- Wat gebeurt er indien meer geheugen opgevraagd wordt dan vrij is?
> De allocatie mislukt en `pvPortMalloc()` retourneert NULL. Er wordt geen geheugen toegewezen en de vrije heap blijft ongewijzigd.

### Question 4b: MemMap() output en TCB-grootte

**MemMap() Output:**

```
MEMORY MAP:
-----------
IO registers start:	    	       	       0x0000
IO registers end:	      	       	       0x0fff
EEPROM start:	  	       	       	       0x1000
EEPROM end:	    	       	       	       0x1fff
SRAM start:	    	       	       	       0x2000
	        .DATA start:	   	       	   0x2000
	        .DATA end:	     	       	   0x2543
	        .BSS start:	    	       	   0x2544
	        .BSS end:	      	       	   0x2614
	        .HEAP start:	   	       	   0x2617
	        Task name: term
	       	        STACK end:	     	   0x261c
	       	        STACK start:	   	   0x2a1c
	       	        TCB start:	     	   0x2a20
	       	        TCB end:	       	   0x2a4f
	        Task name: IDLE
	       	        STACK end:	     	   0x2a54
	       	        STACK start:	   	   0x2b54
	       	        TCB start:	     	   0x2b58
	       	        TCB end:	       	   0x2b87
	        .HEAP end:	     	       	   0x6616
	        .Bare metal STACK end:	 	   0x6617
	        .Bare metal STACK start:	   0x9fff
SRAM stop:	     	       	       	       0x9fff
```

- Leid uit de output van de memmap functie de grootte van de TCB af, noteer deze ook.
> De TCB (Task Control Block) grootte is 48 bytes. Dit kan worden afgeleid uit het verschil tussen de start- en eindadressen van de TCB's:
- TCB term: 0x2a20 - 0x2a4f = 0x30 (48 bytes)
- TCB IDLE: 0x2b58 - 0x2b87 = 0x30 (48 bytes)


### Question 4c: Geheugenaddressen van variabelen

**Testresultaten**

```
=== OEFENING 4A - GEHEUGENADDRESSEN ===
Globale variabelen:
  Var1 adres: 0x246E
  Var2 adres: 0x2016

Lokale variabelen in WorkerMemTask():
  Var4 adres: 0x287C (lokaal)
  Var5 adres: 0x2468 (static)
  Var6 adres: 0x2018 (static geïnitialiseerd)

Geheugenmapping:
MEMORY MAP:
-----------
IO registers start:	    	       	       0x0000
IO registers end:	      	       	       0x0fff
EEPROM start:	  	       	       	       0x1000
EEPROM end:	    	       	       	       0x1fff
SRAM start:	    	       	       	       0x2000
	.DATA start:	   	       	           0x2000
	.DATA end:	     	       	           0x23af
	.BSS start:	    	       	           0x23b0
	.BSS end:	      	       	           0x247b
	.HEAP start:	   	       	           0x247e
	Task name: mem
		STACK end:	     	               0x2483
		TCB start:	     	               0x2887
		TCB end:	       	               0x28b6
	Task name: IDLE
		STACK end:	     	               0x28bb
		TCB start:	     	               0x29bf
		TCB end:	       	               0x29ee
	.HEAP end:	     	       	           0x647d
	.Bare metal STACK end:	 	           0x647e
	.Bare metal STACK start:	           0x9fff
SRAM stop:	    	       	               0x9fff
```

**Analyse per variabele met adressen:**

| Variabele | Type | Initialisatie | Adres | Sectie | Reden |
|-----------|------|----------------|-------|--------|--------|
| **Var1** | `volatile int` globaal | Nee | 0x246E | **.BSS** | Ongeïnitialiseerd globaal in .BSS (0x23b0-0x247b) |
| **Var2** | `volatile int` globaal | Ja (=50) | 0x2016 | **.DATA** | Geïnitialiseerd globaal in .DATA (0x2000-0x23af) |
| **Var3** | `volatile int` lokaal in main() | Ja (=10) | [main-stack] | **STACK** | Lokale variabelen in main() op main stack (niet zichtbaar hier) |
| **Var4** | `int` lokaal in WorkerMemTask() | Nee | 0x287C | **STACK** | Lokale variabele in mem task stack (0x2483-0x2886) |
| **Var5** | `static int` in WorkerMemTask() | Nee | 0x2468 | **.BSS** | Static ongeïnitialiseerd in .BSS (0x23b0-0x247b) |
| **Var6** | `static int` in WorkerMemTask() | Ja (=10) | 0x2018 | **.DATA** | Static geïnitialiseerd in .DATA (0x2000-0x23af) |

**Verklaring per sectie:**

- **.DATA sectie (0x2000 - 0x23af):** 
  - Bevat alle **geïnitialiseerde globale en statische variabelen**
  - Deze waarden zijn in het programmageheugen opgeslagen en worden bij boot in SRAM geladen
  - Var2 (0x2016) en Var6 (0x2018) worden hier opgeslagen
  
- **.BSS sectie (0x23b0 - 0x247b):**
  - Bevat alle **ongeïnitialiseerde globale en statische variabelen**
  - Deze worden geïnitialiseerd op 0 bij het opstarten
  - Var1 (0x246E) en Var5 (0x2468) worden hier opgeslagen
  - `volatile` modifier voorkomt compiler optimalisatie
  
- **STACK sectie (per task):**
  - Bevat **lokale variabelen** (automatische storage duration)
  - mem task STACK: 0x2483 - 0x2886 (groeit omhoog)
  - Var4 (0x287C) wordt op mem task stack geplaatst
  - Var3 op main task stack (niet zichtbaar in mem task view)
  
**TCB-grootte afleiden:**
- mem task TCB: 0x2887 - 0x28b6 = **48 bytes** (0x30)
- IDLE task TCB: 0x29bf - 0x29ee = **48 bytes** (0x30)
- Beide tasks hebben dezelfde TCB-grootte van 48 bytes

### Question 4d: MemFunction geheugenlek (Oefening 4B vs 4C)

**Code analyse:**

**LinebotOS-oef4B (WERKT CORRECT):**
```c
void MemFunction() {
    int num[100];           // Stack-array: 400 bytes
    int a;
    
    for (a=0; a<100; a++) {
        num[a] = a;
    }
    printf("Complete!\r\n");
}
// Stack-array wordt AUTOMATISCH freed wanneer functie eindigt
```

**LinebotOS-oef4C (FAALT met Memory Allocation Error):**
```c
void MemFunction() {
    int *num;
    int a;
    
    num = pvPortMalloc(sizeof(int) * 100);  // Dynamische allocatie: 400+ bytes
    
    for (a=0; a<100; a++) {
        num[a] = a;
    }
    printf("Complete!\r\n");
    // GEEN vPortFree(num) !!!
}
// Geheugen blijft gealloceerd, wordt NIET vrijgegeven!
```

**Het probleem:**

1. **Geheugenlek in 4C:**
   - `MemFunction()` wordt elke 100ms aangeroepen
   - Elke keer: `pvPortMalloc(400)` alloceert geheugen
   - Maar: Geen corresponderende `vPortFree()` 
   - Na ~10 seconden (100+ iteraties): **Heap vol!**
   - `pvPortMalloc()` faalt → returns NULL
   - Pointer is NULL → crash of hang

2. **Waarom werkt 4B wel:**
   - Array op stack: `int num[100]`
   - Stack-geheugen wordt AUTOMATISCH teruggegeven na functie-einde
   - Geen geheugenlek, geen fragmentatie
   - Stack is klein (400 bytes) → geen probleem

**Correctie voor 4C:**

```c
void MemFunction() {
    int *num;
    int a;

    num = pvPortMalloc(sizeof(int) * 100);

    if (num != NULL) {  // ALTIJD checken op NULL!
        for (a=0; a<100; a++) num[a] = a;

        printf("Complete!\r\n");

        vPortFree(num);  // ALTIJD vrijgeven!
    } else printf("ERROR: pvPortMalloc failed!\r\n");
}
```


### Question 4e: Heap-fragmentatie in Oefening 4D met heap_2.c

**Analyse van LinebotOS-oef4D:**

De code voert 6 stappen uit met 6 geheugenblokken:

```c
Step 1: Unallocated heap memory: 16000 bytes
Step 2: Allocate 6 blocks (BlockSize = 2660 bytes each)
Step 3: Free Block1 + Block2 (aanliggende blokken!)
Step 4: ❌ FAALT - Allocate 2x BlockSize (5320 bytes)
        Vrij geheugen: 5320 bytes totaal
        Maar geen AANEENGESLOTEN blok van 5320 bytes!
```

**Geheugenvisualisatie:**

```
Na stap 2 (6 blokken gealloceerd):
[Block1:2660] [Block2:2660] [Block3:2660] [Block4:2660] [Block5:2660] [Block6:2660]
Heap vol (16000 bytes bezet)

Na stap 3 (Block1 + Block2 vrijgegeven):
[FREE:2660] [FREE:2660] [USED:2660] [USED:2660] [USED:2660] [USED:2660]
Vrij totaal: 5320 bytes (2660+2660)

Stap 4 probeert 5320 bytes te alloceren:
PROBLEEM MET HEAP_2.C:
- heap_2.c doet GEEN coalescing
- Twee vrije blokken van elk 2660 bytes BLIJVEN APART
- Eerste fit algoritme: Zoekt eerste vrije blok ≥ 5320 bytes
- Maar: Geen enkel vrij blok is 5320 bytes groot!
- Allocatie FAALT ❌
```

**Waarom faalt heap_2.c?**

Uit FreeRTOS/heap_2.c commentaar:
```
"A sample implementation...that permits allocated blocks to be freed, 
but does NOT COMBINE ADJACENT FREE BLOCKS into a single larger block 
(and so will fragment memory)"
```

**Kern van het probleem:**

1. **First-Fit algoritme:** Zoekt eerste vrije blok groot genoeg
2. **Geen coalescing:** Aangrenzende vrije blokken worden NIET samengevoegd
3. **Fragmentatie:** Vrij geheugen wordt verspreída in kleine stukken
4. **Allocatie faalt:** Ondanks 5320 bytes vrij, geen aaneengesloten blok beschikbaar

**Waarom is dit problematisch op embedded systemen?**
- Beperkt geheugen (~16KB)
- Herhaaldelijke alloc/dealloc patronen → fragmentatie
- Na korte tijd: Veel kleine vrije blokken → niets kan meer worden gealloceerd

### Question 4f: Waarom heap_4.c beter is (maar toch nog faalt)

**Heap_4.c algoritme: First-Fit met Coalescing**

```
Na stap 3 (Block1 + Block2 vrijgegeven):
[FREE:2660] [FREE:2660] [USED:2660] [USED:2660] [USED:2660] [USED:2660]

HEAP_4.C COALESCING:
Wanneer Block2 wordt vrijgegeven:
- Controleert linker buur (Block1) → is FREE
- Controleert rechter buur (Block3) → is USED
- Merget met linker buur → [FREE:5320] [USED:2660] [USED:2660] [USED:2660] [USED:2660]

Stap 4 SUCCESVOL:
Allocatie van 5320 bytes ✅ → [USED:5320] [USED:2660] [USED:2660] [USED:2660] [USED:2660]
```

**Stap 5 en 6 in oef4D:**

```
Stap 5: Free Block4 + Block6 (NIET aanliggende!)
[USED:5320] [USED:2660] [FREE:2660] [USED:2660] [FREE:2660]
Vrij: 5320 bytes (twee aparte blokken van 2660)

Stap 6: Allocate 2x BlockSize (5320 bytes)
```

**Waarom faalt het toch nog met heap_4.c?**

Zelfs heap_4.c kan falen omdat:

1. **Block4 en Block6 zijn NIET aanliggende:**
   - Block4 is LINKS van Block5 (gebruikt)
   - Block6 is RECHTS van Block5 (gebruikt)
   - Block5 (USED) staat ertussen → geen merge mogelijk

2. **Fragmentatie ondanks coalescing:**
   ```
   [USED:5320] [USED:2660] [FREE:2660] [USED:2660] [FREE:2660]
                                 Block5 blokkeert merge!
   
   Heap_4 coalescing faalt:
   - Linker FREE (Block4) heeft rechter USED (Block5)
   - Rechter FREE (Block6) heeft linker USED (Block5)
   - GEEN merge mogelijk door Block5!
   ```

3. **Resultaat:**
   - Totaal vrij: 5320 bytes (2660+2660)
   - Maar in twee aparte blokken
   - Allocatie van 5320 bytes mislukt ❌

**Visualisatie van het probleem:**

```
[        Block1 (5320)        ][Block2:2660]
[Block3:2660][Block4:2660][Block5:2660][Block6:2660]
             [  FREE   ]         [  FREE   ]
                ^                      ^
          GESCHEIDEN DOOR USED BLOK

heap_4 kan NIET samenvoegen!
```

**Waarom faalt heap_4 toch nog?**

- Coalescing werkt ALLEEN voor aangrenzende blokken
- Block5 (USED) zit ertussen
- Dus: 2660+2660 ≠ samengevoegd 5320 bytes
- Allocatie van 5320 bytes faalt in stap 6

**Beste praktijk:**

- Vermijd fragmentatie door:
  1. **Pool allocation:** Reserveer vaste geheugenblokken
  2. **Predictable patterns:** Alloc/dealloc in vaste volgorde
  3. **Monitor geheugen:** Check `xPortGetFreeHeapSize()` regelmatig
  4. **Gebruik heap_5.c:** Voor complexe scenario's met meerdere heaps
  5. **Alloceer vroeg:** Maak blokken aan startup, niet runtime

