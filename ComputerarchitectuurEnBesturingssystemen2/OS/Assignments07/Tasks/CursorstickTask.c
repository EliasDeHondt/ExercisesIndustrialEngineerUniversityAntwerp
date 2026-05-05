/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "CursorstickTask.h"
#include "DriverCursorstick.h"

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

#define QUEUE_LENGTH 5

static QueueHandle_t cursorstickQueue;
static void WorkerCursorstick(void *pvParameters);

void InitCursorstickTask(void) {
    cursorstickQueue = xQueueCreate(QUEUE_LENGTH, sizeof(uint8_t));
    xTaskCreate(WorkerCursorstick, "CursorStick", configMINIMAL_STACK_SIZE, NULL, tskIDLE_PRIORITY + 2, NULL);
}

uint8_t CursorstickGetAction(uint8_t *action) {
    return xQueueReceive(cursorstickQueue, action, 0) == pdTRUE ? 1 : 0;
}

static void WorkerCursorstick(void *pvParameters) {
    uint8_t prevState = 0;

    while (1) {
        uint8_t currentState = DriverCursorstickGet();

        uint8_t risingEdge = currentState & ~prevState;

        if (risingEdge & CURSORSTICK_UP)     { uint8_t a = CURSORSTICK_UP;     xQueueSend(cursorstickQueue, &a, 0); }
        if (risingEdge & CURSORSTICK_LEFT)   { uint8_t a = CURSORSTICK_LEFT;   xQueueSend(cursorstickQueue, &a, 0); }
        if (risingEdge & CURSORSTICK_DOWN)   { uint8_t a = CURSORSTICK_DOWN;   xQueueSend(cursorstickQueue, &a, 0); }
        if (risingEdge & CURSORSTICK_RIGHT)  { uint8_t a = CURSORSTICK_RIGHT;  xQueueSend(cursorstickQueue, &a, 0); }
        if (risingEdge & CURSORSTICK_CENTER) { uint8_t a = CURSORSTICK_CENTER; xQueueSend(cursorstickQueue, &a, 0); }

        prevState = currentState;
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}