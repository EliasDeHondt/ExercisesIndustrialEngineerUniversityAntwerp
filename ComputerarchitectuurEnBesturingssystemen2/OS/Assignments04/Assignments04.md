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

### Question 4e: Heap-fragmentatie in Oefening 4D

### Question 4f: Oplossing met heap_4.c
