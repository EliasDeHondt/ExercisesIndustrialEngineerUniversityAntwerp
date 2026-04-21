/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "PinGuard.h"
#include <util/delay.h>
#include <stdio.h>

static uint8_t PinGuardInitComplete=0;

void PinGuardAlert();

void PinGuardAlert() {
	PORTA.DIRSET=0b10000000;
	PORTB.DIRSET=0b00000111;
	while(1) {
		PORTA.OUTSET=0b10000000;
		PORTB.OUTSET=0b00000111;
		_delay_ms(500);
		PORTA.OUTCLR=0b10000000;
		PORTB.OUTCLR=0b00000111;
		_delay_ms(500);
	}
}

void PinGuardDIR(void) {
	if ((PORTA.DIR & 0b01100000)!=0b01100000 || (PORTB.DIR & 0b11111000)!=0b11111000) PinGuardAlert();
}

void PinGuardPort(void) {
	if (PinGuardInitComplete!=1) return;
	if ((PORTA.OUT & 0b01000000)!=0b01000000) PinGuardAlert();
}

void PinGuardInit(void) {
	PORTA.DIR=0b01100000;
	PORTA.OUT=0b01000000;
	PORTB.DIR=0b11111000;
	PinGuardInitComplete=1;
}