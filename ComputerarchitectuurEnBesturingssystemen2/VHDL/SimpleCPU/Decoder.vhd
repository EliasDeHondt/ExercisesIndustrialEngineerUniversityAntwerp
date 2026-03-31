-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Decoder is
  port (
    Clk    : in  std_logic;                     -- System clock
    Reset  : in  std_logic;                     -- Synchronous active high
    IR     : in  std_logic_vector (7 downto 0); -- Instruction (8bits)
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
end Decoder;

-- Available instructions:
-- LOAD ACC kk    : 0000 XXXX KKKKKKKK -- put constant value K in the accumulator
-- AND ACC kk     : 0001 XXXX KKKKKKKK -- bitwise AND constant K with the accumulator
-- ADD ACC kk     : 0010 0XXX KKKKKKKK -- add constant K to the accumulator
-- ADD IND mm     : 0010 1XXX MMMMMMMM -- add the value at memory address M to the accumulator
-- SUB ACC kk     : 0011 XXXX KKKKKKKK -- subtract constant K from the accumulator
-- READ MEM mm    : 0100 XXXX MMMMMMMM -- read memory address M and store in the accumulator
-- WRITE MEM mm   : 0101 XXXX MMMMMMMM -- write the accumulator to memory address M
-- INPUT ACC      : 0110 XXXX XXXXXXXX -- read input port and store in the accumulator
-- OUTPUT ACC     : 0111 XXXX XXXXXXXX -- write the accumulator to the ouput port
-- JUMP U aa      : 1000 XXXX AAAAAAAA -- jump unconditionaly to address A
-- JUMP Z aa      : 1001 00XX AAAAAAAA -- jump to address A if Z flag is set
-- JUMP C aa      : 1001 10XX AAAAAAAA -- jump to address A if C flag is set
-- JUMP NZ aa     : 1001 01XX AAAAAAAA -- jump to address A if Z flag is not set
-- JUMP NC aa     : 1001 11XX AAAAAAAA -- jump to address A if C flag is not set
-- JUMP IND mm    : 1011 XXXX MMMMMMMM -- jump to address stored in memory address M

-- X : not used
-- K : constant
-- A : instruction address
-- M : memory address

architecture RTL of Decoder is
  type t_InstrCycle is (e_Fetch, e_Decode, e_Execute, e_Increment);
  signal InstrCycle : t_InstrCycle;

  type t_Instruction is (e_Load, e_BitAnd, e_Add, e_AddInd, e_Sub, e_ReadMem, e_WriteMem, e_Input, e_Output, e_Jump, e_JumpZ, e_JumpC, e_JumpNZ, e_JumpNC, e_JumpInd, e_BitOr, e_BitOrZ, e_Error);
  signal Instruction : t_Instruction;
  signal JumpInstruction : boolean;
  signal JumpNotTaken    : boolean;

  signal CarryReg : std_logic;
  signal ZeroReg  : std_logic;
  signal SReset   : std_logic := '1';
begin
  p_SyncReset: process (Clk)
  begin
    if rising_edge(Clk) then
      SReset <= Reset;
    end if;
  end process p_SyncReset;
  p_SequenceGenerator: process(Clk)
  begin
    if rising_edge(Clk) then
      if SReset = '1' then
        InstrCycle <= e_Fetch;
      else
        case InstrCycle is
        when e_Fetch =>
          InstrCycle <= e_Decode;
        when e_Decode =>
          InstrCycle <= e_Execute;
        when e_Execute =>
          InstrCycle <= e_Increment;
        when others => -- e_Increment
          InstrCycle <= e_Fetch;
        end case;
      end if;
    end if;
  end process p_SequenceGenerator;

  p_FlagsRegs: process(Clk)
  begin
    if rising_edge(Clk) then
      if SReset = '1' then
        CarryReg <= '0';
        ZeroReg  <= '0';
      elsif InstrCycle = e_Execute and (Instruction = e_Add or Instruction = e_AddInd or Instruction = e_Sub or Instruction = e_BitAnd or Instruction = e_BitOr or Instruction = e_Load or Instruction = e_Input or Instruction = e_ReadMem) then
        CarryReg <= CF;
        ZeroReg  <= ZF;
      elsif InstrCycle = e_Execute and Instruction = e_BitOrZ and ZeroReg = '1' then
        CarryReg <= CF;
        ZeroReg  <= ZF;
      end if;
    end if;
  end process p_FlagsRegs;

  Instruction <= e_Load    when IR(7 downto 4) = "0000" else
                e_BitAnd   when IR(7 downto 4) = "0001" else
                e_Add      when IR(7 downto 3) = "00100" else
                e_AddInd   when IR(7 downto 3) = "00101" else
                e_Sub      when IR(7 downto 4) = "0011" else
                e_ReadMem  when IR(7 downto 4) = "0100" else
                e_WriteMem when IR(7 downto 4) = "0101" else
                e_Input    when IR(7 downto 4) = "0110" else
                e_Output   when IR(7 downto 4) = "0111" else
                e_Jump     when IR(7 downto 4) = "1000" else
                e_JumpZ    when IR(7 downto 2) = "100100" else
                e_JumpC    when IR(7 downto 2) = "100110" else
                e_JumpNZ   when IR(7 downto 2) = "100101" else
                e_JumpNC   when IR(7 downto 2) = "100111" else
                e_JumpInd  when IR(7 downto 4) = "1011" else
                e_BitOr    when IR(7 downto 4) = "1100" else
                e_BitOrZ   when IR(7 downto 4) = "1101" else
                e_Error;
  JumpInstruction <= true when Instruction = e_Jump or
                              Instruction = e_JumpZ or
                              Instruction = e_JumpC or
                              Instruction = e_JumpNZ or
                              Instruction = e_JumpNC or
                              Instruction = e_JumpInd else false;

  MemWE <= '1' when InstrCycle = e_Execute and Instruction = e_WriteMem else '0';
  MuxA  <= '1' when InstrCycle = e_Increment else '0';
  MuxB  <= '1' when (InstrCycle = e_Decode or InstrCycle = e_Execute) and (Instruction = e_Load or Instruction = e_BitAnd or Instruction = e_Add or Instruction = e_Sub or Instruction = e_BitOr or Instruction = e_BitOrZ) else '0';
  MuxC  <= '1' when (InstrCycle = e_Decode or InstrCycle = e_Execute) and (Instruction = e_ReadMem or Instruction = e_WriteMem or Instruction = e_AddInd or Instruction = e_JumpInd) else '0';
  MuxD  <= '1' when (InstrCycle = e_Decode or InstrCycle = e_Execute) and (Instruction = e_Input) else '0';
  EnIR  <= '1' when InstrCycle = e_Fetch else '0';
  EnACC <= '1' when InstrCycle = e_Execute and (Instruction = e_Load or Instruction = e_BitAnd or Instruction = e_Add or Instruction = e_AddInd or Instruction = e_Sub or Instruction = e_ReadMem or Instruction = e_Input or Instruction = e_BitOr or (Instruction = e_BitOrZ and ZeroReg = '1')) else '0';
  EnPC  <= '1' when (InstrCycle = e_Increment and JumpNotTaken) or -- Normal: next instruction
                    (InstrCycle = e_Execute and                    -- Branch instructions
                    (Instruction = e_Jump or                       -- Unconditional jump
                    (Instruction = e_JumpZ and ZeroReg = '1') or   -- Jump if zero
                    (Instruction = e_JumpNZ and ZeroReg = '0') or  -- Jump if not zero
                    (Instruction = e_JumpC and CarryReg = '1') or  -- Jump if carry
                    (Instruction = e_JumpNC and CarryReg = '0') or -- Jump if not carry
                    (Instruction = e_JumpInd)))                    -- Jump indirect
                    else '0';
  EnOUTP <= '1' when InstrCycle = e_Execute and Instruction = e_Output else '0';

  p_JumpNotTaken: process (Clk)
  begin
    if rising_edge(Clk) then
      if SReset = '1' then
        JumpNotTaken   <= false;
      else
        JumpNotTaken   <= true;
        if Instruction = e_Jump or Instruction = e_JumpIND then
          JumpNotTaken <= false;
        end if;
        if Instruction = e_JumpZ and ZeroReg = '1' then
          JumpNotTaken <= false;
        end if;
        if Instruction = e_JumpNZ and ZeroReg = '0' then
          JumpNotTaken <= false;
        end if;
        if Instruction = e_JumpC and CarryReg = '1' then
          JumpNotTaken <= false;
        end if;
        if Instruction = e_JumpNC and CarryReg = '0' then
          JumpNotTaken <= false;
        end if;
      end if;
    end if;
  end process p_JumpNotTaken;

  AluSel <= "000" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and Instruction = e_WriteMem else    -- ALU Z=A
            "001" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and (Instruction = e_ReadMem or 
            Instruction = e_Load or Instruction = e_Input or Instruction = e_Output or JumpInstruction) else  -- ALU Z=B
            "010" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and 
                      (Instruction = e_Add or Instruction = e_AddInd) else                                    -- ALU Z=A+B
            "011" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and Instruction = e_Sub else         -- ALU Z=A-B
            "100" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and Instruction = e_BitAnd else      -- ALU Z=A&B
            "101" when InstrCycle = e_Increment else                                                          -- ALU Z=A+1
            "110" when (InstrCycle = e_Decode or InstrCycle = e_Execute) and (Instruction = e_BitOr or (Instruction = e_BitOrZ and ZeroReg = '1')) else -- ALU Z=A|B
            "111";                                                                                            -- Unused
end RTL;