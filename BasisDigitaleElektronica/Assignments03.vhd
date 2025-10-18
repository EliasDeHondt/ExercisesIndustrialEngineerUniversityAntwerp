-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        Dips: in std_logic_vector(1 downto 0);
        A: in std_logic_vector(3 downto 0);
        B: in std_logic_vector(3 downto 0);
        Som: out std_logic_vector(4 downto 0)
        );
end Main;

architecture Behavioral of Main is
    signal A_signed, B_signed : signed(3 downto 0); -- Two's complement (possible and negative)
    signal A_unsigned, B_unsigned : unsigned(3 downto 0); -- Positief binaire (only positive)
    signal result_signed : signed(4 downto 0);
begin
    process(Dips, A, B) begin
        A_unsigned <= unsigned(A); -- Convert std_logic_vector to unsigned
        B_unsigned <= unsigned(B); -- Convert std_logic_vector to unsigned
        A_signed <= signed(A); -- Convert std_logic_vector to signed
        B_signed <= signed(B); -- Convert std_logic_vector to signed

        if Dips(0) = '0' then -- Determines the type of numbers
            result_signed <= signed(('0' & A_unsigned) + ('0' & B_unsigned)); -- And '0' to avoid overflow
        else
            result_signed <= resize(A_signed, 5) + resize(B_signed, 5);
        end if;
        if Dips(1) = '0' then -- Determines the number of LEDs showing the sum
            Som <= std_logic_vector(result_signed);
        else
            Som <= '0' & std_logic_vector(result_signed(3 downto 0)); -- And '0' to avoid overflow
        end if;
    end process;
end Behavioral;
-------------------- Main --------------------