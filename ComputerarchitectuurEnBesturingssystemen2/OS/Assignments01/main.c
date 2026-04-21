/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "hwconfig.h"

#include "DriverSysClk.h"
#include "DriverUSART.h"
#include "DriverCursorStick.h"
#include "DriverMotor.h"
#include "DriverPower.h"
#include "DriverTwiMaster.h"
#include "DriverAdc.h"
#include "DriverLed.h"

#include <util/delay.h>

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

void SimpleFunction(void);		// A simple function: print a counter (0 to 9) to the terminal
void RunningLight(void);		// Running light loop
void CheckCursorstick(void);	// Check cursorstick and print direction
void TestMotor(void);			// Test motor driver with user input
void sendByte(uint8_t value);	// Send one raw byte on USART

void init(void) { 				// Initialize drivers
	DriverSysClkXtalInit();		// Clock init
	DriverUSARTInit();			// USART init and link to stdio
	DriverPowerInit();			// Initialize aux power driver
	DriverPowerVccAuxSet(1);	// Enable Auxillary power line
	DriverTWIMInit();			// Initialize TWI in master mode
	DriverCursorstickInit();	// Initialize cursor stick
	DriverLedInit();			// Initialize LED's
	DriverAdcInit();			// Initialize ADC driver
	DriverMotorInit();			// Initialize motor driver
}

int main(void) {
	init();
	_delay_ms(500);

	while(1) {

	}
	return 0;
}