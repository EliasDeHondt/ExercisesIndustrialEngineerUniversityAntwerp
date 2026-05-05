/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef DRIVERADC_H
#define DRIVERADC_H

#include <stdint.h>

void DriverAdcInit(void);			

int16_t DriverAdcGetCh(int8_t PinPos,int8_t PinNeg);

#endif