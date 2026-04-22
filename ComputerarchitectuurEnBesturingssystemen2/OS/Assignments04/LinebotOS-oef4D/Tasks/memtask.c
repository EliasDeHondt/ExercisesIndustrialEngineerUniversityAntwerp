#include "memtask.h"
#include "hwconfig.h"

#include "util/delay.h"

#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"


//Private function prototypes
void WorkerMemTask(void *pvParameters);

//Function definitions
void InitMemTask()
{
	xTaskCreate( WorkerMemTask, "mem", 1024, NULL, tskIDLE_PRIORITY+1, NULL );
}

void WorkerMemTask(void *pvParameters)
{	
	int FreeMem;
	uint8_t *Block1, *Block2, *Block3, *Block4, *Block5, *Block6;
	int BlockSize;
	
	//Stap 1: geef grootte van de heap weer
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step1: Unallocated heap memory:%u\r\n",FreeMem);
	
	//Stap 2: verdeel de heap in 6 gelijke gealloceerde blokken
	BlockSize=(FreeMem-128)/6;
	printf ("Block size:%u\r\n",BlockSize);
	Block1=pvPortMalloc(BlockSize);
	Block2=pvPortMalloc(BlockSize);
	Block3=pvPortMalloc(BlockSize);
	Block4=pvPortMalloc(BlockSize);
	Block5=pvPortMalloc(BlockSize);
	Block6=pvPortMalloc(BlockSize);
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step2: Unallocated heap memory:%u\r\n",FreeMem);
	
	//Stap 3: Geef twee aanliggende blokken vrij
	vPortFree(Block1);
	vPortFree(Block2);
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step3: Unallocated heap memory:%u\r\n",FreeMem);
	
	//Stap 4: alloceer een nieuwe blok ter grootte van 2 oorspronkelijke kleinere blokken
	Block1=pvPortMalloc(BlockSize*2);	
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step4: Unallocated heap memory:%u\r\n",FreeMem);	
	
	//Stap 5: geef twee niet aanliggende blokken vrij
	vPortFree(Block4);
	vPortFree(Block6);	
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step5: Unallocated heap memory:%u\r\n",FreeMem);	
	
	//Stap 6: alloceer een nieuwe blok ter grootte van 2 oorspronkelijke kleinere blokken
	Block4=pvPortMalloc(BlockSize*2);	
	FreeMem=xPortGetFreeHeapSize();
	printf ("Step6: Unallocated heap memory:%u\r\n",FreeMem);
	
	while (1)
	{
		vTaskDelay(100);
	}
}


