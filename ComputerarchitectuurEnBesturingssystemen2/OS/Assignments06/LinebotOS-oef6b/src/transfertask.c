/*
 * transfertask.c - Oefening 6b: Data Transfer met Critical Sections
 * FreeRTOS exercise: transferring data between tasks using atomic operations
 */

#include <stdio.h>
#include <stdint.h>
#include "FreeRTOS.h"
#include "task.h"

/* Global variable with volatile keyword */
volatile uint32_t Data = 0;

/* Worker function that sends data */
void WorkerSendTask(void *pvParameters)
{
    uint32_t sendData = 0x10101010;
    
    for(;;)
    {
        /* Enter critical section for atomic write */
        taskENTER_CRITICAL();
        Data = sendData;
        taskEXIT_CRITICAL();
        
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
        
        /* Enter critical section for atomic read */
        taskENTER_CRITICAL();
        receivedData = Data;
        taskEXIT_CRITICAL();
        
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
        
        /* Delay */
        vTaskDelay(pdMS_TO_TICKS(150));
    }
}

/* Initialize the data transfer system */
void vInitializeDataTransfer(void)
{
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
