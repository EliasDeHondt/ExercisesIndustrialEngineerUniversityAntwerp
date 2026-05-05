/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef DRIVER_ADPS9960_H
#define DRIVER_ADPS9960_H

#include "DriverTWIMaster.h"
#include <stdint.h>

void DriverAdps9960Init(void);

void DriverAdps9960Get(uint16_t *Clear,uint16_t *Red,uint16_t *Green, uint16_t *Blue);

#endif