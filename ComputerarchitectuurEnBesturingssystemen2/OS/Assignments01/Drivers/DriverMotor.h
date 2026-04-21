/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/03/2026
**/
#include <stdint.h>

typedef struct {
	int16_t Cnt1;   /// <Encoder 1 pulse count
	int16_t Cnt2;   /// <Encoder 2 pulse count
} EncoderStruct;

void DriverMotorInit(void);

void DriverMotorSet(int16_t MotorLeft,int16_t MotorRight);

EncoderStruct DriverMotorGetEncoder(void);