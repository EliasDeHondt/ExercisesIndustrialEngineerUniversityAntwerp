/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverSysClk.h"

#pragma GCC push_options
#pragma GCC optimize ("O2")

int8_t DriverSysClkXtalInit(void) {
    uint8_t Mult;
    if (F_XTAL<400E3) return -1;
    if (F_XTAL<=2E6) OSC.XOSCCTRL=0b00001011;
    else if(F_XTAL<=9E6) OSC.XOSCCTRL=0b01001011;
    else if(F_XTAL<=12E6) OSC.XOSCCTRL=0b10001011;
    else if(F_XTAL<=16E6) OSC.XOSCCTRL=0b11001011;
    else return -1;
    OSC.CTRL=0b01000;

    while (!(OSC.STATUS&0b1000)); 

	if (F_XTAL==F_CPU) {
		CCP=0xd8;
		CLK.CTRL=0b0011;
	}	
	else if (F_CPU>F_XTAL) {
		Mult=F_CPU/F_XTAL;
		if (Mult>31) return -1;
		if (F_XTAL * (uint32_t) Mult !=F_CPU) return -1;
		OSC.PLLCTRL=0b11000000 | (Mult);
		OSC.CTRL=0b00011000;

		while (!(OSC.STATUS & 0b00010000));

		CCP=0xd8;
		CLK.CTRL=0b100;
	}
	return 0;
}
#pragma GCC pop_options