/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef DRIVER_MPU6050_H
#define DRIVER_MPU6050_H

#include "DriverTWIMaster.h"
#include <stdint.h>

void DriverMPU6050Init(void);

void DriverMPU6050GyroGet(int16_t *Gx,int16_t *Gy,int16_t *Gz);

#endif