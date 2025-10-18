-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        Mode: in std_logic_vector(1 downto 0);
        A: in std_logic_vector(4 downto 0);
        B: in std_logic_vector(4 downto 0);
        Display: in std_logic_vector(1 downto 0);
        Cathodes: out std_logic_vector(6 downto 0);
        Anodes: out std_logic_vector(7 downto 0)
        );
end Main;

architecture Behavioral of Main is

begin
    process() begin

    end process;
end Behavioral;
-------------------- Main --------------------