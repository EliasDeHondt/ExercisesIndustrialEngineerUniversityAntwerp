#ifndef PINGUARD_H
#define PINGUARD_H
/**
 * Linebot pin guard monitor
 * \file PinGuard.h
 * \brief Linebot LED driver
*/

#include "hwconfig.h"

/**
 * \brief Initialize pin guard monitor
*/
void PinGuardInit(void);

void PinGuardDIR(void);

void PinGuardPort(void);

#endif