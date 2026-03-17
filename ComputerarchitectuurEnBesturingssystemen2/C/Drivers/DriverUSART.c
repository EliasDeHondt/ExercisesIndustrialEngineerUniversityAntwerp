/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverUSART.h"
#include <avr/io.h>
#include <avr/interrupt.h>
#include <stdio.h>
#include "hwconfig.h"
#include <math.h>
#define CPU_SPEED 32000000UL // System clock frequency in Hz.

static int stdio_putchar(char c, FILE * stream);
static int stdio_getchar(FILE *stream);
static FILE UsartStdio = FDEV_SETUP_STREAM(stdio_putchar, stdio_getchar,_FDEV_SETUP_RW);

typedef struct {
	int8_t bscale;
	uint16_t bsel;
	float abs_error;
	float rel_error;
} baud_result; // Result of baud search: register values + absolute/relative error.

baud_result calculate_baud(uint32_t baud);

void DriverUSARTInit(void) {
    USART_PORT.DIRSET = 0x08; // TX pin as output.
    USART_PORT.DIRCLR = 0x04; // RX pin as input.

    USART.CTRLA = 0x00; // No USART interrupts.
    USART.CTRLB = 0x18; // Enable TX and RX.
    USART.CTRLC = 0x03; // Asynchronous mode, 8 data bits, no parity, 1 stop bit.

    // Compute best BSCALE/BSEL for target baud rate.
	baud_result result = calculate_baud(115200);

    // Program BAUD registers from computed values.
    USART.BAUDCTRLA = (uint8_t)(result.bsel & 0xFF); // BSEL low byte [7:0].
    USART.BAUDCTRLB = ((result.bscale << 4) & 0xF0) | ((result.bsel >> 8) & 0x0F); // BSCALE in [7:4], BSEL[11:8] in [3:0].

    stdout = &UsartStdio; // Route printf/puts to USART.
    stdin = &UsartStdio;   // Route scanf/getchar to USART.
}

// Sweep all BSCALE values (-7..+7) and pick BSEL that minimizes absolute baud error.
// Formulas used:
// - BSCALE >= 0: f_baud = f_cpu / (16 * 2^bscale * (BSEL + 1))
// - BSCALE <  0: f_baud = f_cpu / (16 * (2^bscale * BSEL + 1))
// Input: target baud rate in bits/s.
baud_result calculate_baud(uint32_t baud) {
    baud_result best;
    best.rel_error = 1e9;
    float best_error = 1e9;

    for (int8_t bscale = -7; bscale <= 7; bscale++) {
        float factor = pow(2.0, bscale);
        uint16_t bsel;
        float real_baud;

        if (bscale >= 0) {
            float bsel_f = ((float)CPU_SPEED / (16.0 * factor * baud)) - 1.0;
            if (bsel_f < 0 || bsel_f > 4095) continue;
            bsel = (uint16_t)(bsel_f + 0.5);
            real_baud = (float)CPU_SPEED / (16.0 * factor * (bsel + 1));
        } else {
            float bsel_f = ((float)CPU_SPEED / (16.0 * baud) - 1.0) / factor;
            if (bsel_f < 0 || bsel_f > 4095) continue;
            bsel = (uint16_t)(bsel_f + 0.5);
            real_baud = (float)CPU_SPEED / (16.0 * (factor * bsel + 1.0));
        }

        float abs_error = fabs(real_baud - baud);
        float rel_error = abs_error / baud;

        if (abs_error < best_error) {
            best_error = abs_error;
            best.bscale = bscale;
            best.bsel = bsel;
            best.abs_error = abs_error;
            best.rel_error = rel_error;
        }
    }
    return best;
}

static int stdio_putchar(char c, FILE * stream) {
    (void)stream;
	USART.DATA = c;
    while (!(USART.STATUS & 0x40)); // Wait for TX complete flag.
    USART.STATUS = 0x40;            // Clear TX complete flag.
	return 0;
}
	
static int stdio_getchar(FILE *stream) {
    (void)stream;
    while (!(USART.STATUS & 0x80)); // Wait for RX complete flag.
	return USART.DATA;
}