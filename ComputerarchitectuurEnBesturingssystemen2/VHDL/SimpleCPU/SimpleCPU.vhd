-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity SimpleCPU is
  port (
    Clk        : in  std_logic;                      -- System clock
    Reset      : in  std_logic;                      -- Synchronous active high
    InPort     : in  std_logic_vector(7 downto 0);   -- Input port
    OutPort    : out std_logic_vector(7 downto 0));  -- Output port
end SimpleCPU;

architecture RTL of SimpleCPU is

  component Memory
    port (
      Clk     : in  std_logic;                        -- System clock
      Reset   : in  std_logic;                        -- Synchronous active high
      Addr    : in  unsigned (7 downto 0);            -- Memory address
      DataOut : out std_logic_vector (15 downto 0);   -- Data from memory
      DataIn  : in  std_logic_vector (15 downto 0);   -- Data to memory
      WE      : in  std_logic);                       -- Active high memory write enable
  end component;

  component ALU 
    port (
      A   : in  unsigned (7 downto 0);         -- Input A
      B   : in  unsigned (7 downto 0);         -- Input B
      Sel : in  std_logic_vector (2 downto 0); -- Operation select
      Z   : out unsigned (7 downto 0);         -- Result output
      CF  : out std_logic;                     -- Carry flag
      ZF  : out std_logic);                    -- Zero flag
  end component;

  component Decoder
    port (
      Clk    : in  std_logic;                     -- System clock
      Reset  : in  std_logic;                     -- Synchronous active high
      IR     : in  std_logic_vector (7 downto 0); -- Instruction
      CF     : in  std_logic;                     -- Carry flag
      ZF     : in  std_logic;                     -- Zero flag
      MUXA   : out std_logic;                     -- Mux A
      MUXB   : out std_logic;                     -- Mux B
      MUXC   : out std_logic;                     -- Mux C
      MUXD   : out std_logic;                     -- Mux D
      EnACC  : out std_logic;                     -- Enable data accumulator
      EnPC   : out std_logic;                     -- Enable program counter
      EnIR   : out std_logic;                     -- Enable instruction
      EnOUTP : out std_logic;                     -- Enable output port
      MemWE  : out std_logic;                     -- Memory write enable
      AluSel : out std_logic_vector(2 downto 0)); -- ALU operation select
  end component;

  -- Arithmetic Logic Unit (ALU) signals
  signal AluA   : unsigned (7 downto 0);         -- Input A
  signal AluB   : unsigned (7 downto 0);         -- Input B
  signal AluSel : std_logic_vector (2 downto 0); -- Operation select
  signal AluZ   : unsigned (7 downto 0);         -- Result output
  signal AluCF  : std_logic;                     -- Carry flag
  signal AluZF  : std_logic;                     -- Zero flag

  -- Accumulator (ACC) signal
  signal AccOut : unsigned (7 downto 0) := (others => '0'); -- ACC output

  -- Instruction Register signals
  signal InstrMSB : std_logic_vector (7 downto 0); -- Instruction MSB
  signal InstrLSB : std_logic_vector (7 downto 0); -- Instruction LSB

  -- Program Counter (PC) signal
  signal ProgramCounter : unsigned (7 downto 0) := (others => '0');

  signal MuxASel  : std_logic;
  signal MuxBSel  : std_logic;
  signal MuxCSel  : std_logic;
  signal MuxDSel  : std_logic;
  signal EnACC    : std_logic;
  signal EnPC     : std_logic;
  signal EnInstr  : std_logic;
  signal EnOutput : std_logic;

  -- Memory signals
  signal MemAddr    : unsigned (7 downto 0);          -- Memory address
  signal MemDataOut : std_logic_vector (15 downto 0); -- Data from memory
  signal MemDataIn  : std_logic_vector (15 downto 0); -- Data to memory
  signal MemWE      : std_logic;
  signal NotClk     : std_logic;

  -- Timer signals
  signal TimerReg        : unsigned(15 downto 0) := (others => '0'); -- Timer register
  signal TimerStep       : unsigned(2 downto 0) := "001";            -- Timer step size
  signal TimerEnabled    : std_logic := '0';                         -- Timer enabled
  signal TimerNoOverflow : std_logic := '0';                         -- No overflow
  signal TimerMax        : std_logic := '0';                         -- Timer max

  -- I/O port signals
  signal ClockedInput : std_logic_vector(7 downto 0); -- Clocked version of the input port, to avoid timing issues when reading from it
  signal MuxDout      : unsigned(7 downto 0); -- Output of Mux D, used to select the value to write to memory
begin
  ALU_0: ALU port map (
    A   => AluA,
    B   => AluB,
    Sel => AluSel,
    Z   => AluZ,
    CF  => AluCF,
    ZF  => AluZF);

  Decoder_0: Decoder port map (
    Clk    => Clk,
    Reset  => Reset,
    IR     => InstrMSB,
    CF     => AluCF,
    ZF     => AluZF,
    MUXA   => MuxASel,
    MUXB   => MuxBSel,
    MUXC   => MuxCSel,
    MUXD   => MuxDSel,
    EnACC  => EnACC,
    EnPC   => EnPC,
    EnIR   => EnInstr,
    EnOUTP => EnOutput,
    MemWE  => MemWE,
    AluSel => AluSel);

  Mem: Memory port map (
    Clk     => NotClk, -- falling edge!
    Reset   => Reset,
    Addr    => MemAddr,
    DataOut => MemDataOut,
    DataIn  => MemDataIn,
    WE      => MemWE);
  NotClk <= not Clk;

  -- The next three sequential processes could perfectly be combined, but are split here for educational purpose.
  p_Accumulator: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        AccOut <= (others => '0');
      elsif EnACC = '1' then
        AccOut <= AluZ;
      end if;
    end if;
  end process p_Accumulator;

  p_ProgramCounter: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        ProgramCounter <= (others => '0');
      elsif EnPC = '1' then
        ProgramCounter <= AluZ;
      end if;
    end if;
  end process p_ProgramCounter;

  p_InstructionReg: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        InstrMSB <= (others => '0');
        InstrLSB <= (others => '0');
      elsif EnInstr = '1' then
        InstrMSB <= MemDataOut (15 downto 8);
        InstrLSB <= MemDataOut (7 downto 0);
      end if;
    end if;
  end process p_InstructionReg;

  -- The timer is located at memory addresses 0xFD - 0xFF:
  -- 0xFD: timer control register
  -- 0xFE: timer MSB
  -- 0xFF: timer LSB

  -- The timer control register uses the following bits:
  -------+---------+-----+--------------------------------------------------------+
  -- BIT | DEFAULT | R/W | FUNCTION                                               |
  -------+---------+-----+--------------------------------------------------------+
  -- 7-5 |  0b001  | R/W | the step size with which the timer counts              |
  -------+---------+-----+--------------------------------------------------------+
  --  4  |   0b0   | R/W | 0: timer disabled                                      |
  --     |         |     | 1: timer enabled                                       |
  -------+---------+-----+--------------------------------------------------------+
  --  3  |   0b0   | R/W | 0: timer restarts at 0 when overflow                   |
  --     |         |     | 1: timer doesn't overflow and keeps last value         |
  -------+---------+-----+--------------------------------------------------------+
  --  2  |   0b0   |  R  | 0: timer hasn't reached maximum value                  |
  --     |         |     | 1: timer has reached maximum value                     |
  -------+---------+-----+--------------------------------------------------------+
  --  1  |   0b0   |  W  | Resets bit 2 to '0' when a '1' is written to it        |
  --     |         |     | Reading this bit always returns a '0'                  |
  -------+---------+-----+--------------------------------------------------------+
  --  0  |   0b0   |  W  | Reset the timer value to 0 when a '1' is written to it |
  --     |         |     | Reading this bit always returns a '0'                  |
  -------+---------+-----+--------------------------------------------------------+
  p_Timer: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        TimerReg        <= (others => '0');
        TimerStep       <= "001";
        TimerMax        <= '0';
        TimerEnabled    <= '0';
        TimerNoOverflow <= '0';
      else

        if TimerEnabled = '1' then
          -- Increase the timer
          if TimerReg + TimerStep > 16#FFFF# then -- Timer will overflow
            TimerMax   <= '1';
            if TimerNoOverflow = '0' then
              TimerReg <= (others => '0');
            end if;
          else
            TimerReg   <= TimerReg + TimerStep;
          end if;
        end if;

        if MemAddr = x"FD" and MemWE = '1' then -- Write to the timing control register
          TimerStep       <= AccOut(7 downto 5);
          TimerEnabled    <= AccOut(4);
          TimerNoOverflow <= AccOut(3);
          if AccOut(1) = '1' then
            TimerMax      <= '0';
          end if;
          if AccOut(0) = '1' then
            TimerReg      <= (others => '0');
          end if;
        end if;
      end if;
    end if;
  end process p_Timer;

  p_IOPort: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        ClockedInput <= (others => '0');
        OutPort      <= (others => '0');
      else
        ClockedInput <= InPort;
        if EnOutput = '1' then
          OutPort    <= std_logic_vector(AccOut);
        end if;
      end if;
    end if;
  end process p_IOPort;

  -- Mux A: select between Accumulator and Program Counter
  AluA <= AccOut when MuxASel = '0' else ProgramCounter;

  -- Mux B: select between Mux D (input port, timer or memory LSB) and instruction LSB
  AluB <= unsigned(InstrLSB) when MuxBSel = '1' else MuxDout; -- Instruction operand

  -- Mux C: select between Program Counter and instruction LSB
  MemAddr <= ProgramCounter when MuxCSel = '0' else unsigned(InstrLSB);

  -- Mux D: select between input port, timer and memory LSB
  MuxDout <= unsigned(ClockedInput) when MuxDSel = '1' else
          TimerStep & TimerEnabled & TimerNoOverflow & TimerMax & "00" when MemAddr = x"FD" else -- Timer ctrl reg
          TimerReg(15 downto 8) when MemAddr = x"FE" else -- Timer MSB
          TimerReg(7 downto 0) when MemAddr = x"FF" else -- Timer LSB
          unsigned(MemDataOut (7 downto 0)); -- Memory output (LSB only)

  MemDataIn (15 downto 8) <= (others => '0');
  MemDataIn (7 downto 0) <= std_logic_vector(AccOut);
end RTL;