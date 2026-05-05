/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include <avr/interrupt.h>
#include "DriverTWIMaster.h"
#include <stdlib.h>
#include <stdio.h>

#define false 0
#define true 1

#define DRIVERTWIMASTER_DEBUG 1
#define TWIM_STATUS_READY              0
#define TWIM_STATUS_BUSY               1

typedef enum TWIM_RESULT_enum {
	TWIM_RESULT_UNKNOWN          = (0x00<<0),
	TWIM_RESULT_OK               = (0x01<<0),
	TWIM_RESULT_BUFFER_OVERFLOW  = (0x02<<0),
	TWIM_RESULT_ARBITRATION_LOST = (0x03<<0),
	TWIM_RESULT_BUS_ERROR        = (0x04<<0),
	TWIM_RESULT_NACK_RECEIVED    = (0x05<<0),
	TWIM_RESULT_FAIL             = (0x06<<0),
} TWIM_RESULT_t;

void TWIMTransactionFinished(uint8_t result);
void TWIMArbitrationLostBusErrorHandler();
void TWIMWriteHandler();
void TWIMReadHandler();

static volatile uint8_t Twim_address;								// Slave address
static volatile uint8_t *Twim_writeData;							// Data to write
static volatile uint8_t *Twim_readData;								// Read data
static volatile uint8_t Twim_bytesToWrite;							// Number of bytes to write
static volatile uint8_t Twim_bytesToRead;							// Number of bytes to read
static volatile uint8_t Twim_bytesWritten;							// Number of bytes written
static volatile uint8_t Twim_bytesRead;								// Number of bytes read
static volatile uint8_t Twim_status;							    // Status of transaction
static uint8_t Twim_result;											// Result of transaction


void DriverTWIMInit() {
	Twim_status=0;
	TWIM_PORT.PIN0CTRL=0b00011000;
	TWIM_PORT.PIN1CTRL=0b00011000;
	TWIM_BUS.MASTER.CTRLA = (TWIM_INTLEVEL << 6) | TWI_MASTER_RIEN_bm | TWI_MASTER_WIEN_bm | TWI_MASTER_ENABLE_bm;
	TWIM_BUS.MASTER.BAUD =  ((F_CPU / (2 * TWIM_BAUDRATE)) - 5);
	TWIM_BUS.MASTER.STATUS = TWI_MASTER_BUSSTATE_IDLE_gc;

	return;
}

uint8_t TWIMWrite(uint8_t address, uint8_t *writeData,uint8_t bytesToWrite) {
	uint8_t twi_status = TWIMWriteRead(address, writeData, bytesToWrite, NULL,0);
	return twi_status;
}

uint8_t TWIMRead(uint8_t address,uint8_t *readData,uint8_t bytesToRead) {
	uint8_t twi_status = TWIMWriteRead(address, NULL, 0,readData, bytesToRead);
	return twi_status;
}

uint8_t TWIMWriteRead(uint8_t address, uint8_t *writeData, uint8_t bytesToWrite, uint8_t *readData, uint8_t bytesToRead) {
	Twim_writeData=writeData;
	Twim_readData=readData;

	if (Twim_status == TWIM_STATUS_READY)  {
		Twim_status = TWIM_STATUS_BUSY;
		Twim_result = TWIM_RESULT_UNKNOWN;
		Twim_address = address<<1;
		Twim_bytesToWrite = bytesToWrite;
		Twim_bytesToRead = bytesToRead;
		Twim_bytesWritten = 0;
		Twim_bytesRead = 0;

		if (Twim_bytesToWrite > 0) {
			uint8_t writeAddress = Twim_address & ~0x01;
			TWIM_BUS.MASTER.ADDR = writeAddress;
		}

		else if (Twim_bytesToRead > 0) 
		{
			uint8_t readAddress = Twim_address | 0x01;
			TWIM_BUS.MASTER.ADDR = readAddress;
		}
		while (Twim_status != TWIM_STATUS_READY);
		if (Twim_result==TWIM_RESULT_OK) return true;
		else {
			#ifdef DRIVERTWIMASTER_DEBUG
			printf ("TWIM_RESULT:%d\r\n",Twim_result);
			#endif
			return false;	
		}
	} 
	else {
		return false;
	}
}

void TWIMArbitrationLostBusErrorHandler() {
	uint8_t currentStatus = TWIM_BUS.MASTER.STATUS;

	if (currentStatus & TWI_MASTER_BUSERR_bm) {
		Twim_result = TWIM_RESULT_BUS_ERROR;
	}

	else {
		Twim_result = TWIM_RESULT_ARBITRATION_LOST;
	}

	TWIM_BUS.MASTER.STATUS = currentStatus | TWI_MASTER_ARBLOST_bm;

	Twim_status = TWIM_STATUS_READY;
}

void TWIMWriteHandler() {
	uint8_t bytesToWrite  = Twim_bytesToWrite;
	uint8_t bytesToRead   = Twim_bytesToRead;

	if (TWIM_BUS.MASTER.STATUS & TWI_MASTER_RXACK_bm) {
		TWIM_BUS.MASTER.CTRLC = TWI_MASTER_CMD_STOP_gc;
		Twim_result = TWIM_RESULT_NACK_RECEIVED;
		Twim_status = TWIM_STATUS_READY;
	}

	else if (Twim_bytesWritten < bytesToWrite) {
		uint8_t data = Twim_writeData[Twim_bytesWritten];
		TWIM_BUS.MASTER.DATA = data;
		++Twim_bytesWritten;
	}

	else if (Twim_bytesRead < bytesToRead) {
		uint8_t readAddress = Twim_address | 0x01;
		TWIM_BUS.MASTER.ADDR = readAddress;
	}

	else {
		TWIM_BUS.MASTER.CTRLC = TWI_MASTER_CMD_STOP_gc;
		TWIMTransactionFinished(TWIM_RESULT_OK);
	}
}

void TWIMReadHandler() {
	if (Twim_bytesRead < TWIM_READ_BUFFER_SIZE) {
		uint8_t data = TWIM_BUS.MASTER.DATA;
		Twim_readData[Twim_bytesRead] = data;
		Twim_bytesRead++;
	}

	else {
		TWIM_BUS.MASTER.CTRLC = TWI_MASTER_CMD_STOP_gc;
		TWIMTransactionFinished(TWIM_RESULT_BUFFER_OVERFLOW);
	}

	uint8_t bytesToRead = Twim_bytesToRead;

	if (Twim_bytesRead < bytesToRead) {
		TWIM_BUS.MASTER.CTRLC = TWI_MASTER_CMD_RECVTRANS_gc;
	}

	else {
		TWIM_BUS.MASTER.CTRLC = TWI_MASTER_ACKACT_bm | TWI_MASTER_CMD_STOP_gc;
		TWIMTransactionFinished(TWIM_RESULT_OK);
	}
}

void TWIMTransactionFinished( uint8_t result) {
	Twim_result = result;
	Twim_status = TWIM_STATUS_READY;
}

ISR (TWIM_BUS_vect) {
	uint8_t currentStatus = TWIM_BUS.MASTER.STATUS;

	if ((currentStatus & TWI_MASTER_ARBLOST_bm) || (currentStatus & TWI_MASTER_BUSERR_bm)) {
		TWIMArbitrationLostBusErrorHandler();
	}

	else if (currentStatus & TWI_MASTER_WIF_bm) {
		TWIMWriteHandler();
	}

	else if (currentStatus & TWI_MASTER_RIF_bm) {
		TWIMReadHandler();
	}

	else {
		TWIMTransactionFinished(TWIM_RESULT_FAIL);
	}
	
	if (Twim_status == TWIM_STATUS_READY) { //Transaction finished
	}
}