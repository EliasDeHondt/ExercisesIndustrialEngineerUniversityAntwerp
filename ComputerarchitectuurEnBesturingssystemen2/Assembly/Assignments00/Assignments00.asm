; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; Running light: 4 red LEDs lighting up one by one
; Frequency: 1Hz (each LED on for 250ms)
; Order: LED1 -> LED2 -> LED3 -> LED4 -> repeat
;
; Hardware connections:
;   LED4 -> PA7 -> PORTA (base 0x0600)
;   LED1 -> PB0 -> PORTB (base 0x0620)
;   LED2 -> PB1 -> PORTB (base 0x0620)
;   LED3 -> PB2 -> PORTB (base 0x0620)
;
; Register map:
;   DIR  offset = 0x00  -> configure pin as output
;   OUT  offset = 0x04  -> write output value
;
;   PORTA_DIR = 0x0600 + 0x00 = 0x0600
;   PORTA_OUT = 0x0600 + 0x04 = 0x0604
;   PORTB_DIR = 0x0620 + 0x00 = 0x0620
;   PORTB_OUT = 0x0620 + 0x04 = 0x0624
; -----------------------------------------------
; Algorithm:
;
; 1. Init (once)
;    - Set PORTC pin 5 as output and high (enable)
;    - Set PORTA pin 7 (LED4) as output
;    - Set PORTB pins 0,1,2 (LED1,LED2,LED3) as output
;    - Turn off all LEDs
;
; 2. Main loop (repeat forever)
;    - LED1 on, rest off -> wait 250ms
;    - LED2 on, rest off -> wait 250ms
;    - LED3 on, rest off -> wait 250ms
;    - LED4 on, rest off -> wait 250ms
;    - Jump back to start of main loop
;
; 3. Delay subroutine (~250ms at 2MHz)
;    - r17 counts 0..255 (inner loop)
;    - r18 counts 0..255 (middle loop)
;    - r19 counts down from 2 (outer loop)
;    - Total: 256 x 256 x 2 x 4 cycles = 524.288 cycles -> ~250ms
;    - Return to caller
; -----------------------------------------------

.CSEG
Init:
    ; --- PORTC pin 5 as output and high ---
    ldi r16, 0b00100000
    sts 0x0640, r16
    sts 0x0644, r16

    ; --- PORTA pin 7 (LED4) as output ---
    ldi r16, 0b10000000
    sts 0x0600, r16

    ; --- PORTB pins 0,1,2 (LED1,LED2,LED3) as output ---
    ldi r16, 0b00000111
    sts 0x0620, r16

    ; --- Turn off all LEDs at startup (active low -> all bits high) ---
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000111
    sts 0x0624, r16

; MAIN: Infinite running light sequence
; Only 1 LED on at a time (active low: 0=on, 1=off)
Main:
    ; --- LED1 on (PB0=0), LED2,LED3,LED4 off ---
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000110
    sts 0x0624, r16
    rcall Delay

    ; --- LED2 on (PB1=0), LED1,LED3,LED4 off ---
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000101
    sts 0x0624, r16
    rcall Delay

    ; --- LED3 on (PB2=0), LED1,LED2,LED4 off ---
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000011
    sts 0x0624, r16
    rcall Delay

    ; --- LED4 on (PA7=0), LED1,LED2,LED3 off ---
    ldi r16, 0b00000000
    sts 0x0604, r16
    ldi r16, 0b00000111
    sts 0x0624, r16
    rcall Delay

    jmp Main

; DELAY subroutine: ~250ms at 2MHz clock
;
; Calculation:
;   Inner loop  (r17 = 0..255): 256 × 4 cycles =   1.024 cycles
;   Middle loop (r18 = 0..255): 256 × 1.024    = 262.144 cycles
;   Outer loop  (r19 = 2):        2 × 262.144  = 524.288 cycles
;   At 2MHz: 524.288 / 2.000.000 ≈ 262ms ≈ 250ms
Delay:
    ldi r19, 2                ; outer counter

DelayOuter:
    ldi r18, 0                ; middle counter (256 iterations)

DelayMiddle:
    ldi r17, 0                ; inner counter (256 iterations)

DelayInner:
    inc r17                   ; +1  (1 cycle)
    cpi r17, 0                ; compare with 0  (1 cycle)
    brne DelayInner           ; jump back if not 0  (2 cycles)

    inc r18
    cpi r18, 0
    brne DelayMiddle

    dec r19
    brne DelayOuter

    ret                       ; return to caller