#include "transfertask.h"
#include "hwconfig.h"

#include "util/delay.h"

#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"



static uint32_t Data=0;

//Private function prototypes
void WorkerSendTask(void *pvParameters);
void WorkerReceiveTask(void *pvParameters);

//Function definitions
void InitTransferTasks()
{
	xTaskCreate( WorkerSendTask, "sendtask", 256, NULL, tskIDLE_PRIORITY+1, NULL );
	xTaskCreate( WorkerReceiveTask, "receivetask", 256, NULL, tskIDLE_PRIORITY+2, NULL );
}

void WorkerSendTask(void *pvParameters)
{	
	while (1)
	{
		Data=0x10101010;
		Data=0x20202020;
	}
}

void WorkerReceiveTask(void *pvParameters)
{
	
	while(1)
	{
		if (Data!=0x10101010 && Data!=0x20202020) printf ("Invalid Data value:%lx \r\n",Data);		
		vTaskDelay(1);
	}
}