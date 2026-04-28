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

static void RecursiveStackTest(uint8_t depth, uint8_t maxDepth) {
	uint8_t localVar1 = depth;
	uint16_t localVar2 = depth * 100;
	uint32_t localVar3 = depth * 10000;
	uint8_t localBuffer[16];

	for (uint8_t i = 0; i < 16; i++) localBuffer[i] = depth * 10 + i;

	TaskHandle_t currentTaskHandle = xTaskGetCurrentTaskHandle();
	TaskStatus_t taskStatus;
	vTaskGetTaskInfo(currentTaskHandle, &taskStatus, pdTRUE, eInvalid);

	uint16_t freeStackWords = taskStatus.usStackHighWaterMark;
	uint16_t freeStackBytes = freeStackWords * sizeof(StackType_t);
	
	uint16_t stackPointer = (uint16_t)&localVar1;

	printf("\r\n");
	printf("========================================\r\n");
	printf("[RECURSIE DIEPTE %d] Stack allocatie test\r\n", depth);
	printf("========================================\r\n");
	printf("Task Control Block (TCB):\r\n");
	printf("  - Task handle (TCB adres): 0x%04X  <-- GEBRUIK DEZE VOOR MEMORY WINDOW\r\n", (uint16_t)currentTaskHandle);
	printf("  - Task naam: %s\r\n", taskStatus.pcTaskName);
	printf("\r\nStack informatie:\r\n");
	printf("  - Vrije stack (High Water Mark): %u woorden = %u bytes\r\n", freeStackWords, freeStackBytes);
	printf("  - Stack pointer (benaderd): 0x%04X\r\n", stackPointer);
	printf("\r\nLokale variabelen (op stack):\r\n");
	printf("  - var1 (uint8_t)  adres: 0x%04X waarde: %3u\r\n", (uint16_t)&localVar1, localVar1);
	printf("  - var2 (uint16_t) adres: 0x%04X waarde: %5u\r\n", (uint16_t)&localVar2, localVar2);
	printf("  - var3 (uint32_t) adres: 0x%04X waarde: %7lu\r\n", (uint16_t)&localVar3, localVar3);
	printf("  - buffer[0]       adres: 0x%04X waarde: 0x%02X\r\n", (uint16_t)&localBuffer[0], localBuffer[0]);
	printf("  - buffer[15]      adres: 0x%04X waarde: 0x%02X\r\n", (uint16_t)&localBuffer[15], localBuffer[15]);
	
	printf("\r\nStack groei richting:\r\n");
	if (depth > 1) {
		printf("  - Adressen worden LAGER naarmate recursie dieper gaat\r\n");
		printf("  - (Stack groeit van HOOG naar LAAG geheugen)\r\n");
	}

	asm("nop");  // Line for breakpoint

	if (depth < maxDepth) {
		RecursiveStackTest(depth + 1, maxDepth);
	} else {
		printf("\r\n[INFO] Maximale diepte (%d) bereikt. Stack test voltooid.\r\n", maxDepth);
		printf("[INFO] Teruggaan naar diepte 1...\r\n");
	}
}

void InitTerminalTask() {
	xTaskCreate( WorkerTerminal, "term", 1024, NULL, tskIDLE_PRIORITY+4, NULL );	
}

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
	uint8_t MenuMode = 0;
	
	printf("\r\n\r\n=== OEFENING 5 - STACK ALLOCATIE EN RECURSIE ===\r\n");
	printf("\r\nKies een optie:\r\n");
	printf("  1 - Dynamische geheugenallocatie (heap)\r\n");
	printf("  2 - Recursieve functie stack test\r\n");
	printf("  0 - Exit\r\n");
	printf("Keuze: ");
	
	while(1) {
		Char = getchar();
		if (Char == '\r' || Char == '\n') {
			if (InputIdx > 0) {
				InputBuffer[InputIdx] = '\0';
				printf("\r\n");

				AllocationSize = ParseInteger(InputBuffer);

				if (MenuMode == 0) {
					if (AllocationSize == 1) {
						MenuMode = 1;
						printf("\r\n=== DYNAMISCHE GEHEUGENALLOCATIE ===\r\n");
						printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om terug naar menu):\r\n");
					}
					else if (AllocationSize == 2) {
						MenuMode = 2;
						printf("\r\n=== RECURSIEVE STACK ALLOCATIE TEST ===\r\n");
						printf("Voer recursie-diepte in (1-10, 0 om terug naar menu):\r\n");
					}
					else if (AllocationSize == 0) {
						printf("\r\nAfsluitende...\r\n");
						break;
					}
					else {
						printf("Ongeldige keuze. Kies 0, 1 of 2:\r\n");
					}
				}
				else if (MenuMode == 1) {
					if (AllocationSize == -1) {
						printf("\r\nTeruggaan naar hoofd menu...\r\n");
						MenuMode = 0;
						printf("\r\nKies een optie:\r\n");
						printf("  1 - Dynamische geheugenallocatie (heap)\r\n");
						printf("  2 - Recursieve functie stack test\r\n");
						printf("  0 - Exit\r\n");
						printf("Keuze: ");
					}
					else if (AllocationSize == 0) {
						printf("\r\nHuidige geheugenkaart:\r\n");
						MemMap();
						printf("\r\nVoer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om terug naar menu):\r\n");
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
							printf("  - Werkelijke allocatie: %u bytes (overhead: %d bytes)\r\n", ActualAllocation, Overhead);
							
							AllocationCount++;
							if (AllocationCount >= 10) {
								printf("\r\nMaximum allocaties bereikt (10)!\r\n");
								AllocationCount = 0;
								printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om terug naar menu):\r\n");
							}
							else {
								printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om terug naar menu):\r\n");
							}
						}
						else {
							printf("\r\n[FOUT] Allocatie van %u bytes mislukt!\r\n", AllocationSize);
							printf("Vrij geheugen: %u bytes\r\n", xPortGetFreeHeapSize());
							printf("Voer allocatiegrootte in bytes in (0 om memmap te tonen, -1 om terug naar menu):\r\n");
						}
					}
					else if (AllocationSize < 0) {
						printf("\r\nOngeldige waarde. Voer -1 om terug of 0+ voor allocatie:\r\n");
					}
					else {
						printf("\r\nOngeldige waarde. Voer een positief getal in:\r\n");
					}
				}
				else if (MenuMode == 2) {
					if (AllocationSize == 0) {
						printf("\r\nTeruggaan naar hoofd menu...\r\n");
						MenuMode = 0;
						printf("\r\nKies een optie:\r\n");
						printf("  1 - Dynamische geheugenallocatie (heap)\r\n");
						printf("  2 - Recursieve functie stack test\r\n");
						printf("  0 - Exit\r\n");
						printf("Keuze: ");
					}
					else if (AllocationSize > 0 && AllocationSize <= 10) {
						printf("\r\nStack test starten met diepte %d...\r\n", AllocationSize);
						printf("(Plaats breakpoints op regel met 'asm(\"nop\")' voor debugging)\r\n");
						vTaskDelay(100);

						RecursiveStackTest(1, (uint8_t)AllocationSize);

						printf("\r\n\r\nWil je nog een test uitvoeren?\r\n");
						printf("Voer recursie-diepte in (1-10, 0 om terug naar menu):\r\n");
					}
					else if (AllocationSize < 0 || AllocationSize > 10) {
						printf("\r\nOngeldige diepte. Voer 1-10 in (0 om terug naar menu):\r\n");
					}
					else {
						printf("\r\nOngeldige waarde. Voer 1-10 in (0 om terug naar menu):\r\n");
					}
				}

				InputIdx = 0;
			}
		}
		else if (Char == '\b' || Char == 0x7F) {
			if (InputIdx > 0) {
				InputIdx--;
				printf("\b \b");
			}
		}
		else if (isdigit((unsigned char)Char) || Char == '-') {
			if (InputIdx < sizeof(InputBuffer) - 1) {
				InputBuffer[InputIdx++] = Char;
				printf("%c", Char);
			}
		}
		vTaskDelay(10);
	}

	for (uint8_t i = 0; i < AllocationCount; i++) vPortFree(AllocatedPtrs[i]);
	vTaskSuspend(NULL);
}
