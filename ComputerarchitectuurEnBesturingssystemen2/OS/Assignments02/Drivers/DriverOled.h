/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#ifndef DRIVER_OLED_H
#define DRIVER_OLED_H

#include "DriverTwiMaster.h"
#include "avr/pgmspace.h"
#include <string.h>
#include <stdlib.h>
#include <util/delay.h>
#include <stddef.h>

void DriverOLEDInit(uint8_t Orientation);

void DriverOLEDUpdate();

void DriverOLEDPrintText(uint8_t row, char *text);

void DriverOLEDPrintSmChar(unsigned char x, unsigned char y, unsigned char ch, uint8_t scr);

void DriverOLEDPrintSmText(unsigned char row, char *dataPtr, uint8_t scr);

void DriverOLEDClearScreen();

void DriverOLEDInvertScreen();

void DriverOLEDNormalScreen();

void DriverOLEDDrawPixel(unsigned char x, unsigned char y);

void DriverOLEDClearPixel(unsigned char x, unsigned char y);

void DriverOLEDDrawLine (int x1, int y1, int x2, int y2);

void DriverOLEDDrawRectangle (int x1, int y1, int x2, int y2);

void DriverOLEDDrawSolidRectangle (int x1, int y1, int x2, int y2);

void DriverOLEDDrawEllipse (int CX, int CY, int XRadius, int YRadius);

void DriverOLEDDrawCircle (int x, int y, int r);

void DriverOLEDDrawTriangle (int x1, int y1, int x2, int y2, int x3, int y3);

void DriverOLEDSleep();

void DriverOLEDWake();

#endif