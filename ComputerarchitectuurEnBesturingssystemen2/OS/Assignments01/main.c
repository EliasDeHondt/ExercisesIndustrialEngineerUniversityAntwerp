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
#include <avr/interrupt.h>

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Global variables for running light
volatile uint8_t runningLightPosition = 0;		// Current LED position (0-3)
volatile int8_t runningLightDirection = 1;		// Direction: 1 = right, -1 = left
volatile uint8_t runningLightActive = 1;		// 1 = running, 0 = stopped
volatile uint8_t runningLightTick = 0;			// Flag set by ISR to update display

// Input buffer
char inputBuffer[50];
uint8_t inputIndex = 0;

void SimpleFunction(void);		// A simple function: print a counter (0 to 9) to the terminal
void RunningLight(void);		// Running light loop
void CheckCursorstick(void);	// Check cursorstick and print direction
void TestMotor(void);			// Test motor driver with user input
void sendByte(uint8_t value);	// Send one raw byte on USART

// USART RXC interrupt handler - triggers when character received
ISR(USART_RXC_vect) {
	char c = USART.DATA;  // Read received character

	if (c == '\r' || c == '\n') {
		// End of command - process it
		inputBuffer[inputIndex] = '\0';

		if (inputIndex > 0) {
			// Process commands
			if (strcmp(inputBuffer, "looplicht_links") == 0) {
				runningLightDirection = -1;
				printf("\n>>> DIR: LEFT\r\n");
			}
			else if (strcmp(inputBuffer, "looplicht_rechts") == 0) {
				runningLightDirection = 1;
				printf("\n>>> DIR: RIGHT\r\n");
			}
			else {
				printf("\n>>> UNKNOWN: '%s'\r\n", inputBuffer);
			}
		}

		// Reset for next command
		inputIndex = 0;
		printf("Input> ");
		fflush(stdout);
	}
	else if (inputIndex < sizeof(inputBuffer) - 1) { // Store character in buffer
		inputBuffer[inputIndex++] = c;
		printf("%c", c);  // Echo character
		fflush(stdout);
	}
}

ISR(TCE0_OVF_vect) { // Timer interrupt handler - called every 500ms
	if (runningLightActive) {
		// Simple position update
		if (runningLightDirection == 1) {
			runningLightPosition++;
			if (runningLightPosition > 3) runningLightPosition = 0;
		} else {
			if (runningLightPosition == 0) runningLightPosition = 3;
			else runningLightPosition--;
		}

		// Set the LED (position 0-3 maps to bit 0-3)
		uint8_t ledPattern = (1 << runningLightPosition);
		DriverLedWrite(ledPattern);

		// Set flag for main loop
		runningLightTick = 1;
	}
}

void init(void) { // Initialize drivers
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

void InitRunningLightTimer(void) {
	// Configure TCE0 (Timer C Event 0) for 500ms interrupt
	// F_CPU = 32MHz
	// Prescaler DIV1024 = 32MHz / 1024 = 31.25 kHz
	// For 500ms: 31.25 kHz * 0.5s = 15625 counts
	// But we'll use 16000 for easier numbers (close to 500ms)

	TCE0.CTRLA = 0;                           // Stop timer first
	TCE0.CTRLB = 0;                           // Normal mode
	TCE0.CTRLD = 0;                           // Event control
	TCE0.CNT = 0;                             // Reset counter
	TCE0.PER = 16000;                         // Set period (approx 500ms with 32MHz/1024)
	TCE0.INTCTRLA = TC_OVFINTLVL_LO_gc;      // Enable overflow interrupt at low priority
	TCE0.CTRLA = TC_CLKSEL_DIV1024_gc;       // START timer with prescaler 1024

	// Enable USART RXC (receive complete) interrupt for command input
	USART.CTRLA |= USART_RXCINTLVL_LO_gc;    // Enable RXC interrupt at low priority

	PMIC.CTRL |= PMIC_LOLVLEN_bm;            // Enable low-level interrupts in PMIC
	sei();                                     // Enable global interrupts

	printf("[INIT] Timer and USART interrupts enabled\r\n\r\n");
}

void RunningLight(void) {
	InitRunningLightTimer();

	printf("\r\n\r\n");
	printf("=====================================\r\n");
	printf("  RUNNING LIGHT - NON-BLOCKING\r\n");
	printf("=====================================\r\n");
	printf("Commands:\r\n");
	printf("  looplicht_links\r\n");
	printf("  looplicht_rechts\r\n");
	printf("=====================================\r\n\r\n");

	inputIndex = 0;
	printf("Input> ");
	fflush(stdout);

	uint8_t tickCounter = 0;
	DriverLedWrite(1 << runningLightPosition); // Light the first LED

	// Main loop - non-blocking, interrupt-driven
	while(1) {
		// Check if timer tick occurred
		if (runningLightTick) {
			runningLightTick = 0;
			tickCounter++;

			const char* dirStr = (runningLightDirection == 1) ? "RIGHT" : "LEFT";
			printf("[TICK %2d] Pos: %d | %s\r\n", tickCounter, runningLightPosition, dirStr);
			fflush(stdout);
		}

		// Sleep a bit to prevent burning CPU
		_delay_ms(10);
	}
}

int main(void) {
	init();
	_delay_ms(500);
	RunningLight();  // Start the running light with timer interrupt
	return 0;
}