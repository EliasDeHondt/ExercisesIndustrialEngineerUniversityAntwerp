; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; Adjustable running light with joystick control
; - Left/Right switch: change direction
; - Up/Down switch:    change speed (5 levels)
;
; Hardware connections:
;   LED4 -> PA7 -> PORTA (base 0x0600)
;   LED1 -> PB0 -> PORTB (base 0x0620)
;   LED2 -> PB1 -> PORTB (base 0x0620)
;   LED3 -> PB2 -> PORTB (base 0x0620)
;   SWU  -> PB3 -> PORTB (speed up)
;   SWL  -> PB4 -> PORTB (direction left)
;   SWD  -> PB5 -> PORTB (speed down)
;   SWR  -> PB6 -> PORTB (direction right)
;
; Register map:
;   DIR  offset = 0x00  -> configure pin as output
;   OUT  offset = 0x04  -> write output value
;   IN   offset = 0x08  -> read input value
;
;   PORTA_DIR = 0x0600
;   PORTA_OUT = 0x0604
;   PORTB_DIR = 0x0620
;   PORTB_OUT = 0x0624
;   PORTB_IN  = 0x0628
;
; Register usage:
;   r16 = general purpose (temp)
;   r17 = delay inner counter
;   r18 = delay middle counter
;   r19 = delay outer counter (copy of r22)
;   r20 = current LED index (0=LED1, 1=LED2, 2=LED3, 3=LED4)
;   r21 = direction (0=right, 1=left)
;   r22 = speed level (1=fast .. 5=slow)
;
; -----------------------------------------------
; Algorithm:
;
; 1. Init (once)
;    - Same port setup as before
;    - Set direction = right  (r21 = 0)
;    - Set speed level = 2    (r22 = 2, ~250ms per step)
;    - Set LED index = 0      (r20 = 0, start at LED1)
;
; 2. Main loop (repeat forever)
;    - Read PORTB_IN (0x0628)
;    - If SWL pressed (bit4=0) -> direction = left  (r21 = 1)
;    - If SWR pressed (bit6=0) -> direction = right (r21 = 0)
;    - If SWU pressed (bit3=0) -> speed up   (r22-1, min=1)
;    - If SWD pressed (bit5=0) -> slow down  (r22+1, max=5)
;    - Call ShowLED (light up LED at index r20, rest off)
;    - Call Delay   (duration based on r22)
;    - If direction = right: r20+1, wrap 3->0
;    - If direction = left:  r20-1, wrap 0->3
;    - Jump back to start of main loop
;
; 3. ShowLED subroutine
;    - Compare r20 with 0,1,2,3
;    - Set correct PORTA_OUT and PORTB_OUT accordingly
;
; 4. Delay subroutine (~125ms x r22 at 2MHz)
;    - r17 counts 0..255 (inner  loop)
;    - r18 counts 0..255 (middle loop)
;    - r19 counts down from r22  (outer loop, speed control)
;    - Return to caller
; -----------------------------------------------

.CSEG
Init:
    ; --- PORTC pin 5 as output and high (enable) ---
    ldi r16, 0b00100000
    sts 0x0640, r16
    sts 0x0644, r16

    ; --- PORTA pin 7 (LED4) as output ---
    ldi r16, 0b10000000
    sts 0x0600, r16

    ; --- PORTB pins 0,1,2 as output (LEDs), pins 3-6 as input (switches) ---
    ldi r16, 0b00000111
    sts 0x0620, r16

    ; --- Enable internal pull-up on switch pins (PINnCTRL = 0x18 = PULLUP) ---
    ; Without pull-up the pins float -> random values -> buttons never work!
    ldi r16, 0x18
    sts 0x0633, r16
    sts 0x0634, r16
    sts 0x0635, r16
    sts 0x0636, r16

    ; --- Turn off all LEDs at startup (active low -> bits high) ---
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000111
    sts 0x0624, r16

    ; --- Init state registers ---
    ldi r20, 0
    ldi r21, 0
    ldi r22, 2

; MAIN: read switches, show LED, advance index
Main:
    ; --- Read joystick switches from PORTB_IN ---
    lds r16, 0x0628

    ; --- Check SWL (bit 4): direction = left ---
    sbrs r16, 4
    ldi r21, 1

    ; --- Check SWR (bit 6): direction = right ---
    sbrs r16, 6
    ldi r21, 0

    ; --- Check SWU (bit 3): speed up (r22-1, min=1) ---
    sbrs r16, 3
    rcall SpeedUp

    ; --- Check SWD (bit 5): slow down (r22+1, max=5) ---
    sbrs r16, 5
    rcall SpeedDown

    ; --- Show current LED ---
    rcall ShowLED

    ; --- Wait based on speed level ---
    rcall Delay

    ; --- Advance LED index based on direction ---
    cpi r21, 0
    breq MoveRight

MoveLeft:
    dec r20                   ; r20 - 1
    cpi r20, 255              ; wrapped below 0? (0-1 = 255 in unsigned)
    brne MainEnd
    ldi r20, 3                ; wrap back to LED4
    rjmp MainEnd

MoveRight:
    inc r20                   ; r20 + 1
    cpi r20, 4                ; past LED4?
    brne MainEnd
    ldi r20, 0                ; wrap back to LED1

MainEnd:
    jmp Main                  ; repeat forever

; SPEEDUP: decrease r22 by 1, minimum = 1
SpeedUp:
    cpi r22, 1                ; already at minimum?
    breq SpeedUpEnd           ; yes -> do nothing
    dec r22                   ; no  -> r22 - 1
SpeedUpEnd:
    ret

; SPEEDDOWN: increase r22 by 1, maximum = 5
SpeedDown:
    cpi r22, 5                ; already at maximum?
    breq SpeedDownEnd         ; yes -> do nothing
    inc r22                   ; no  -> r22 + 1
SpeedDownEnd:
    ret

; SHOWLED: light up LED at index r20, rest off
; Active low: 0=on, 1=off
ShowLED:
    cpi r20, 0
    breq ShowLED1
    cpi r20, 1
    breq ShowLED2
    cpi r20, 2
    breq ShowLED3
    rjmp ShowLED4

ShowLED1:
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000110
    sts 0x0624, r16
    ret

ShowLED2:
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000101
    sts 0x0624, r16
    ret

ShowLED3:
    ldi r16, 0b10000000
    sts 0x0604, r16
    ldi r16, 0b00000011
    sts 0x0624, r16
    ret

ShowLED4:
    ldi r16, 0b00000000
    sts 0x0604, r16
    ldi r16, 0b00000111
    sts 0x0624, r16
    ret

; DELAY: ~125ms x r22 at 2MHz clock
;
; Calculation:
;   Inner loop  (r17 = 0..255): 256 x 4 cycles  =   1.024 cycles
;   Middle loop (r18 = 0..255): 256 x 1.024     = 262.144 cycles
;   Outer loop  (r19 = r22):    r22 x 262.144 cycles
;   r22=1 -> ~131ms  (fastest)
;   r22=2 -> ~262ms  (default)
;   r22=5 -> ~655ms  (slowest)
Delay:
    mov r19, r22              ; copy speed level into r19

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