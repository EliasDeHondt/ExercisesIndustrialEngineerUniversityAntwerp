#include "DriverUSART.h"
#include <avr/io.h>
#include <avr/interrupt.h>
#include <stdio.h>
#include "hwconfig.h"
#include <math.h>
#include "FreeRTOS.h"
#include "queue.h"
#define CPU_SPEED 32000000 // System clock frequency in Hz
#define RECEIVE_QUEUE_LENGTH 32
#define	SEND_QUEUE_LENGTH 1

static int stdio_putchar(char c, FILE * stream);
static int stdio_getchar(FILE *stream);
static FILE UsartStdio = FDEV_SETUP_STREAM(stdio_putchar, stdio_getchar,_FDEV_SETUP_RW);

static QueueHandle_t receiveQueue;
static QueueHandle_t sendQueue;

// Struct om data van de baud rate berekening bij te houden
typedef struct
{
	int8_t bscale;
	uint16_t bsel;
	float abs_error;
	float rel_error;
} baud_result;

baud_result calculate_baud(uint32_t baud);

void DriverUSARTInit(void)
{
	receiveQueue = xQueueCreate(RECEIVE_QUEUE_LENGTH, sizeof(uint8_t));
	sendQueue = xQueueCreate(SEND_QUEUE_LENGTH, sizeof(uint8_t));
	
	USART_PORT.DIRSET=0b00001000;	
	USART_PORT.DIRCLR=0b00000100;
	
	USART.CTRLA=0b00010100;
	USART.CTRLB=0b00011000;
	USART.CTRLC=0b00000011;	
	
	baud_result result = calculate_baud(115200);
	
	USART.BAUDCTRLA=(uint8_t)(result.bsel & 0xFF); // BSEL low byte //0xE5; //BSEL=3301, BSCALE=-5 19200 baud
	USART.BAUDCTRLB=((result.bscale << 4) & 0xF0) |((result.bsel >> 8) & 0x0F);//0xBC; // BSCALE + BSEL high nibble
	
	stdout=&UsartStdio;
	stdin=&UsartStdio;
}

ISR(USART_RXC_vect)
{
	uint8_t data = USART.DATA;

	BaseType_t higherPrioTaskActive = pdFALSE;
	xQueueSendFromISR(receiveQueue, &data, &higherPrioTaskActive);

    portYIELD_FROM_ISR(higherPrioTaskActive);
}

ISR(USART_TXC_vect)
{
	uint8_t data;
    BaseType_t higherPrioTaskActive = pdFALSE;

    USART.STATUS = 0b01000000;

    if (xQueueReceiveFromISR(sendQueue, &data, &higherPrioTaskActive) == pdTRUE) {
        USART.DATA = data;
    }
	
    portYIELD_FROM_ISR(higherPrioTaskActive);
}

// gaat over alle BSCALE waarden (-7 tot 7) en kiest de BSEL dat de absolute fout minimaliseert tussen de te behalen en en target baud rate
// De volgende formules worden gebruikt:
// - BSCALE >= 0: f_baud = f_cpu / (16 * 2^bscale * (BSEL + 1))
// - BSCALE <  0: f_baud = f_cpu / (16 * (2^bscale * BSEL + 1))
// Accepteert een target baud rate in bits/s
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
            best_error     = abs_error;
            best.bscale    = bscale;
            best.bsel      = bsel;
            best.abs_error = abs_error;
            best.rel_error = rel_error;
        }
    }
    return best;
}

static int stdio_putchar(char c, FILE * stream)
{
	uint8_t data = (uint8_t)c;

    xQueueSend(sendQueue, &data, portMAX_DELAY);

    if (USART.STATUS & 0b00100000) {
        uint8_t toSend;
        if (xQueueReceive(sendQueue, &toSend, 0) == pdTRUE) {
            USART.STATUS = 0b01000000;
            USART.DATA   = toSend;
        }
    }

    return 0;
}
	
static int stdio_getchar(FILE *stream)
{
	uint8_t data;
	xQueueReceive(receiveQueue, &data, portMAX_DELAY);
	return data;
}

