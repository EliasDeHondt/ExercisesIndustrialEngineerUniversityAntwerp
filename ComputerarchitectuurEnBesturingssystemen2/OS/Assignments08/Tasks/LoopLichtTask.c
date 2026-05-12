/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "LoopLichtTask.h"

#include "FreeRTOS.h"
#include "FreeRTOSConfig.h"
#include "task.h"
#include "queue.h"
#include "hwconfig.h"
#include "DriverLed.h"

#include <util/delay.h>
#include <stdio.h>

static void LoopLichtTask(void *pvParameters);

void InitLoopLichtTask(void *pvParameters) {
	xTaskCreate( LoopLichtTask, "Leds", configMINIMAL_STACK_SIZE, pvParameters, tskIDLE_PRIORITY+4, NULL );
}

static void LoopLichtTask(void *pvParameters) {
	uint8_t leds = 1;
	TickType_t xLastWakeTime;
	const TickType_t xPeriod = pdMS_TO_TICKS(500);
	while (1) {
		uint8_t isDirectionRight = *(uint8_t *)pvParameters;
		DriverLedWrite(leds);
		if (leds == 1 && isDirectionRight == 0) leds = 8;
		else if(isDirectionRight == 0) leds = leds >> 1;
		else if (leds == 8 && isDirectionRight == 1) leds = 1;
		else leds = leds << 1;
		printf("Dit is een super lange string bedoelt voor een meting uit te voeren\n\r");
		vTaskDelayUntil(&xLastWakeTime, xPeriod);
	}
}