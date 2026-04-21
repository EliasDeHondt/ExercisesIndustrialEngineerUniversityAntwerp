/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "TemplateTask.h"

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

static void WorkerTemplate(void *pvParameters);

void InitTemplateTask() {
	xTaskCreate( WorkerTemplate, "template", 256, NULL, tskIDLE_PRIORITY+3, NULL );	
}

static void WorkerTemplate(void *pvParameters) {
	while (1) {}
}