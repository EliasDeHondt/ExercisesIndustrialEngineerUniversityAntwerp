/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include <avr/io.h>
#include "Driverpl9823.h"
#include <FreeRTOS.h>
#include <task.h>

void DriverPL9823BitbangSet(uint32_t FrontLeft,uint32_t FrontRight,uint32_t RearRight,uint32_t RearLeft);

void DriverPL9823Init() {
	PORTA.DIRSET=1<<6;
	PORTA.OUTCLR=1<<6;
	PORTD.DIRSET=1<<3;
	PORTD.OUTSET=1<<3;
}

void DriverPL9823Set(uint32_t FrontLeft,uint32_t FrontRight,uint32_t RearRight,uint32_t RearLeft) {
	PORTA.OUTSET=1<<6;
	DriverPL9823BitbangSet(FrontLeft, FrontRight, RearRight, RearLeft);
	PORTA.OUTCLR=1<<6;
}