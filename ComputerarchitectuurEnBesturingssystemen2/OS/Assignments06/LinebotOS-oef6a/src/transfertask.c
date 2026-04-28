/*
 * transfertask.c - Oefening 6a: Data Transfer met Mutex
 * FreeRTOS exercise: transferring data between tasks using volatile and mutex
 */

#include <stdio.h>
#include <stdint.h>
#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"

/* Global variable with volatile keyword */
volatile uint32_t Data = 0;
xSemaphoreHandle dataMutex = NULL;

/* Worker function that sends data */
void WorkerSendTask(void *pvParameters)
{
    uint32_t sendData = 0x10101010;
    
    for(;;)
    {
        /* Take the mutex before writing data */
        if (xSemaphoreTake(dataMutex, portMAX_DELAY) == pdTRUE)
        {
            Data = sendData;
            xSemaphoreGive(dataMutex);
        }
        
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
        
        /* Take the mutex before reading data */
        if (xSemaphoreTake(dataMutex, portMAX_DELAY) == pdTRUE)
        {
            receivedData = Data;
            xSemaphoreGive(dataMutex);
        }
        
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
    /* Create the mutex */
    dataMutex = xSemaphoreCreateMutex();
    
    if (dataMutex == NULL)
    {
        printf("ERROR: Failed to create mutex!\n");
        return;
    }
    
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
