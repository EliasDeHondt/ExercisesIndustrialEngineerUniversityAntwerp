-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;

entity TB_SimpleCPU is
end TB_SimpleCPU;

architecture Behavioral of TB_SimpleCPU is
  component SimpleCPU
    port (
    Clk     : in  std_logic;
    Reset   : in  std_logic;  -- synchronous active high
    InPort  : in  std_logic_vector(7 downto 0);   -- input port
    OutPort : out std_logic_vector(7 downto 0));  -- output port
  end component;

  constant c_ClkPeriod : time := 10 ns;
  signal Clk     : std_logic := '0';
  signal Reset   : std_logic;
  signal InPort  : std_logic_vector(7 downto 0) ;
  signal OutPort : std_logic_vector(7 downto 0);
  signal PrevOutPort : std_logic_vector(7 downto 0);
  signal Green   : std_logic;
  signal Orange  : std_logic;
  signal Red     : std_logic;
  signal Alert   : std_logic;
  signal WrongSensors : boolean := false;
  signal EndOfSim : boolean := false;
begin
  Clk <= not Clk after c_ClkPeriod/2;

  Reset <= '1', '0' after 3*c_ClkPeriod;
  SimpleCPU0: SimpleCPU port map (
    Clk     => Clk,
    Reset   => Reset,
    InPort  => InPort,
    OutPort => OutPort);
  -- Dit in commentaar zetten voor opgave 5:
  InPort <= (others => '0');
--  -- Voor Opgave 5:
--  -- fluid level simulation (asynchronous to Clk)
--  InPort <= "11110000",              -- green
--            "11111000" after 10 us,  -- orange
--            "11111100" after 20 us,  -- orange
--            "11111110" after 30 us,  -- red
--            "11111111" after 40 us,  -- red
--            "11111110" after 50 us,  -- red
--            "11111100" after 60 us,  -- orange
--            "11110000" after 70 us,  -- green
--            "11000000" after 80 us,  -- orange
--            "10000000" after 90 us,  -- red
--            "11111100" after 100 us, -- orange
--            "00000000" after 110 us, -- red
--            "10110000" after 120 us, -- alert
--            "11110000" after 130 us, -- alert
--            "11111100" after 140 us, -- alert
--            "10000000" after 150 us; -- alert

--  EndOfSim <= true after 200 us;
--  assert not EndOfSim report "Einde van de simulatie. Geen fout!" severity FAILURE;            

--  Green  <= OutPort(7);
--  Orange <= OutPort(6);
--  Red    <= OutPort(5);
--  Alert  <= OutPort(4);

--  p_CheckOutput: process (Clk)
--  begin
--    if rising_edge(Clk) then
--      PrevOutPort <= OutPort;
--      if PrevOutPort /= OutPort and now > 2*c_ClkPeriod then
--        if not WrongSensors then
--          case InPort is
--            when "11110000" =>
--              assert OutPort(7 downto 5) = "100" report "Fout: Dit moet zone groen zijn!" severity warning;
--            when "11000000" | "11100000" | "11111000" | "11111100" => 
--              assert OutPort(7 downto 5) = "010" report "Fout: Dit moet zone oranje zijn!" severity warning;
--            when "00000000" | "10000000" | "11111110" | "11111111" =>
--              assert OutPort(7 downto 5) = "001" report "Fout: Dit moet zone rood zijn!" severity warning;
--            when others =>
--              WrongSensors <= true;
--              assert OutPort(4) = '1' report "Fout: Systeem moet in alarm staan!" severity warning;
--          end case;
--        else
--          assert OutPort(4) = '1' report "Fout: Systeem moet in alarm staan!" severity warning;
--        end if;
--      end if;
--    end if;
--  end process p_CheckOutput;
end Behavioral;