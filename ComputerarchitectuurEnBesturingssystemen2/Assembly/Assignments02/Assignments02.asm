; -----------------------------------------------
; @author EliasDH Team
; @see    https://eliasdh.com
; @since  01/01/2025
;
; PL9823 RGB LED control - first LED only
; Protocol: single wire, strict timing at 32MHz
;
; Hardware connections:
;   PA6 = PL9823-CS  -> HIGH to enable LEDs
;   PD3 = MOSI data  -> actual data line to PL9823
;
; Register map:
;   PORTA_DIR    = 0x0600
;   PORTA_OUT    = 0x0604
;   PORTC_DIR    = 0x0640
;   PORTC_OUT    = 0x0644
;   PORTD_DIR    = 0x0680
;   PORTD_OUTSET = 0x0685  (PD3 high)
;   PORTD_OUTCLR = 0x0686  (PD3 low)
;
; Timing at 32MHz (1 cycle = 31.25ns):
;   T0H = 0.35us =  11 cycles
;   T0L = 1.36us =  44 cycles
;   T1H = 1.36us =  44 cycles
;   T1L = 0.35us =  11 cycles
;   RES = 50us   = 1600 cycles
;
; Register usage:
;   r16 = general purpose (temp)
;   r17 = reset delay counter (inner)
;   r18 = reset delay counter (outer)
;   r23 = byte to send
;   r24 = bit counter
;   r25 = PD3 pin mask (0x08)
;   r26 = Red   value
;   r27 = Green value
;   r28 = Blue  value
;
; -----------------------------------------------
; Algorithm:
;
; 1. ClockInit: external 16MHz xtal + PLL x2 = 32MHz
; 2. Init: PC5 high (enable), PA6 high (CS enable),
;          PD3 output (data), send Reset first
; 3. Main: load color, SendRGB, Reset, repeat
; 4. SendRGB: send R, G, B bytes via SendByte
; 5. SendByte: 8 bits MSB first via carry flag
; 6. SendBit0: T0H=11 cycles HIGH, T0L=44 cycles LOW
; 7. SendBit1: T1H=44 cycles HIGH, T1L=11 cycles LOW
; 8. Reset: PD3 low >= 50us
; -----------------------------------------------

.CSEG
ClockInit:
    ldi r16, 0b11001011
    sts osc_xoscctrl, r16     ; external 16MHz crystal

    ldi r16, 0b01000
    sts osc_ctrl, r16         ; enable external oscillator

WaitXOSC:
    lds r16, osc_status
    sbrs r16, 3               ; wait for XOSCRDY (bit3)
    rjmp WaitXOSC

    ldi r16, 0b11000010
    sts osc_pllctrl, r16      ; PLL source = xosc x2 = 32MHz

    ldi r16, 0b00011000
    sts osc_ctrl, r16         ; enable PLL + external osc

WaitPLL:
    lds r16, osc_status
    sbrs r16, 4               ; wait for PLLRDY (bit4)
    rjmp WaitPLL

    ldi r16, 0xD8
    sts cpu_ccp, r16          ; CCP unlock
    ldi r16, 4
    sts CLK_CTRL, r16         ; select PLL -> 32MHz
    ret

; INIT: enable signals + PD3 setup + first reset
Init:
    rcall ClockInit           ; 32MHz first!

    ; --- PC5 HIGH: enable power to PL9823 LEDs ---
    ldi r16, 0b00100000
    sts 0x0640, r16           ; PORTC_DIR -> PC5 output
    sts 0x0644, r16           ; PORTC_OUT -> PC5 high (enable!)

    ; --- PA6 HIGH: CS enable for PL9823 ---
    lds r16, 0x0600
    ori r16, 0x40             ; bit 6 = PA6
    sts 0x0600, r16           ; PORTA_DIR -> PA6 output
    lds r16, 0x0604
    ori r16, 0x40
    sts 0x0604, r16           ; PORTA_OUT -> PA6 high (CS!)

    ; --- PD3 as output (actual data line) ---
    lds r16, 0x0680
    ori r16, 0x08             ; bit 3 = PD3
    sts 0x0680, r16           ; PORTD_DIR -> PD3 output

    ; --- PD3 LOW (idle state) ---
    ldi r25, 0x08             ; PD3 mask -> stays in r25
    sts 0x0686, r25           ; PORTD_OUTCLR -> PD3 low

    ; --- Reset before first data ---
    rcall Reset

; MAIN: send color to first PL9823, repeat
Main:
    ldi r26, 0xFF             ; Red   = 255
    ldi r27, 0x00             ; Green = 0
    ldi r28, 0x00             ; Blue  = 0

    rcall SendRGB
    rcall Reset

    jmp Main

; SENDRGB: send 24 bits (R, G, B)
SendRGB:
    mov r23, r26
    rcall SendByte            ; Red

    mov r23, r27
    rcall SendByte            ; Green

    mov r23, r28
    rcall SendByte            ; Blue
    ret

; SENDBYTE: send 8 bits MSB first
SendByte:
    ldi r24, 8

SB_Loop:
    rol r23                   ; MSB -> carry
    brcs SB_Bit1
    rcall SendBit0
    rjmp SB_Next
SB_Bit1:
    rcall SendBit1
SB_Next:
    dec r24
    brne SB_Loop
    ret

; SENDBIT0: T0H=11 cycles HIGH, T0L=44 cycles LOW
; No inversion on PD3 (direct connection)
; HIGH: sts(2) + 9 nops        = 11 cycles
; LOW:  sts(2) + 32 nops + ret(4) ~= 44 cycles
SendBit0:
    sts 0x0685, r25           ; PD3 high (T0H start)
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 9 nops -> T0H = 11 cycles

    sts 0x0686, r25           ; PD3 low (T0L start)
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 10
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 20
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 30
    nop
    nop                       ; 32 nops + ret(4) ~= T0L
    ret

; SENDBIT1: T1H=44 cycles HIGH, T1L=11 cycles LOW
; HIGH: sts(2) + 38 nops + ret(4) ~= 44 cycles
; LOW:  sts(2) + 5 nops  + ret(4) ~= 11 cycles
SendBit1:
    sts 0x0685, r25           ; PD3 high (T1H start)
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 10
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 20
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 30
    nop
    nop
    nop
    nop
    nop
    nop
    nop
    nop                       ; 38 nops + ret(4) ~= T1H ✓

    sts 0x0686, r25           ; PD3 low (T1L start)
    nop
    nop
    nop
    nop
    nop                       ; 5 nops + ret(4) ~= T1L
    ret

; RESET: PD3 low >= 50us
; 2 x 256 x 4 = 2048 cycles > 1600
Reset:
    sts 0x0686, r25           ; PD3 low
    ldi r18, 2

ResetOuter:
    ldi r17, 0

ResetInner:
    inc r17
    cpi r17, 0
    brne ResetInner

    dec r18
    brne ResetOuter
    ret