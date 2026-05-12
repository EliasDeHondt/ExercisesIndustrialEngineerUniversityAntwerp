/**
 * Linebot cursor stick driver
 * \file DriverCursorstick.h
 * \brief Linebot cursor stick driver
*/

#include "hwconfig.h"
#include <stdint.h>

/**
 * \brief Initialize cursor stick driver
*/
void DriverCursorstickInit(void);


/**
 * \brief Get cursor stick state
 * \return B0-->B4: U L D R C (0=depressed, 1=pressed)
*/
uint8_t DriverCursorstickGet(void);