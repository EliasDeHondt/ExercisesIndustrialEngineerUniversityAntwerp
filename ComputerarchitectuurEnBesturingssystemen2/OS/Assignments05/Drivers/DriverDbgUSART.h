/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "hwconfig.h"

#ifndef DRIVER_DBG_USART_H
#define DRIVER_DBG_USART_H

void DbgPrint(char *Text);

void DbgPrintn(char *Text,int n);

void DbgPrintInt(uint16_t Data);

#endif