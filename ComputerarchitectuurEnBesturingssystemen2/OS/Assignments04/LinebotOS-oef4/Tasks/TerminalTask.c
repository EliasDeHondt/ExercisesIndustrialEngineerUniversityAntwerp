/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "TerminalTask.h"

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <ctype.h>

#include "memmap.h"

static void WorkerTerminal(void *pvParameters);

void InitTerminalTask() {
	xTaskCreate( WorkerTerminal, "term", 1024, NULL, tskIDLE_PRIORITY+4, NULL );	
}

// Parse integer from string
static int16_t ParseInteger(const char *str) {
	int16_t result = 0;
	int16_t sign = 1;
	uint8_t i = 0;
	
	if (str[0] == '-') {
		sign = -1;
		i = 1;
	}
	
	while (str[i] != '\0' && isdigit((unsigned char)str[i])) {
		result = result * 10 + (str[i] - '0');
		i++;
	}
	
	return result * sign;
}

static void WorkerTerminal(void *pvParameters) {
	char InputBuffer[20];
	uint8_t AllocationCount = 0;
	uint8_t *AllocatedPtrs[10];
	size_t FreeHeapBefore, FreeHeapAfter;
	int16_t AllocationSize;
	uint8_t InputIdx = 0;
	char Char;
	
	printf("\r\n\r\n=== OEFENING 4 - DYNAMISCHE GEHEUGENALLOCATIE ===\r\n");
	printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit):\r\n");
	
	while(1) {
		// Read character-by-character from terminal
		Char = getchar();
		
		// Handle Enter key
		if (Char == '\r' || Char == '\n') {
			if (InputIdx > 0) {
				InputBuffer[InputIdx] = '\0';
				printf("\r\n");
				
				AllocationSize = ParseInteger(InputBuffer);
				
				if (AllocationSize == -1) {
					printf("\r\nAfsluitende memmap:\r\n");
					MemMap();
					break;
				}
				else if (AllocationSize == 0) {
					printf("\r\nHuidige geheugenkaart:\r\n");
					MemMap();
					printf("\r\nVoer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit):\r\n");
				}
				else if (AllocationSize > 0 && AllocationSize < 10000) {
					FreeHeapBefore = xPortGetFreeHeapSize();
					
					AllocatedPtrs[AllocationCount] = (uint8_t *) pvPortMalloc(AllocationSize);
					
					if (AllocatedPtrs[AllocationCount] != NULL) {
						FreeHeapAfter = xPortGetFreeHeapSize();
						uint16_t ActualAllocation = FreeHeapBefore - FreeHeapAfter;
						int16_t Overhead = ActualAllocation - AllocationSize;
						
						printf("\r\n[%d] Allocatie van %u bytes:\r\n", AllocationCount, AllocationSize);
						printf("  - Basisadres: 0x%04X\r\n", (uint16_t)AllocatedPtrs[AllocationCount]);
						printf("  - Vrij geheugen voor: %u bytes\r\n", FreeHeapBefore);
						printf("  - Vrij geheugen na: %u bytes\r\n", FreeHeapAfter);
						printf("  - Werkelijke allocatie: %u bytes (overhead: %d bytes)\r\n", 
							   ActualAllocation, Overhead);
						
						AllocationCount++;
						if (AllocationCount >= 10) {
							printf("\r\nMaximum allocaties bereikt (10)!\r\n");
							AllocationCount = 0;
							printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit):\r\n");
						}
						else {
							printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit):\r\n");
						}
					}
					else {
						printf("\r\n[FOUT] Allocatie van %u bytes mislukt!\r\n", AllocationSize);
						printf("Vrij geheugen: %u bytes\r\n", xPortGetFreeHeapSize());
						printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om exit):\r\n");
					}
				}
				else if (AllocationSize < 0) {
					printf("\r\nOngeldige waarde (negatief). Voer -1 om exit of 0+ voor allocatie:\r\n");
				}
				else {
					printf("\r\nOngeldige waarde. Voer een positief getal in:\r\n");
				}
				
				InputIdx = 0;
			}
		}
		// Handle backspace
		else if (Char == '\b' || Char == 0x7F) {
			if (InputIdx > 0) {
				InputIdx--;
				printf("\b \b");
			}
		}
		// Handle regular characters
		else if (isdigit((unsigned char)Char) || Char == '-') {
			if (InputIdx < sizeof(InputBuffer) - 1) {
				InputBuffer[InputIdx++] = Char;
				printf("%c", Char);
			}
		}
		
		vTaskDelay(10);
	}
	
	// Cleanup
	for (uint8_t i = 0; i < AllocationCount; i++) {
		vPortFree(AllocatedPtrs[i]);
	}
	
	vTaskSuspend(NULL);
}
