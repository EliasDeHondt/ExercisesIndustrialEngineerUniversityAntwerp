#include "memtask.h"
#include "hwconfig.h"

#include "util/delay.h"

#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"

#include "memmap.h"


//Private function prototypes
void WorkerMemTask(void *pvParameters);
void MemFunction();

//Function definitions
void InitMemTask()
{
	xTaskCreate( WorkerMemTask, "mem", 1024, NULL, tskIDLE_PRIORITY+1, NULL );
}

void WorkerMemTask(void *pvParameters)
{	
	int var4;
	static int var5;
	static int var6=10;
	printf ("Var4 adres:%x\r\n",&var4);
	printf ("Var5 adres:%x\r\n",&var5);
	printf ("Var6 adres:%x\r\n",&var6);
	MemMap();
	vTaskSuspend(NULL);
}


