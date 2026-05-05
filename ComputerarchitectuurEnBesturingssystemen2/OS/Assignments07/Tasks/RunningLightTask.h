/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef RUNNING_LIGHT_TASK_H
#define RUNNING_LIGHT_TASK_H

#include <stdint.h>

extern volatile int8_t runningLightDirection;

void InitRunningLightTask(void);

#endif
