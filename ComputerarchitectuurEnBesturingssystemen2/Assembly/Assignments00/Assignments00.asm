; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; Running light: 4 red LEDs lighting up one by one
; Frequency: 1Hz (each LED on for 250ms)
; Microcontroller: ATxmega384C3
;
; Schematic BB (connector T21):
;   LED4 -> PA7 -> PORTA (base 0x0600)
;   LED1 -> PB0 -> PORTB (base 0x0620)
;   LED2 -> PB1 -> PORTB (base 0x0620)
;   LED3 -> PB2 -> PORTB (base 0x0620)
;
; Register map (offset from manual chapter 12.15):
;   DIR  offset = 0x00  -> configure pin as output
;   OUT  offset = 0x04  -> write output value
;
;   PORTA_DIR = 0x0600 + 0x00 = 0x0600
;   PORTA_OUT = 0x0600 + 0x04 = 0x0604
;   PORTB_DIR = 0x0620 + 0x00 = 0x0620
;   PORTB_OUT = 0x0620 + 0x04 = 0x0624
; -----------------------------------------------

.CSEG
Init:
    ; --- PORTC pin 5 as output and high ---
    ldi r16, 0b00100000
    sts 0x0640, r16           ; PORTC_DIR
    sts 0x0644, r16           ; PORTC_OUT -> high

    ; --- PORTA pin 7 (LED4) as output ---
    ldi r16, 0b10000000       ; bit 7 = PA7 = LED4
    sts 0x0600, r16           ; PORTA_DIR

    ; --- PORTB pins 0,1,2 (LED1,LED2,LED3) as output ---
    ldi r16, 0b00000111       ; bits 0,1,2 = PB0,PB1,PB2
    sts 0x0620, r16           ; PORTB_DIR

    ; --- Turn off all LEDs at startup ---
    ldi r16, 0b00000000
    sts 0x0604, r16           ; PORTA_OUT -> LED4 off
    sts 0x0624, r16           ; PORTB_OUT -> LED1,2,3 off

; MAIN: Infinite running light sequence
; Order: LED1 -> LED2 -> LED3 -> LED4 -> repeat
Main:
    ; --- LED1 on (PB0), rest off ---
    ldi r16, 0b00000000
    sts 0x0604, r16           ; PORTA_OUT -> LED4 off
    ldi r16, 0b00000001       ; only bit 0 high = LED1
    sts 0x0624, r16           ; PORTB_OUT
    rcall Delay               ; wait ~250ms

    ; --- LED2 on (PB1), rest off ---
    ldi r16, 0b00000000
    sts 0x0604, r16           ; PORTA_OUT -> LED4 off
    ldi r16, 0b00000010       ; only bit 1 high = LED2
    sts 0x0624, r16           ; PORTB_OUT
    rcall Delay               ; wait ~250ms

    ; --- LED3 on (PB2), rest off ---
    ldi r16, 0b00000000
    sts 0x0604, r16           ; PORTA_OUT -> LED4 off
    ldi r16, 0b00000100       ; only bit 2 high = LED3
    sts 0x0624, r16           ; PORTB_OUT
    rcall Delay               ; wait ~250ms

    ; --- LED4 on (PA7), rest off ---
    ldi r16, 0b10000000       ; only bit 7 high = LED4
    sts 0x0604, r16           ; PORTA_OUT
    ldi r16, 0b00000000
    sts 0x0624, r16           ; PORTB_OUT -> LED1,2,3 off
    rcall Delay               ; wait ~250ms

    jmp Main                  ; start over -> never stop

; DELAY subroutine: ~250ms at 2MHz clock
;
; Calculation:
;   Inner loop (r17 = 0..255): 256 × 4 cycles  =   1.024 cycles
;   Middle loop (r18 = 0..255): 256 × 1.024    = 262.144 cycles
;   Outer loop (r19 = 2):         2 × 262.144  = 524.288 cycles
;   At 2MHz: 524.288 / 2.000.000 ≈ 262ms ≈ 250ms
;
;   Calibrate r19 using the simulator/oscilloscope if needed!
Delay:
    ldi r19, 2                ; outer counter (adjust for fine calibration)

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