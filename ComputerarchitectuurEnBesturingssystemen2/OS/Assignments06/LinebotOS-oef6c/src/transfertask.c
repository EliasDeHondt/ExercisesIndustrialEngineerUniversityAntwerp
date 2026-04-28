/*
 * transfertask.c - Oefening 6c: Data Transfer met Queue
 * FreeRTOS exercise: transferring data between tasks using queues
 */

#include <stdio.h>
#include <stdint.h>
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

/* Queue handle */
xQueueHandle dataQueue = NULL;

/* Worker function that sends data */
void WorkerSendTask(void *pvParameters)
{
    uint32_t sendData = 0x10101010;
    
    for(;;)
    {
        /* Send data to queue (overwrite previous value) */
        xQueueOverwrite(dataQueue, (void *) &sendData);
        
        /* Toggle between two values */
        if (sendData == 0x10101010)
            sendData = 0x20202020;
        else
            sendData = 0x10101010;
        
        /* Delay to allow other task to run */
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

/* Worker function that receives and verifies data */
void WorkerReceiveTask(void *pvParameters)
{
    uint32_t receivedData = 0;
    uint32_t startTime = 0;
    uint32_t endTime = 0;
    uint32_t elapsedTime = 0;
    
    for(;;)
    {
        /* Start timing */
        startTime = portGET_RUN_TIME_COUNTER_VALUE();
        
        /* Peek data from queue (non-destructive read) */
        if (xQueuePeek(dataQueue, &receivedData, 0) == pdTRUE)
        {
            /* End timing */
            endTime = portGET_RUN_TIME_COUNTER_VALUE();
            elapsedTime = endTime - startTime;
            
            /* Verify the data */
            if (receivedData != 0x10101010 && receivedData != 0x20202020)
            {
                printf("ERROR: Unexpected data value: 0x%08lX (elapsed: %lu cycles)\n", 
                       receivedData, elapsedTime);
            }
            else
            {
                printf("OK: Data = 0x%08lX (elapsed: %lu cycles)\n", 
                       receivedData, elapsedTime);
            }
        }
        else
        {
            printf("ERROR: Failed to read from queue\n");
        }
        
        /* Delay */
        vTaskDelay(pdMS_TO_TICKS(150));
    }
}

/* Initialize the data transfer system */
void vInitializeDataTransfer(void)
{
    /* Create queue for one uint32_t element */
    dataQueue = xQueueCreate(1, sizeof(uint32_t));
    
    if (dataQueue == NULL)
    {
        printf("ERROR: Failed to create queue!\n");
        return;
    }
    
    /* Initialize queue with default value */
    uint32_t initialValue = 0;
    xQueueOverwrite(dataQueue, (void *) &initialValue);
    
    /* Create the sender task */
    xTaskCreate(WorkerSendTask, 
                "SendTask", 
                configMINIMAL_STACK_SIZE, 
                NULL, 
                2,  /* priority */
                NULL);
    
    /* Create the receiver task */
    xTaskCreate(WorkerReceiveTask, 
                "ReceiveTask", 
                configMINIMAL_STACK_SIZE, 
                NULL, 
                2,  /* priority */
                NULL);
}
