; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; This code is a simple example of an infinite loop.
; That turns LED4 on and off on an ATmega384C3 microcontroller.
; -----------------------------------------------

.CSEG
Init:   ldi   r16,0b100000
        sts   0x0640,r16            ; PORTC
        sts   0x0644,r16
        ldi   r16,0b10000000
        sts   0x0600,r16            ; PORTA

Main:   sts   0x0607,r16
        ldi   r17,0
        ldi   r18,0

Loop:   inc   r17           ; Loop 1 if r17 = 0 else +1
        cpi   r17,0
        brne  Loop
        inc   r18           ; Loop 2 if r18 = 0 else +1
        cpi   r18,0
        brne  Loop
        jmp   Main