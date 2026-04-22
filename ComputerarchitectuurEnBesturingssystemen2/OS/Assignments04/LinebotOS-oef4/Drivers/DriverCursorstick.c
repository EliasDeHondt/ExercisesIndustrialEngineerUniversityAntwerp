/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverCursorstick.h"

void DriverCursorstickInit(void) {
	// Configure PB3-PB7 as inputs
	PORTB.DIRCLR = 0xF8;  // Clear bits 3-7 (0xF8 = 0b11111000) -> input

	// Enable pull-up and invert on PB3-PB7
	// Invert: pressed switch = '1' in PORTB.IN
	// Pull-up: ensures stable signal when switch is not pressed
	PORTB.PIN3CTRL = PORT_INVEN_bm | PORT_OPC_PULLUP_gc;  // SWU (Up)
	PORTB.PIN4CTRL = PORT_INVEN_bm | PORT_OPC_PULLUP_gc;  // SWL (Left)
	PORTB.PIN5CTRL = PORT_INVEN_bm | PORT_OPC_PULLUP_gc;  // SWD (Down)
	PORTB.PIN6CTRL = PORT_INVEN_bm | PORT_OPC_PULLUP_gc;  // SWR (Right)
	PORTB.PIN7CTRL = PORT_INVEN_bm | PORT_OPC_PULLUP_gc;  // SWC (Center)
}

uint8_t DriverCursorstickGet(void) {
	// Read PORTB.IN and remap bits according to specification:
	// B4: SWU (PB3)
	// B3: SWL (PB4)
	// B2: SWD (PB5)
	// B1: SWR (PB6)
	// B0: SWC (PB7)
	uint8_t portb = PORTB.IN;
	uint8_t result = 0;

	if (portb & (1 << 3)) result |= (1 << 4);  // PB3 (SWU) -> bit 4
	if (portb & (1 << 4)) result |= (1 << 3);  // PB4 (SWL) -> bit 3
	if (portb & (1 << 5)) result |= (1 << 2);  // PB5 (SWD) -> bit 2
	if (portb & (1 << 6)) result |= (1 << 1);  // PB6 (SWR) -> bit 1
	if (portb & (1 << 7)) result |= (1 << 0);  // PB7 (SWC) -> bit 0

	return result;
}