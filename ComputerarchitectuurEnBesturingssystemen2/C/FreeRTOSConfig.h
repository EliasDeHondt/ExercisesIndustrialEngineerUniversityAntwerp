/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

#include <avr/io.h>

void vAssertCalled( char *File, int Line);

#define configUSE_PREEMPTION		1
#define configUSE_IDLE_HOOK			1
#define configUSE_TICK_HOOK			0
#define configCPU_CLOCK_HZ			( ( unsigned long ) 32000000 )
#define configTICK_RATE_HZ			( ( TickType_t ) 1000 )
#define configMAX_PRIORITIES		( 10 )
#define configMINIMAL_STACK_SIZE	( ( unsigned short ) 256 )
#define configTOTAL_HEAP_SIZE		( (size_t ) ( 16384 ) )
#define configMAX_TASK_NAME_LEN		( 8 )
#define configUSE_TRACE_FACILITY	1
#define configUSE_STATS_FORMATTING_FUNCTIONS  1
#define configGENERATE_RUN_TIME_STATS 1
#define configUSE_16_BIT_TICKS		1
#define configIDLE_SHOULD_YIELD		1
#define configQUEUE_REGISTRY_SIZE	0
#define configSUPPORT_DYNAMIC_ALLOCATION 1
#define configUSE_MALLOC_FAILED_HOOK 1
#define configCHECK_FOR_STACK_OVERFLOW 2
#define configUSE_MUTEXES 1
#define configUSE_APPLICATION_TASK_TAG 1
#define configAPPLICATION_ALLOCATED_HEAP 1

#define portLU_PRINTF_SPECIFIER_REQUIRED 1

#define configUSE_CO_ROUTINES 		1
#define configMAX_CO_ROUTINE_PRIORITIES ( 2 )

#define configASSERT( x )     if( ( x ) == 0 ) vAssertCalled( __FILE__, __LINE__ )

#define INCLUDE_vTaskPrioritySet		0
#define INCLUDE_uxTaskPriorityGet		0
#define INCLUDE_vTaskDelete				1
#define INCLUDE_vTaskCleanUpResources	0
#define INCLUDE_vTaskSuspend			1
#define INCLUDE_vTaskDelayUntil			1
#define INCLUDE_vTaskDelay				1
#define INCLUDE_xTaskGetIdleTaskHandle  1

#define pdMS_TO_TICKS( xTimeInMs ) ( ( TickType_t ) ( ( ( uint32_t ) ( xTimeInMs ) * ( uint32_t ) configTICK_RATE_HZ ) / ( uint32_t ) 1000 ) )

#endif