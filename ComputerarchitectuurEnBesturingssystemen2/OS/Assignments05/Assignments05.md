![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Assignments05🤍💙

## Stack Allocation

**TCB Address:** 0x30CE

| Depth | var1 Address | Buffer[0] | Value |
|-------|-------------|----------|-------|
| 1 | 0x3025 | 0x302C | var1=1 |
| 2 | 0x3025 | 0x302C | var1=2 |
| 3 | 0x2FEE | 0x2FF5 | var1=3 |


## Answers

**1. Stack Growth Direction?**
- **Answer: DOWNWARD**
- Proof: Depth 1 var1=0x3025, Depth 3 var1=0x2FEE
- Conclusion: Addresses decrease → stack grows toward lower addresses (toward 0x0000)

**2. Unused Stack Byte?**
- **Answer: 0xCD** (FreeRTOS standard initialization value)
- Visible in Memory Window below local variables
- Repeating pattern: CD CD CD CD CD CD...
- Indicates which stack bytes are still unused

**3. TCB Location?**
- **Answer: HIGHER**
- TCB address: 0x30CE
- var1 address: 0x2FEE
- 0x30CE > 0x2FEE → TCB at higher addresses
- Standard layout: TCB above, stack below, growing toward each other

**4. Stack Shift (Depth 1 → 3)?**
- **Answer: 55 bytes** (0x37 in hex)
- Calculation: 0x3025 - 0x2FEE = 0x37 = 55 bytes
- Per recursion level: ~18-20 bytes (return address + frame pointer + local vars)
- 3 levels = ±55 bytes shift toward lower address

**5. Stack Overflow Detection?**
- At depth ~100, vApplicationStackOverflowHook() is called
- All tasks stop
- LED 4 blinks slowly
- Terminal error: "STACK overflow in task term"
- usStackHighWaterMark drops to ~5-10 bytes free

**6. Stack Growth Observation?**
- Stack and TCB grow toward each other
- TCB grows upward (0x30CE)
- Stack grows downward (toward 0x2FEE, 0x2EEE, etc.)
- When they meet → stack overflow
- Memory Window shows: TCB bytes above, stack bytes below