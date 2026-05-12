#include "DriverMotor.h"
#include <avr/interrupt.h>
#include <stdint.h>

#define SPEED_SCALE 3000 // Maximale waarde voor snelheid bij DriverMotorSet
#define PWM_TOP 3199 // bovenste PWM telwaarde, bepaalt frequentie

// volatile: elke lees/schrijfactie wordt gegarandeerd uitgevoerd, nooit gecached door de compiler
// waarde wordt bij elke toegang opnieuw uit het register gelezen zodat interrupt-wijzigingen correct worden gedetecteerd
static volatile uint16_t encoderPosA = 1;
static volatile uint16_t encoderPosB = 1;

// ISR voor PC6 (fase A van encoder motor A)
// Bepaalt de rijrichting aan de hand van PC6 en PC7:
//   PC6 stijgend & PC7=0 -> vooruit  | PC6 stijgend & PC7=1 -> achteruit
//   PC6 dalend  & PC7=0 -> achteruit | PC6 dalend  & PC7=1 -> vooruit
ISR(PORTC_INT0_vect) {
	uint8_t pins = PORTC.IN;
	if (pins & PIN6_bm) {
		encoderPosA += (pins & PIN7_bm) ? -1 : +1;
		} else {             
		encoderPosA += (pins & PIN7_bm) ? +1 : -1;
	}
	PORTC.INTFLAGS = PORT_INT0IF_bm;
}

// ISR voor PC7 (fase B van encoder motor A)
// Bepaalt de rijrichting aan de hand van PC6 en PC7:
//   PC7 stijgend & PC6=0 -> achteruit | PC7 stijgend & PC6=1 -> vooruit
//   PC7 dalend  & PC6=0 -> vooruit    | PC7 dalend  & PC6=1 -> achteruit
ISR(PORTC_INT1_vect) {
	uint8_t pins = PORTC.IN;
	if (pins & PIN7_bm) { 
		encoderPosA += (pins & PIN6_bm) ? +1 : -1;
		} else {              
		encoderPosA += (pins & PIN6_bm) ? -1 : +1;
	}
	PORTC.INTFLAGS = PORT_INT1IF_bm;
}

// ISR voor PE4 (fase A van encoder motor B)
// Zelfde logica als PC6, maar op PE4/PE5
ISR(PORTE_INT0_vect) {
	uint8_t pins = PORTE.IN;
	if (pins & PIN4_bm) {
		encoderPosB += (pins & PIN5_bm) ? -1 : +1;
		} else {
		encoderPosB += (pins & PIN5_bm) ? +1 : -1;
	}
	PORTE.INTFLAGS = PORT_INT0IF_bm;
}

// ISR voor PE5 (fase B van encoder motor B)
// Zelfde logica als PC7, maar op PE4/PE5
ISR(PORTE_INT1_vect) {
	uint8_t pins = PORTE.IN;
	if (pins & PIN5_bm) {
		encoderPosB += (pins & PIN4_bm) ? +1 : -1;
		} else {
		encoderPosB += (pins & PIN4_bm) ? -1 : +1;
	}
	PORTE.INTFLAGS = PORT_INT1IF_bm;
}

void DriverMotorInit(void)
{
	//GPIO init
	// Zet medium level interrupts aan (bit 1 = 1)
	PMIC.CTRL |= 0b00000010;
	
	//Timer init, hbridge
	// PF0 - 4 als output
	PORTF.DIR |= 0b00011111;
	PORTF.PIN0CTRL = 0b00000000;
	PORTF.PIN1CTRL = 0b00000000;
	PORTF.PIN2CTRL = 0b00000000;
	PORTF.PIN3CTRL = 0b00000000;
	// Pull up op MOTOR-SLEEP
	PORTF.PIN4CTRL = 0b00011000;

	// Zet motors aan, bit 5 = sleep pin
	PORTF.OUT |= 0b00010000;
	
	// PWM timer configuratie
	// bits 7-4: CCD/CCC/CCB/CCA ingeschakeld | bits 1-0: single-slope PWM modus
	TCF0.CTRLB = 0b11110011;
	// geen events
	TCF0.CTRLD = 0b00000000;
	// geen byte mode
	TCF0.CTRLE = 0b00000000;
	// PWM periode
	TCF0.PER = PWM_TOP;	
	// Systemclock, geen prescaler
	TCF0.CTRLA = 0b00000001;
	
	//Encoder A
	// PC6-7 input
	PORTC.DIR &= ~0b11000000;
	PORTC.PIN6CTRL = 0b00000000;
	PORTC.PIN7CTRL = 0b00000000;
	
	//PC6 triggered INT0
	PORTC.INT0MASK |= 0b01000000;
	//PC7 triggered INT1
	PORTC.INT1MASK |= 0b10000000;
	// Zet beide interrupts op medium priority
	PORTC.INTCTRL = (PORTC.INTCTRL & ~0b00001111) | 0b00001010;
	
	//Encoder B
	// PE4-5 input
	PORTE.DIR &= ~0b00110000;
	PORTE.PIN4CTRL = 0b00000000;
	PORTE.PIN5CTRL = 0b00000000;

	//PE4 triggered INT0
	PORTE.INT0MASK |= 0b00010000;
	//PE5 triggered INT1
	PORTE.INT1MASK |= 0b00100000;
	//Zet beide interrupts op medium priority
	PORTE.INTCTRL = (PORTE.INTCTRL & ~0b00001111) | 0b00001010;
}

// Stelt snelheid en richting van de motoren in
// positief: vooruit, negatief: achteruit
void DriverMotorSet(int16_t MotorLeft, int16_t MotorRight)
{
	// Rescale input speed
	if (MotorLeft > SPEED_SCALE)  MotorLeft = SPEED_SCALE;
	if (MotorLeft < -SPEED_SCALE) MotorLeft = -SPEED_SCALE;
	if (MotorRight > SPEED_SCALE)  MotorRight = SPEED_SCALE;
	if (MotorRight < -SPEED_SCALE) MotorRight = -SPEED_SCALE;

	// Zet speed om	naar PWM duty cycle
	uint16_t dutyL = (uint32_t)(MotorLeft  < 0 ? -MotorLeft  : MotorLeft)  * PWM_TOP / SPEED_SCALE;
	uint16_t dutyR = (uint32_t)(MotorRight < 0 ? -MotorRight : MotorRight) * PWM_TOP / SPEED_SCALE;
	
	// Motor Links: CCA = achteruit, CCB = vooruit
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

    // Motor Rechts: CCC = vooruit, CCD = achteruit
    if (MotorRight >= 0) {
        TCF0.CCC = dutyR;
        TCF0.CCD = 0;
    } else if (MotorRight < 0){
        TCF0.CCC = 0;
        TCF0.CCD = dutyR;
    } else {
		TCF0.CCC = 0;
		TCF0.CCD = 0;
	}
}

// Lees de encoder posities van beide motoren
// Omdat de encoder posities door interrupts worden bijgewerkt moet het lezen atomair gebeuren
// Hierdoor zetten we interrupts tijdelijk uit.
EncoderStruct DriverMotorGetEncoder(void)
{
	EncoderStruct encoderPos;

	// sla interrupt toestand op
	uint8_t sreg_save = SREG;

	// zet interrupts tijdelijk uit
	cli();

	// kopieer encoder waarden
	encoderPos.Cnt1 = encoderPosA;
	encoderPos.Cnt2 = encoderPosB;

	// herstel interrupts
	SREG = sreg_save;

	return encoderPos;
}
