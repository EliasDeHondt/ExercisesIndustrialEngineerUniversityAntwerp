-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Component7Seg is
    port (
        Clk100MHz: in std_logic := '0';
        Lives: in integer range 0 to 8;
        Score: in integer range 0 to 9999;
        Cathodes: out std_logic_vector(7 downto 0);
        Anodes: out std_logic_vector(7 downto 0)
        );
end Component7Seg;

architecture Behavioral of Component7Seg is
    type DigitArray is array (0 to 9) of std_logic_vector(7 downto 0);
    constant DIGITS : DigitArray := (
        0 => "00000011",  -- 0
        1 => "10011111",  -- 1
        2 => "00100101",  -- 2
        3 => "00001101",  -- 3
        4 => "10011001",  -- 4
        5 => "01001001",  -- 5
        6 => "01000001",  -- 6
        7 => "00011111",  -- 7
        8 => "00000001",  -- 8
        9 => "00001001"   -- 9
    );

    constant BLANK : std_logic_vector(7 downto 0) := "11111111";

    constant GSeg : std_logic_vector(7 downto 0) := "01000011";  -- G
    constant ASeg : std_logic_vector(7 downto 0) := "00010001";  -- A
    constant MSeg : std_logic_vector(7 downto 0) := "00110111";  -- M
    constant ESeg : std_logic_vector(7 downto 0) := "01100001";  -- E
    constant OSeg : std_logic_vector(7 downto 0) := "00000011";  -- O
    constant VSeg : std_logic_vector(7 downto 0) := "10000011";  -- V
    constant RSeg : std_logic_vector(7 downto 0) := "00110001";  -- R

    type PatternArray is array (0 to 7) of std_logic_vector(7 downto 0);
    signal DigitPatterns : PatternArray; -- Patterns for each of the 8 digits

    signal Clk8khz: std_logic := '0';
    signal ClkDivider: unsigned(15 downto 0) := (others => '0');
    signal DisplaySel: unsigned(2 downto 0) := (others => '0');
    signal Segments: std_logic_vector(7 downto 0);
begin
    CLOCK_DIVIDER: process(Clk100MHz) begin
        if rising_edge(Clk100MHz) then -- Triggers only on rising edge of Clk (100 MHz system clock)
            if ClkDivider = 6249 then -- Divide by 6250 to get 8 kHz
                ClkDivider <= (others => '0'); -- Reset counter
                Clk8khz <= not Clk8khz;
            else
                ClkDivider <= ClkDivider + 1;
            end if;
        end if;
    end process CLOCK_DIVIDER;

    DISPLAY_COUNTER: process(Clk8khz) begin
        if rising_edge(Clk8khz) then -- Triggers only on rising edge of Clk (8 kHz clock)
            if DisplaySel = 7 then
                DisplaySel <= (others => '0');
            else
                DisplaySel <= DisplaySel + 1;
            end if;
        end if;
    end process DISPLAY_COUNTER;

    process (Clk8khz) begin
        if rising_edge(Clk8khz) then
            if Lives = 0 then -- Game Over display
                DigitPatterns(7) <= GSeg;
                DigitPatterns(6) <= ASeg;
                DigitPatterns(5) <= MSeg;
                DigitPatterns(4) <= ESeg;
                DigitPatterns(3) <= OSeg;
                DigitPatterns(2) <= VSeg;
                DigitPatterns(1) <= ESeg;
                DigitPatterns(0) <= RSeg;
            else -- Normal display of Lives and Score
                DigitPatterns(4) <= DIGITS(Score mod 10);
                DigitPatterns(5) <= DIGITS((Score / 10) mod 10);
                if Score < 10 then DigitPatterns(5) <= BLANK; end if;

                DigitPatterns(6) <= DIGITS((Score / 100) mod 10);
                if Score < 100 then DigitPatterns(6) <= BLANK; end if;

                DigitPatterns(7) <= DIGITS(Score / 1000);
                if Score < 1000 then DigitPatterns(7) <= BLANK; end if;

                DigitPatterns(3) <= BLANK;
                DigitPatterns(2) <= BLANK;
                DigitPatterns(1) <= BLANK;

                DigitPatterns(0) <= DIGITS(Lives);
            end if;
        end if;
    end process;

    process (DisplaySel, DigitPatterns) begin
        case DisplaySel is
            when "000" => Anodes <= "11111110"; Segments <= DigitPatterns(0); -- Lives
            when "001" => Anodes <= "11111101"; Segments <= DigitPatterns(1); -- Blank
            when "010" => Anodes <= "11111011"; Segments <= DigitPatterns(2); -- Blank
            when "011" => Anodes <= "11110111"; Segments <= DigitPatterns(3); -- Blank
            when "100" => Anodes <= "11101111"; Segments <= DigitPatterns(4); -- Score units
            when "101" => Anodes <= "11011111"; Segments <= DigitPatterns(5); -- Score tens
            when "110" => Anodes <= "10111111"; Segments <= DigitPatterns(6); -- Score hundreds
            when "111" => Anodes <= "01111111"; Segments <= DigitPatterns(7); -- Score thousands
            when others => Anodes <= (others => '1'); Segments <= (others => '1');
        end case;
    end process;

    Cathodes <= Segments;
end Behavioral;