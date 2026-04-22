#include "memtask.h"
#include "hwconfig.h"

#include "util/delay.h"

#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"


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
	while (1)
	{
		MemFunction();
		vTaskDelay(100);
	}
}

void MemFunction()
{
	int num[100];
	int a;
	
	for (a=0;a<100;a++)
	{
		num[a]=a;
	}
	printf ("Complete!\r\n");
	
}
