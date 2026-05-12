#include "DriverLed.h"


void DriverLedInit(void)
{
	// pin 0 - 2 op output (1)
	PORTB.DIR |= 0b00000111;
	// Leds zijn by default active low, inverteer dus om active high te maken
	// control bit 6 = INVEN flag = 1
	PORTB.PIN0CTRL=0b01000000;
	PORTB.PIN1CTRL=0b01000000;
	PORTB.PIN2CTRL=0b01000000;
	
	// pin 7 op output (1)
	PORTA.DIR |= 0b10000000; // Zelfde voor Port A maar enkel op PA7
	// control bit 6 = INVEN flag = 1
	PORTA.PIN7CTRL=0b01000000;
}

void DriverLedWrite(uint8_t LedData)
{	
	// Doormiddel van (originalValue & ~mask) | (newValue & mask) kunnen we bepaalde bits zetten de rest negeren
	// De eerste and filtert de bits die behouden moeten worden en de bits die we willen veranderen en de 2de extract deze bits uit de LedData
	PORTB.OUT = (PORTB.OUT & ~0b00000111) | (LedData & 0b00000111);
	PORTA.OUT = (PORTA.OUT & ~0b10000000) | ((LedData & 0b00001000) << 4);
} 

// Zet specifieke leds aan zonder de andere te impacteren
// Doormiddel van OR worden enkel de gekozen leds verandert.
void DriverLedSet(uint8_t LedData)
{
	PORTB.OUT |= (LedData & 0b00000111);
	PORTA.OUT |= ((LedData & 0b00001000) << 4);
}

// Zet specifieke bits uit zonder de andere te impacteren
// AND met het geïnverteerde masker in het output register schakelt enkel de gekozen leds uit.
void DriverLedClear(uint8_t LedData)
{
	PORTB.OUT &= (PORTB.OUT & ~0b00000111) | ~(LedData & 0b00000111);
	PORTA.OUT &= (PORTA.OUT & ~0b10000000) | ~((LedData & 0b00001000) << 4);
}
// Toggled (aan/uit) de gekozen leds zonder de andere te impacteren
// XOR met het masker op het output register toggled de gekozen bits zonder andere te impacteren.
void DriverLedToggle(uint8_t LedData)
{
    PORTB.OUT ^= (LedData & 0b00000111);
    PORTA.OUT ^= ((LedData & 0b00001000) << 4);
}