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

char text[32];
char i;

void SimpleFunction(void);		// A simple function: print a counter (0 to 9) to the terminal
void RunningLight(void);		// Running light loop
void CheckCursorstick(void);	// Check cursorstick and print direction
void TestMotor(void);			// Test motor driver with user input
void sendByte(uint8_t value);	// Send one raw byte on USART

void init(void) {
	// Initialize drivers
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
		//SimpleFunction(); 		// Excercise 1
		//RunningLight();			// Excercise 2
		//CheckCursorstick();		// Excercise 3
		TestMotor();				// Excercise 4 and 5
		sendByte(0x55);				// Exercise 6 (0x55 = 0b01010101, alternating bits to make signal visible on oscilloscope)
	}
	return 0;
}

void SimpleFunction(void) {
	for (i=0; i<10; i++) {
		sprintf(text, "Counter:%d\r", i);
		puts(text);
	}
}

void RunningLight(void) {
	// Mapping:
	//	0x01 = Led D4 (0x01 = 0b00000001)
	//	0x02 = Led D5 (0x02 = 0b00000010)
	//	0x04 = Led D6 (0x04 = 0b00000100)
	//	0x08 = Led D7 (0x08 = 0b00001000)
	const uint8_t runningLightPattern[] = {0x01, 0x02, 0x04, 0x08};
	static uint8_t step = 0;
	int patternSize = 4;

	DriverLedWrite(runningLightPattern[step]);
	step = (step + 1) % patternSize;
	_delay_ms(100);
}

void CheckCursorstick(void) {
	// Read cursorstick state
	// Mapping:
	// 	B4 = SWU
	//	B3 = SWL
	//	B2 = SWD
	//	B1 = SWR
	//	B0 = SWC
	uint8_t stick = DriverCursorstickGet();
	static uint8_t prevStick = 0;

	if (stick != prevStick) { // Only print when state changes (edge detection)
		if (stick & 0x10) puts("UP\r");       // B4 = SWU (0x10 = 0b00010000)
		if (stick & 0x08) puts("LEFT\r");     // B3 = SWL (0x08 = 0b00001000)
		if (stick & 0x04) puts("DOWN\r");     // B2 = SWD (0x04 = 0b00000100)
		if (stick & 0x02) puts("RIGHT\r");    // B1 = SWR (0x02 = 0b00000010)
		if (stick & 0x01) puts("CENTER\r");   // B0 = SWC (0x01 = 0b00000001)
		prevStick = stick;
	}
}

void TestMotor(void) {
	static uint8_t speedConfigured = 0;
	static int16_t speed = 0;
	EncoderStruct encoderPos;

	if (!speedConfigured) {
		puts("Enter speed [-3000, +3000]: ");
		if (scanf("%d", &speed) == 1) {
			DriverMotorSet(speed, speed); // Apply same speed to both motors
			sprintf(text, "Speed set to: %d\r", speed);
			puts(text);
			speedConfigured = 1;
		}
	}

	// Continuously print encoder values so wheel rotation is immediately visible.
	encoderPos = DriverMotorGetEncoder();
	sprintf(text, "Encoder A: %d, Encoder B: %d\r", encoderPos.Cnt1, encoderPos.Cnt2);
	puts(text);
	_delay_ms(100);
}

void sendByte(uint8_t value) { // Simple function to send a byte over USART
	putchar(value);
}