/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverLed.h"

void DriverLedInit(void) {
	// Configure PB0, PB1, PB2 as outputs
	PORTB.DIRSET = 0x07;  // Set bits 0-2 as output (0x07 = 0b00000111)

	// Configure PA7 as output
	PORTA.DIRSET = 0x80;  // Set bit 7 as output (0x80 = 0b10000000)

	// Enable invert on PB0, PB1, PB2 (active-low LEDs, so invert to make '1' = LED on)
	PORTB.PIN0CTRL = PORT_INVEN_bm;
	PORTB.PIN1CTRL = PORT_INVEN_bm;
	PORTB.PIN2CTRL = PORT_INVEN_bm;

	// Enable invert on PA7
	PORTA.PIN7CTRL = PORT_INVEN_bm;
}

void DriverLedWrite(uint8_t LedData) {
	// Map LedData bits 0-2 to PB0-PB2, bit 3 to PA7
	// Preserve other pins on both ports

	// PB0-PB2: Clear bits 0-2, then set based on LedData
	PORTB.OUT = (PORTB.OUT & 0xF8) | (LedData & 0x07); // (0xF8 = 0b11111000 & 0x07 = 0b00000111)

	// PA7: Clear bit 7, then set based on LedData bit 3
	PORTA.OUT = (PORTA.OUT & 0x7F) | ((LedData & 0x08) << 4); // (0x7F = 0b01111111 & 0x08 = 0b00001000)
}

void DriverLedSet(uint8_t LedData) { 		// Set LEDs where LedData bits are 1 (turn on)
	PORTB.OUTSET = (LedData & 0x07);        // Bits 0-2 to PB0-PB2
	PORTA.OUTSET = ((LedData & 0x08) << 4); // Bit 3 to PA7
}

void DriverLedClear(uint8_t LedData) { 		// Clear LEDs where LedData bits are 1 (turn off)
	PORTB.OUTCLR = (LedData & 0x07);        // Bits 0-2 to PB0-PB2
	PORTA.OUTCLR = ((LedData & 0x08) << 4); // Bit 3 to PA7
}

void DriverLedToggle(uint8_t LedData) { 	// Toggle LEDs where LedData bits are 1
	PORTB.OUTTGL = (LedData & 0x07);        // Bits 0-2 to PB0-PB2
	PORTA.OUTTGL = ((LedData & 0x08) << 4); // Bit 3 to PA7
}