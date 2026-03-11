/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include "DriverMotor.h"
#include <avr/interrupt.h>
#include <stdint.h>

#define SPEED_SCALE 3000 // Maximum speed value (absolute) that corresponds to 100% duty cycle.
#define PWM_TOP 3199 	 // For 20kHz PWM with 64 prescaler: F_CPU / (Prescaler * PWM Frequency) - 1 = 16MHz / (64 * 20kHz) - 1 = 3199 -> Google: "AVR PWM frequency calculation"

void DriverMotorInit(void) {
	// Timer init, hbridge
	PORTF.DIR |= 0x1F;
	PORTF.PIN0CTRL = 0x00;
	PORTF.PIN1CTRL = 0x00;
	PORTF.PIN2CTRL = 0x00;
	PORTF.PIN3CTRL = 0x00;
	PORTF.PIN4CTRL = 0x18;

	PORTF.OUT |= 0x10;  // SLEEP pin HIGH to enable DRV8833

	TCF0.CTRLB = TC_WGMODE_SS_gc | TC0_CCAEN_bm | TC0_CCBEN_bm | TC0_CCCEN_bm | TC0_CCDEN_bm;
	TCF0.CTRLD = 0x00;
	TCF0.CTRLE = 0x00;
	TCF0.PER = PWM_TOP;	

	TCF0.CTRLA = 0x01;
}

void DriverMotorSet(int16_t MotorLeft, int16_t MotorRight) {
	if (MotorLeft > SPEED_SCALE)  MotorLeft = SPEED_SCALE; 		// Max forward speed left
	if (MotorLeft < -SPEED_SCALE) MotorLeft = -SPEED_SCALE; 	// Max backward speed left
	if (MotorRight > SPEED_SCALE)  MotorRight = SPEED_SCALE; 	// Max forward speed right
	if (MotorRight < -SPEED_SCALE) MotorRight = -SPEED_SCALE; 	// Max backward speed right

	uint16_t dutyL = (uint32_t)(MotorLeft  < 0 ? -MotorLeft  : MotorLeft)  * PWM_TOP / SPEED_SCALE; // Calculate duty cycle for left motor (absolute value scaled to PWM range)
	uint16_t dutyR = (uint32_t)(MotorRight < 0 ? -MotorRight : MotorRight) * PWM_TOP / SPEED_SCALE; // Calculate duty cycle for right motor (absolute value scaled to PWM range)
	
	// Motor Left: CCA = backward, CCB = forward
	if (MotorLeft > 0) {
		TCF0.CCA = 0;
		TCF0.CCB = dutyL;
	} else if (MotorLeft < 0) {
		TCF0.CCA = dutyL;
		TCF0.CCB = 0;
	} else {
		TCF0.CCA = 0;
		TCF0.CCB = 0;
	}

	// Motor Right: CCC = forward, CCD = backward
	if (MotorRight >= 0) {
		TCF0.CCC = dutyR;
		TCF0.CCD = 0;
	} else if (MotorRight < 0) {
		TCF0.CCC = 0;
		TCF0.CCD = dutyR;
	} else {
		TCF0.CCC = 0;
		TCF0.CCD = 0;
	}
}

EncoderStruct DriverMotorGetEncoder(void) {
	EncoderStruct enc;
	enc.Cnt1 = 0;
	enc.Cnt2 = 0;
	return enc;
}