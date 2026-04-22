#include "memtask.h"
#include "hwconfig.h"

#include "util/delay.h"

#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"

#include "memmap.h"

extern volatile int Var1;
extern volatile int Var2;

void WorkerMemTask(void *pvParameters);
void MemFunction();

void InitMemTask(){
	xTaskCreate( WorkerMemTask, "mem", 1024, NULL, tskIDLE_PRIORITY+1, NULL );
}

void WorkerMemTask(void *pvParameters) {	
	int var4;
	static int var5;
	static int var6=10;

	printf("\r\n=== OEFENING 4A - GEHEUGENADDRESSEN ===\r\n");
	printf("Globale variabelen:\r\n");
	printf("  Var1 adres: 0x%04X\r\n", (uint16_t)&Var1);
	printf("  Var2 adres: 0x%04X\r\n", (uint16_t)&Var2);
	printf("\r\nLokale variabelen in WorkerMemTask():\r\n");
	printf("  Var4 adres: 0x%04X (lokaal)\r\n", (uint16_t)&var4);
	printf("  Var5 adres: 0x%04X (static)\r\n", (uint16_t)&var5);
	printf("  Var6 adres: 0x%04X (static geïnitialiseerd)\r\n", (uint16_t)&var6);

	printf("\r\nGeheugenmapping:\r\n");
	MemMap();

	vTaskSuspend(NULL);
}