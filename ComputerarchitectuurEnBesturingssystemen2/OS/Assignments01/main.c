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
#include <avr/io.h>
#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char leds_left_right[34];
volatile uint8_t direction = 0;
volatile uint8_t led_position = 0b0001;

int main(void)
{
	//###1###
	// Initialisatie van alle submodules. Elke submodule komt ruwweg met een hardware
	// module overeen. Deze submodules zullen in de loop van de zittingen ingevuld worden

	//Initialize drivers
	DriverSysClkXtalInit();	//Clock init
	DriverUSARTInit();		//USART init and link to stdio
	DriverPowerInit();		//Initialize aux power driver
	DriverPowerVccAuxSet(1);//Enable Auxillary power line
	DriverTWIMInit();		//Initialize TWI in master mode
	DriverCursorstickInit();//Initialize cursor stick
	DriverLedInit();		//Initialize LED's
	DriverAdcInit();		//Initialize ADC driver
	DriverMotorInit();		//Initialize motor driver
	sei(); // globale interrupts aanzetten

	//oef 1: looplicht
	char led = 0b1000;


	while(1)
	{
		//oef 2:
		DriverLedWrite(led);
		_delay_ms(500); // 1 stap verder
		if(led == 0b1000){
			led = 0b0001;
			}else{
			led = led << 1;
		}

		// tekst commando's
		if (strcmp(leds_left_right, "looplicht_links") == 0)
		{
			direction = 1;
		}
		else if (strcmp(leds_left_right, "looplicht_rechts") == 0)
		{
			direction = 0;
		}
	}

	return 0;
}

// interrupt met Timer Counter
void Timer1Init(void)
{
	TCC1.CTRLB   = TC_WGMODE_NORMAL_gc;       // Normal mode
	TCC1.PER     = 7811;                       // 500 ms bij 16 MHz, prescaler 1024
	TCC1.INTCTRLA= TC_OVFINTLVL_LO_gc;        // Overflow interrupt, low level
	TCC1.CTRLA   = TC_CLKSEL_DIV1024_gc;      // Prescaler 1024, start timer
}
ISR(TIMER1_COMPA_vect){
	DriverLedWrite(led_position);

	if (direction == 0) // looplicht rechts
	{
		led_position = led_position << 1;
		if (led_position == 0){
			led_position = 0b0001;
		}
	}
	else // looplicht links
	{
		led_position = led_position >> 1;
		if (led_position == 0){
			led_position = 0b1000;
		}
	}
}
