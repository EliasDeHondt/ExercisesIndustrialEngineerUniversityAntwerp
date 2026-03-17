#include "DriverMotor.h"
#include <avr/interrupt.h>
#include <stdint.h>

#define SPEED_SCALE 3000 // Maximum absolute speed command accepted by DriverMotorSet().
#define PWM_TOP 3199     // Timer TOP value for PWM period.

// Must be volatile because these counters are updated inside ISRs.
// Without volatile, the compiler may cache values and miss interrupt-driven updates.
static volatile int16_t encoderPosA = 0; // Encoder pulse counter for motor A.
static volatile int16_t encoderPosB = 0; // Encoder pulse counter for motor B.

// Interrupt for encoder A, phase A (PC6).
ISR(PORTC_INT0_vect) {
	uint8_t pins = PORTC.IN; 										// Read both encoder input levels once.
	if (pins & PIN6_bm) encoderPosA += (pins & PIN7_bm) ? -1 : +1; 	// (If phase A is currently high) Direction depends on phase B.
	else encoderPosA += (pins & PIN7_bm) ? +1 : -1; 				// (If phase A is currently low) Direction depends on phase B.
	PORTC.INTFLAGS = PORT_INT0IF_bm; 								// Clear INT0 interrupt flag on PORTC.
}

// Interrupt for encoder A, phase B (PC7).
ISR(PORTC_INT1_vect) {
	uint8_t pins = PORTC.IN;										// Read both encoder input levels once.
	if (pins & PIN7_bm) encoderPosA += (pins & PIN6_bm) ? +1 : -1; 	// (If phase B is currently high) Direction depends on phase A.
	else encoderPosA += (pins & PIN6_bm) ? -1 : +1;					// (If phase B is currently low) Direction depends on phase A.
	PORTC.INTFLAGS = PORT_INT1IF_bm;								// Clear INT1 interrupt flag on PORTC.
}

// Interrupt for encoder B, phase A (PE4).
ISR(PORTE_INT0_vect) {
	uint8_t pins = PORTE.IN;										// Read both encoder input levels once.
	if (pins & PIN4_bm) encoderPosB += (pins & PIN5_bm) ? -1 : +1; 	// (If phase A is currently high) Direction depends on phase B.
	else encoderPosB += (pins & PIN5_bm) ? +1 : -1;					// (If phase A is currently low) Direction depends on phase B.
	PORTE.INTFLAGS = PORT_INT0IF_bm;								// Clear INT0 interrupt flag on PORTE.
}

// Interrupt for encoder B, phase B (PE5).
ISR(PORTE_INT1_vect) {
	uint8_t pins = PORTE.IN;										// Read both encoder input levels once.
	if (pins & PIN5_bm) encoderPosB += (pins & PIN4_bm) ? +1 : -1; 	// (If phase B is currently high) Direction depends on phase A.
	else encoderPosB += (pins & PIN4_bm) ? -1 : +1;					// (If phase B is currently low) Direction depends on phase A.
	PORTE.INTFLAGS = PORT_INT1IF_bm;								// Clear INT1 interrupt flag on PORTE.
}

void DriverMotorInit(void) {
	// Enable medium-level interrupts in PMIC.
	PMIC.CTRL |= 0x02;

	PORTF.DIR |= 0x1F;      // PF0..PF4 as outputs for motor driver control signals.
	PORTF.PIN0CTRL = 0x00;  // Disable special input options on PF0.
	PORTF.PIN1CTRL = 0x00;  // Disable special input options on PF1.
	PORTF.PIN2CTRL = 0x00;  // Disable special input options on PF2.
	PORTF.PIN3CTRL = 0x00;  // Disable special input options on PF3.
	PORTF.PIN4CTRL = 0x18;  // Enable pull-up on PF4 (motor sleep control line).

	PORTF.OUT |= 0x10;      // Drive sleep pin high to enable the motor driver.
	TCF0.CTRLB = 0xF3;      // Single-slope PWM + enable compare channels A/B/C/D.
	TCF0.CTRLD = 0x00;      // No event actions.
	TCF0.CTRLE = 0x00;      // Normal 16-bit mode.
	TCF0.PER = PWM_TOP;     // Set PWM period.
	TCF0.CTRLA = 0x01;      // Start timer with clk/1 (no prescaler).

	// Configure encoder A pins and route both lines to interrupts on any edge.
	PORTC.DIR &= ~0xC0;                         // PC6 and PC7 as inputs.
	PORTC.PIN6CTRL = 0x00;                      // Default pin sense/control for PC6.
	PORTC.PIN7CTRL = 0x00;                      // Default pin sense/control for PC7.
	PORTC.INTFLAGS = PORT_INT0IF_bm | PORT_INT1IF_bm; // Clear stale pending flags.
	PORTC.INT0MASK |= 0x40;                     // Connect PC6 to PORTC INT0 group.
	PORTC.INT1MASK |= 0x80;                     // Connect PC7 to PORTC INT1 group.
	PORTC.INTCTRL = (PORTC.INTCTRL & ~0x0F) | 0x0A; // INT0 and INT1 at medium level.

	// Configure encoder B pins and route both lines to interrupts on any edge.
	PORTE.DIR &= ~0x30;                         // PE4 and PE5 as inputs.
	PORTE.PIN4CTRL = 0x00;                      // Default pin sense/control for PE4.
	PORTE.PIN5CTRL = 0x00;                      // Default pin sense/control for PE5.
	PORTE.INTFLAGS = PORT_INT0IF_bm | PORT_INT1IF_bm; // Clear stale pending flags.
	PORTE.INT0MASK |= 0x10;                     // Connect PE4 to PORTE INT0 group.
	PORTE.INT1MASK |= 0x20;                     // Connect PE5 to PORTE INT1 group.
	PORTE.INTCTRL = (PORTE.INTCTRL & ~0x0F) | 0x0A; // INT0 and INT1 at medium level.

	// Enable global interrupts so encoder ISRs can run.
	sei();
}

void DriverMotorSet(int16_t MotorLeft, int16_t MotorRight) {
	if (MotorLeft > SPEED_SCALE)  MotorLeft = SPEED_SCALE;   // Clamp left command to max.
	if (MotorLeft < -SPEED_SCALE) MotorLeft = -SPEED_SCALE;  // Clamp left command to min.
	if (MotorRight > SPEED_SCALE)  MotorRight = SPEED_SCALE; // Clamp right command to max.
	if (MotorRight < -SPEED_SCALE) MotorRight = -SPEED_SCALE;// Clamp right command to min.

	// Convert absolute speed commands to PWM compare values.
	uint16_t dutyL = (uint32_t)(MotorLeft  < 0 ? -MotorLeft  : MotorLeft)  * PWM_TOP / SPEED_SCALE;
	uint16_t dutyR = (uint32_t)(MotorRight < 0 ? -MotorRight : MotorRight) * PWM_TOP / SPEED_SCALE;

    if (MotorLeft > 0) {
        TCF0.CCA = 0;     // Disable backward channel for left motor.
        TCF0.CCB = dutyL; // Drive forward channel for left motor.
    } else if (MotorLeft < 0) {
        TCF0.CCA = dutyL; // Drive backward channel for left motor.
        TCF0.CCB = 0;     // Disable forward channel for left motor.
    } else {
		TCF0.CCA = 0; // Stop left motor backward PWM.
		TCF0.CCB = 0; // Stop left motor forward PWM.
	}

    if (MotorRight >= 0) {
        TCF0.CCC = dutyR; // Drive forward channel for right motor.
        TCF0.CCD = 0;     // Disable backward channel for right motor.
    } else if (MotorRight < 0){
        TCF0.CCC = 0;     // Disable forward channel for right motor.
        TCF0.CCD = dutyR; // Drive backward channel for right motor.
    } else {
		TCF0.CCC = 0; // Stop right motor forward PWM.
		TCF0.CCD = 0; // Stop right motor backward PWM.
	}
}

EncoderStruct DriverMotorGetEncoder(void) {
	EncoderStruct encoderPos; // Local copy returned to caller.
	uint8_t sreg_save = SREG; // Save global interrupt enable state.
	cli(); // Disable interrupts for an atomic read of both counters.
	encoderPos.Cnt1 = encoderPosA; // Copy motor A encoder count.
	encoderPos.Cnt2 = encoderPosB; // Copy motor B encoder count.
	SREG = sreg_save; // Restore previous interrupt state.
	return encoderPos; // Return consistent snapshot of both encoder counters.
}