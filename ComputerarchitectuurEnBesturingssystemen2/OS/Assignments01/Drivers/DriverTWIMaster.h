/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef DRIVER_TWI_MASTER_H
#define DRIVER_TWI_MASTER_H

#include "hwconfig.h"
#include <avr/interrupt.h>

void DriverTWIMInit();

uint8_t TWIMWrite(uint8_t address,uint8_t *writeData,uint8_t bytesToWrite); 

uint8_t TWIMRead(uint8_t address,uint8_t *readData,uint8_t bytesToRead);

uint8_t TWIMWriteRead(uint8_t address,uint8_t *writeData,uint8_t bytesToWrite,uint8_t *readData,uint8_t bytesToRead);

#endif 