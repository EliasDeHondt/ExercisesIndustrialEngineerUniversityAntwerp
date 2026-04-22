/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "hwconfig.h"
#include "TerminalTask.h"

#include "FreeRTOS.h"
#include "task.h"

#include <stdio.h>
#include <string.h>

extern volatile int8_t runningLightDirection;

static void WorkerTerminal(void *pvParameters);

void InitTerminalTask(void) {
	// Stack grootte verhoogd met 512 bytes voor vTaskGetRunTimeStats() buffer
	xTaskCreate(WorkerTerminal, "Terminal", configMINIMAL_STACK_SIZE + 512, NULL, tskIDLE_PRIORITY + 1, NULL);
}

static void WorkerTerminal(void *pvParameters) {
	char inputBuffer[50];
	uint8_t inputIndex = 0;

	printf("Looplichttask gestart. Commando's:\r\n");
	printf("  links   - richting links\r\n");
	printf("  rechts  - richting rechts\r\n");
	printf("  stats   - CPU statistieken\r\n");
	printf("Input> ");
	fflush(stdout);

	while (1) {
		// Lees karakter van terminal
		int c = getchar();

		if (c == '\r' || c == '\n') {
			printf("\r\n");
			inputBuffer[inputIndex] = '\0';

			if (inputIndex > 0) {
				// Process commands
				if (strcmp(inputBuffer, "links") == 0) {
					runningLightDirection = -1;
					printf(">>> RICHTING: LINKS\r\n");
				}
				else if (strcmp(inputBuffer, "rechts") == 0) {
					runningLightDirection = 1;
					printf(">>> RICHTING: RECHTS\r\n");
				}
				else if (strcmp(inputBuffer, "stats") == 0) {
					// Buffer voor vTaskGetRunTimeStats() - 512 bytes
					char pcWriteBuffer[512];
					printf("\r\n=== CPU STATISTIEKEN ===\r\n");
					vTaskGetRunTimeStats(pcWriteBuffer);
					printf("%s\r\n", pcWriteBuffer);
				}
				else {
					printf(">>> ONBEKEND: '%s'\r\n", inputBuffer);
				}
			}

			// Reset for next command
			inputIndex = 0;
			printf("Input> ");
			fflush(stdout);
		}
		else if (inputIndex < sizeof(inputBuffer) - 1) {
			inputBuffer[inputIndex++] = c;
			printf("%c", c);  // Echo character
			fflush(stdout);
		}
	}
}
