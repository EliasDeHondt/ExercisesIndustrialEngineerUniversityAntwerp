/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "hwconfig.h"
#include "RunningLightTask.h"

#include "FreeRTOS.h"
#include "task.h"

#include "DriverLed.h"

#include <util/delay.h>

volatile int8_t runningLightDirection = 1;

static volatile uint8_t runningLightPosition = 0;
static void WorkerRunningLight(void *pvParameters);

void InitRunningLightTask(void) {
	xTaskCreate(WorkerRunningLight, "RunningLight", configMINIMAL_STACK_SIZE, NULL, tskIDLE_PRIORITY + 1, NULL);
}

static void WorkerRunningLight(void *pvParameters) {
	while (1) {
		// Update position based on direction
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

		_delay_ms(500);
	}
}