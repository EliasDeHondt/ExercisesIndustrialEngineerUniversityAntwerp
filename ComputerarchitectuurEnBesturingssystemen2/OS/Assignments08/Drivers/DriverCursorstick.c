#include "DriverCursorstick.h"

void DriverCursorstickInit(void)
{
	PORTB.DIR = PORTB.DIR | 0b00000000; // pin 3-7 als input
	// 0b01011000 = INVEN = 1 (invert input), OPC[2:0] = 011 (totem pole + pull up) (output config) 
	PORTB.PIN3CTRL = 0b01011000;
	PORTB.PIN4CTRL = 0b01011000;
	PORTB.PIN5CTRL = 0b01011000;
	PORTB.PIN6CTRL = 0b01011000;
	PORTB.PIN7CTRL = 0b01011000;
}

uint8_t reverseBits(uint8_t b)
{
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4; // swap nibbles
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2; // swap pairs
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1; // swap individual bits
    return b;
}

uint8_t DriverCursorstickGet(void)
{
    return reverseBits(PORTB.IN & 0xF8); // mask naar pins 3-7, pin 0-2 zijn voor dit niet belangrijk, daarna reverse voor juiste output.
	// Input:
	//  B7  B6  B5  B4  B3  B2  B1  B0
	// SWC SWR SWD SWL SWU  /   /   /
	// Output:
	//  B7  B6  B5  B4  B3  B2  B1  B0
	//  /   /   /  SWU SWL SWD SWR SWC
}