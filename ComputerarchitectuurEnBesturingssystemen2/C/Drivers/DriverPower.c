/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverPower.h"

void DriverPowerInit(void) {
	PORTC.DIRSET=1<<5;
}

void DriverPowerVccAuxSet(uint8_t State) {
	if (State) PORTC.OUTSET=1<<5;
	else PORTC.OUTCLR=1<<5;
}