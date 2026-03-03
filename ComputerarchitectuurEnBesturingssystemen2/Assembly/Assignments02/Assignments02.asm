; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; PL9823 RGB LED control - first LED only
; Protocol: single wire, strict timing at 32MHz
;
; Hardware connections:
;   PL9823 data -> PA6 -> PORTA (base 0x0600)
;
; Register map:
;   PORTA_DIR    = 0x0600 + 0x00 = 0x0600
;   PORTA_OUTSET = 0x0600 + 0x05 = 0x0605  (set pin high)
;   PORTA_OUTCLR = 0x0600 + 0x06 = 0x0606  (set pin low)
;
; Timing at 32MHz (1 cycle = 31.25ns):
;   T0H = 0.35us =  11 cycles (high for bit 0)
;   T0L = 1.36us =  44 cycles (low  for bit 0)
;   T1H = 1.36us =  44 cycles (high for bit 1)
;   T1L = 0.35us =  11 cycles (low  for bit 1)
;   RES = 50us   = 1600 cycles (reset pulse, low)
;
; Register usage:
;   r16 = general purpose (temp)
;   r17 = reset delay counter (inner)
;   r18 = reset delay counter (outer)
;   r23 = byte to send (consumed by SendByte)
;   r24 = bit counter in SendByte
;   r25 = PA6 pin mask (0x40), set once in Init
;   r26 = Red   value to send
;   r27 = Green value to send
;   r28 = Blue  value to send
;
; -----------------------------------------------
; Algorithm:
;
; 1. ClockInit (once)
;    - Enable internal 32MHz oscillator
;    - Wait until oscillator is stable
;    - Switch system clock to 32MHz
;
; 2. Init (once)
;    - Set PA6 as output (PL9823 data pin)
;    - Set PA6 low (idle state)
;    - Load PA6 pin mask (0x40) into r25
;
; 3. Main loop (repeat forever)
;    - Load color values into r26 (R), r27 (G), r28 (B)
;    - Call SendRGB -> sends 24 bits to first LED
;    - Call Reset   -> 50us low pulse to latch color
;    - Jump back to start of main loop
;
; 4. SendRGB subroutine
;    - Copy r26 (Red)   to r23, call SendByte
;    - Copy r27 (Green) to r23, call SendByte
;    - Copy r28 (Blue)  to r23, call SendByte
;    - Return to caller
;
; 5. SendByte subroutine
;    - Loop 8 times (r24 = 8)
;    - Rotate MSB of r23 into carry (rol)
;    - If carry = 1 -> SendBit1 path (T1H + T1L)
;    - If carry = 0 -> SendBit0 path (T0H + T0L)
;    - Return to caller
;
; 6. Reset subroutine
;    - Set PA6 low for >= 50us (>= 1600 cycles)
;    - Return to caller
; -----------------------------------------------

.CSEG
ClockInit:
    ; Enable internal 32MHz RC oscillator (bit 1 of OSC_CTRL)
    ldi r16, 0x02
    sts 0x0050, r16           ; OSC_CTRL -> enable RC32M

WaitRC32M:
    lds r16, 0x0051           ; OSC_STATUS
    andi r16, 0x02            ; check bit 1: RC32M ready?
    breq WaitRC32M            ; no -> keep waiting

    ; Switch system clock to RC32M
    ; Requires CCP signature write first (protected register)
    ldi r16, 0xD8             ; CCP signature for IOREG access
    sts 0x0034, r16           ; CPU_CCP
    ldi r16, 0x01             ; select RC32M as system clock
    sts 0x0040, r16           ; CLK_CTRL
    ret

; INIT: configure PA6 as output for PL9823 data
Init:
    rcall ClockInit           ; must run first -> sets 32MHz clock

    ; Set PA6 as output
    lds r16, 0x0600           ; read current PORTA_DIR
    ori r16, 0x40             ; set bit 6 (PA6)
    sts 0x0600, r16           ; PORTA_DIR -> PA6 output

    ; PA6 low (idle)
    ldi r25, 0x40             ; PA6 pin mask -> keep in r25 forever
    sts 0x0606, r25           ; PORTA_OUTCLR -> PA6 low

; MAIN: send color to first PL9823 LED, repeat
Main:
    ; Load color: RED full on, GREEN and BLUE off
    ; Bit order: R first, then G, then B (see datasheet)
    ldi r26, 0xFF             ; Red   = 255 (full)
    ldi r27, 0x00             ; Green = 0
    ldi r28, 0x00             ; Blue  = 0

    rcall SendRGB             ; send 24 bits to LED
    rcall Reset               ; latch color with reset pulse

    jmp Main                  ; repeat forever

; SENDRGB: send 24-bit color to PL9823
; Input: r26 = Red, r27 = Green, r28 = Blue
SendRGB:
    mov r23, r26
    rcall SendByte            ; send Red byte

    mov r23, r27
    rcall SendByte            ; send Green byte

    mov r23, r28
    rcall SendByte            ; send Blue byte

    ret

; SENDBYTE: send 8 bits from r23, MSB first
;
; Timing at 32MHz (verify with simulator!):
;
;   Bit 0: HIGH = sts(2) + 9 nops       = 11 cycles  (T0H)
;          LOW  = sts(2) + 33 nops
;               + rjmp(2) + dec(1)
;               + brne(2) + rol(1)
;               + brcs_not_taken(1)     = 42 cycles  (~T0L)
;
;   Bit 1: HIGH = sts(2) + 42 nops      = 44 cycles  (T1H)
;          LOW  = sts(2) + 2 nops
;               + dec(1) + brne(2)
;               + rol(1) + brcs(2)      = 10 cycles  (~T1L)
;
; -> Calibrate nop counts in simulator if needed!
SendByte:
    ldi r24, 8                ; 8 bits to send

SB_Loop:
    rol r23                   ; MSB -> carry (1 cycle)
    brcs SB_Bit1              ; carry=1 -> bit 1 (2 cycles taken / 1 not taken)

SB_Bit0:
    ; HIGH for T0H = 11 cycles: sts(2) + 9 nops
    sts 0x0605, r25           ; PORTA_OUTSET -> PA6 high (2 cycles)
    nop                       ; 1
    nop                       ; 2
    nop                       ; 3
    nop                       ; 4
    nop                       ; 5
    nop                       ; 6
    nop                       ; 7
    nop                       ; 8
    nop                       ; 9  -> total HIGH = 11 cycles

    ; LOW for T0L = 44 cycles
    sts 0x0606, r25           ; PORTA_OUTCLR -> PA6 low (2 cycles)
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 10 nops
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 20 nops
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 30 nops
    nop
    nop
    nop                       ; 33 nops -> total LOW ~44 cycles
    rjmp SB_Next              ; 2 cycles

SB_Bit1:
    ; HIGH for T1H = 44 cycles: sts(2) + 42 nops
    sts 0x0605, r25           ; PORTA_OUTSET -> PA6 high (2 cycles)
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 10 nops
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 20 nops
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 30 nops
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 40 nops
    nop
    nop                       ; 42 nops -> total HIGH = 44 cycles

    ; LOW for T1L = 11 cycles
    sts 0x0606, r25           ; PORTA_OUTCLR -> PA6 low (2 cycles)
    nop                       ; 1
    nop                       ; 2  -> total LOW ~11 cycles

SB_Next:
    dec r24                   ; bit counter - 1 (1 cycle)
    brne SB_Loop              ; not done -> next bit (2 cycles)
    ret                       ; all 8 bits sent

; RESET: send low pulse >= 50us to latch color
;
; 50us at 32MHz = 1600 cycles
; Inner loop: 256 x 4 cycles = 1024 cycles
; r18 = 2 -> 2 x 1024 = 2048 cycles > 1600
Reset:
    sts 0x0606, r25           ; PA6 low (already low but make sure)
    ldi r18, 2                ; outer counter

ResetOuter:
    ldi r17, 0                ; inner counter (256 iterations)

ResetInner:
    inc r17                   ; 1 cycle
    cpi r17, 0                ; 1 cycle
    brne ResetInner           ; 2 cycles -> 4 per iteration

    dec r18
    brne ResetOuter
    ret