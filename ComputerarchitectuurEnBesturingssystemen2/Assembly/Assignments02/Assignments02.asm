; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; PL9823 RGB LED control - all 4 LEDs green
; Protocol: single wire, strict timing at 32MHz
;
; Hardware connections:
;   PD3 = USARTD-MOSI -> data line to PL9823
;   PA6 = PL9823-CS   -> HIGH to enable MOSFET
;   PC5 = VAUX-ENA    -> HIGH to enable power
;
; Register map:
;   PORTD_DIR = 0x0680
;   PORTD_OUT = 0x0684
;   PORTA_DIR = 0x0600
;   PORTA_OUT = 0x0604
;   PORTC_DIR = 0x0640
;   PORTC_OUT = 0x0644
;
; Timing at 32MHz (1 cycle = 31.25ns):
;   T0H = 0.35us =  11 cycles (bit 0 high time)
;   T0L = 1.36us =  44 cycles (bit 0 low  time)
;   T1H = 1.36us =  44 cycles (bit 1 high time)
;   T1L = 0.35us =  11 cycles (bit 1 low  time)
;   RES = 50us   = 1600 cycles (reset pulse)
;
; Register usage:
;   r16 = general purpose (temp)
;   r17 = bit counter    (counts to 8 per byte)
;   r18 = LED counter    (counts to 4 LEDs)
;   r20 = reset inner counter
;   r21 = reset outer counter (counts to 3)
;
; -----------------------------------------------
; Algorithm:
;
; 1. ClockInit (before .CSEG)
;    - Configure external 16MHz crystal oscillator
;    - Wait until oscillator is stable (XOSCRDY bit3)
;    - Configure PLL: xosc x2 = 32MHz
;    - Enable PLL, wait until stable (PLLRDY bit4)
;    - Switch system clock to PLL via CCP unlock
;
; 2. Init (once)
;    - PD3 as output (data line to PL9823)
;    - PA6 as output and HIGH (CS -> MOSFET on)
;    - PC5 as output and HIGH (VAUX power enable)
;    - Init all counters to 0
;
; 3. Reset (once before first data)
;    - Keep PD3 low for >= 50us
;    - Initializes PL9823 shift register
;
; 4. Color loop (for each of the 4 LEDs)
;    - Send Red   byte: 8x call Nul or Een
;    - Send Green byte: 8x call Nul or Een
;    - Send Blue  byte: 8x call Nul or Een
;    - Repeat for next LED until all 4 done
;
; 5. Nul subroutine (send bit 0)
;    - PD3 HIGH for T0H (~11 cycles)
;    - PD3 LOW  for T0L (~44 cycles)
;    - Increment bit counter, return
;
; 6. Een subroutine (send bit 1)
;    - PD3 HIGH for T1H (~44 cycles)
;    - PD3 LOW  for T1L (~11 cycles)
;    - Increment bit counter, return
;
; -----------------------------------------------
; HOW TO CHANGE COLOR:
;
;   call Een = bit 1 = channel ON  (full brightness)
;   call Nul = bit 0 = channel OFF (no light)
;
;   Change the call instructions in Rood/Groen/Blauw:
;
;   RED:    Rood=Een  Groen=Nul  Blauw=Nul
;   GREEN:  Rood=Nul  Groen=Een  Blauw=Nul  <- current
;   BLUE:   Rood=Nul  Groen=Nul  Blauw=Een
;   YELLOW: Rood=Een  Groen=Een  Blauw=Nul
;   WHITE:  Rood=Een  Groen=Een  Blauw=Een
;   OFF:    Rood=Nul  Groen=Nul  Blauw=Nul
; -----------------------------------------------

.CSEG
Init:
    ; --- PD3 as output (data line to PL9823 via MOSFET) ---
    ldi     r16, 0b00001000       ; bit 3 = PD3
    sts     PORTD_DIR, r16        ; set PD3 as output

    ; --- PA6 as output and HIGH (CS enable for MOSFET) ---
    ldi     r16, 0b01000000       ; bit 6 = PA6
    sts     PORTA_DIR, r16        ; set PA6 as output
    sts     PORTA_OUT, r16        ; PA6 high -> MOSFET conducts

    ; --- PC5 as output and HIGH (VAUX power enable) ---
    ldi     r16, 0b00100000       ; bit 5 = PC5
    sts     PORTC_DIR, r16        ; set PC5 as output
    sts     PORTC_OUT, r16        ; PC5 high -> power enabled

    ; --- Init all counters to 0 ---
    ldi     r17, 0                ; bit counter
    ldi     r18, 0                ; LED counter
    ldi     r20, 0                ; reset inner counter
    ldi     r21, 0                ; reset outer counter

; RESET: PD3 low >= 50us to initialize PL9823
; r20 overflows 256x, r21 counts to 3
; total = 3 x 256 x 4 cycles = 3072 cycles > 1600
Reset:
    inc     r20                   ; increment until r20 overflows to 0
    brne    Reset                 ; keep looping until overflow
    inc     r21
    cpi     r21, 3                ; outer loop 3 times for >= 50us
    brne    Reset
    ldi     r20, 0                ; reset inner counter
    ldi     r21, 0                ; reset outer counter

; COLOR LOOP: send RGB data to all 4 LEDs
; Current color: GREEN (Rood=Nul, Groen=Een, Blauw=Nul)
; See header comment to change color

; --- Red channel: 8 bits (0 = Red OFF) ---
Rood:
    call    Nul                   ; <- change to "Een" for Red ON
    cpi     r17, 8                ; sent 8 bits?
    brne    Rood                  ; no -> send next bit
    ldi     r17, 0                ; reset bit counter

; --- Green channel: 8 bits (1 = Green ON) ---
Groen:
    call    Een                   ; <- change to "Nul" for Green OFF
    cpi     r17, 8                ; sent 8 bits?
    brne    Groen                 ; no -> send next bit
    ldi     r17, 0                ; reset bit counter

; --- Blue channel: 8 bits (0 = Blue OFF) ---
Blauw:
    call    Nul                   ; <- change to "Een" for Blue ON
    cpi     r17, 8                ; sent 8 bits?
    brne    Blauw                 ; no -> send next bit
    ldi     r17, 0                ; reset bit counter

; --- Advance to next LED ---
Leds:
    inc     r18
    cpi     r18, 4                ; all 4 LEDs done?
    brne    Rood                  ; no -> repeat color for next LED

; --- All 4 LEDs set -> hold color forever ---
Loop:
    jmp     Loop

; NUL: send bit 0
; T0H = HIGH ~11 cycles: ldi(1) + sts(2) + 9 nops
; T0L = LOW  ~44 cycles: ldi(1) + sts(2) + 38 nops
;                        + inc(1) + ret(4)
Nul:
    ldi     r16, 0b00001000       ; PD3 high
    sts     PORTD_OUT, r16        ; signal high -> T0H start
    nop                           ; -- 9 nops (T0H) --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 9

    ldi     r16, 0b00000000       ; PD3 low
    sts     PORTD_OUT, r16        ; signal low -> T0L start
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 10
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 20
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 30
    nop                           ; -- 8 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 38
    inc     r17                   ; increment bit counter
    ret

; EEN: send bit 1
; T1H = HIGH ~44 cycles: ldi(1) + sts(2) + 38 nops
;                        + ldi(1) = 42 (close enough)
; T1L = LOW  ~11 cycles: sts(2) + 9 nops
;                        + inc(1) + ret(4)
Een:
    ldi     r16, 0b00001000       ; PD3 high
    sts     PORTD_OUT, r16        ; signal high -> T1H start
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 10
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 20
    nop                           ; -- 10 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 30
    nop                           ; -- 8 nops --
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 38

    ldi     r16, 0b00000000       ; PD3 low
    sts     PORTD_OUT, r16        ; signal low -> T1L start
    nop                           ; -- 9 nops (T1L) --
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                           ; 9
    inc     r17                   ; increment bit counter
    ret