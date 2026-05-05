/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "hwconfig.h"

#include "FreeRTOS.h"
#include "task.h"

#include "DriverSysClk.h"
#include "DriverUSART.h"
#include "DriverCursorStick.h"
#include "DriverPower.h"
#include "DriverTwiMaster.h"
#include "DriverAdc.h"
#include "DriverLed.h"
#include "DriverMPU6050.h"
#include "DriverMotor.h"

#include "Tasks/RunningLightTask.h"
#include "Tasks/TerminalTask.h"
#include "Tasks/CursorstickTask.h"

#include <util/delay.h>

#include <stdio.h>
#include <stdlib.h>

uint8_t *ucHeap;

int initDrivers(void) { 		// Initialize all hardware drivers
	DriverSysClkXtalInit();		// Clock init
	DriverUSARTInit();			// USART init and link to stdio
	DriverTWIMInit();			// Initialize TWI in master mode
	DriverCursorstickInit();	// Initialize cursor stick
	DriverLedInit();			// Initialize LED's
	DriverPowerInit();			// Initialize aux power driver
	DriverAdcInit();			// Initialize ADC driver
	DriverPowerVccAuxSet(1);	// Enable Auxillary power line
	return 0;
}

int initTasks(void) {			// Initialize all FreeRTOS tasks
	InitRunningLightTask();		// Initialize running light task
	InitTerminalTask();			// Initialize terminal task
	InitCursorstickTask();		// Initialize cursorstick FIFO queue task
	return 0;
}

int main(void) {
	// Allocate FreeRTOS heap
	ucHeap=malloc(configTOTAL_HEAP_SIZE);
	if (ucHeap==NULL) while(1);

	// Enable interrupts
	PMIC.CTRL=0b111;		
	sei();

	initDrivers();
	initTasks();

	vTaskStartScheduler();		// Start scheduler loop
	return 0;
}