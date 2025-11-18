-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    Port (
        Mode: in std_logic_vector(1 downto 0);
        A: in unsigned(4 downto 0);
        B: in unsigned(4 downto 0);
        Display: in std_logic_vector(1 downto 0);
        Cathodes: out std_logic_vector(6 downto 0);
        Anodes: out std_logic_vector(7 downto 0)
    );
end Main;

architecture Behavioral of Main is
    signal Result: unsigned(13 downto 0);
    signal BCD: unsigned(3 downto 0);
    signal DT: unsigned(3 downto 0);
    signal HT: unsigned(3 downto 0);
    signal TT: unsigned(3 downto 0);
    signal EH: unsigned(3 downto 0);
    signal Error: std_logic; -- Error flag for invalid operations

    signal A_resized: unsigned(13 downto 0);
    signal B_resized: unsigned(13 downto 0);
begin
    BCD2Number_inst: entity work.BCD2Number port map (
        BCD => BCD,
        SevenSegm => Cathodes
    ); 
    Binary2BCD_inst: entity work.Binary2BCD port map(
        Binary => Result,
        DT => DT,
        HT => HT,
        TT => TT,
        EH => EH
    );

    A_resized <= resize(A, 14);
    B_resized <= resize(B, 14);
    
    MAIN_PROCESS: process (Mode, A, B, A_resized, B_resized, Display, DT, HT, TT, EH, Error) begin
        Error <= '0';
        case Mode is
                when "00" => -- A + B
                    Result <= A_resized + B_resized;
                when "01" => -- A - B
                    if A_resized < B_resized then
                        Result <= (others => '0');
                        Error <= '1';
                    else 
                    Result <= A_resized - B_resized;
                end if;
                when "10" => -- A * B
                    Result <= resize(A * B, 14);
                when "11" => -- 3*A² + 7*B²
                    Result <= resize(3 * (A * A) + 7 * (B * B), 14);
                when others =>
                    Result <= (others => '0');
        end case;

        case Display is
            when "00" => -- Units
                BCD <= DT;
                Anodes <= (7 => '0', others => '1');
            when "01" => -- Tens
                BCD <= HT;
                Anodes <= (6 => '0', others => '1');
            when "10" => -- Hundreds
                BCD <= TT;
                Anodes <= (5 => '0', others => '1');
            when "11" => -- Thousands
                BCD <= EH;
                Anodes <= (4 => '0', others => '1');
            when others => -- Off
                BCD <= (others => '0');
                Anodes <= (others => '1');
        end case;

        if Error = '1' then -- Show error
            BCD <= "1110";
        end if;
    end process MAIN_PROCESS;
end Behavioral;
-------------------- Main --------------------

-------------------- BCD2Number --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity BCD2Number is
    Port ( 
        BCD: in unsigned(3 downto 0);
        SevenSegm: out std_logic_vector(6 downto 0)
    );
end BCD2Number;

architecture Behavioral of BCD2Number is
begin
    SevenSegm <= 
                "0000001" when BCD = 0 else
                "1001111" when BCD = 1 else
                "0010010" when BCD = 2 else
                "0000110" when BCD = 3 else
                "1001100" when BCD = 4 else
                "0100100" when BCD = 5 else
                "0100000" when BCD = 6 else
                "0001111" when BCD = 7 else
                "0000000" when BCD = 8 else
                "0000100" when BCD = 9 else
                "0001000" when BCD = 10 else
                "1100000" when BCD = 11 else
                "0110001" when BCD = 12 else
                "1000010" when BCD = 13 else
                "0110000" when BCD = 14 else
                "0111000";
end Behavioral;
-------------------- BCD2Number --------------------

-------------------- Binary2BCD --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Binary2BCD is
    Port ( 
        Binary: unsigned(13 downto 0);
        DT: out unsigned(3 downto 0);
        HT: out unsigned(3 downto 0);
        TT: out unsigned(3 downto 0);
        EH: out unsigned(3 downto 0)
    );
end Binary2BCD;

architecture Behavioral of Binary2BCD is
begin
    DT <= resize(Binary / 1000, 4);
    HT <= resize((Binary mod 1000) / 100, 4);
    TT <= resize((Binary mod 100) / 10, 4);
    EH <= resize(Binary mod 10, 4);
end Behavioral;
-------------------- Binary2BCD --------------------