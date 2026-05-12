/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "TerminalTask.h"

#include "FreeRTOS.h"
#include "FreeRTOSConfig.h"
#include "task.h"
#include "queue.h"
#include "hwconfig.h"
#include "DriverLed.h"
#include "string.h"

#include <stdio.h>
#include <stdlib.h>
#include <util/delay.h>

static void TerminalTask(void *pvParameters);

void InitTerminalTask(void *pvParameters) {
	xTaskCreate( TerminalTask, "Terminal", configMINIMAL_STACK_SIZE, pvParameters, tskIDLE_PRIORITY+3, NULL );
}

static void TerminalTask(void *pvParameters) {
	char input[17];
	static char buffer[512];

	while (1) {
		vTaskGetRunTimeStats(&buffer);
		printf("%s", buffer);
		printf("Waiting on input...\n\r");
		scanf("%16s", input);
		if(strcmp(input, "looplicht_links") == 0) {
			*(uint8_t *)pvParameters = 0;
			} else if (strcmp(input, "looplicht_rechts") == 0) {
			*(uint8_t *)pvParameters = 1;
		}
	}
}