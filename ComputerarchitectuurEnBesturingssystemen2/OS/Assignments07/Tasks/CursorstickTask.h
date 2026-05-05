/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef CURSORSTICK_TASK_H
#define CURSORSTICK_TASK_H

#include <stdint.h>

#define CURSORSTICK_UP     (1 << 4)  // 0x10
#define CURSORSTICK_LEFT   (1 << 3)  // 0x08
#define CURSORSTICK_DOWN   (1 << 2)  // 0x04
#define CURSORSTICK_RIGHT  (1 << 1)  // 0x02
#define CURSORSTICK_CENTER (1 << 0)  // 0x01

void InitCursorstickTask(void);
uint8_t CursorstickGetAction(uint8_t *action);

#endif