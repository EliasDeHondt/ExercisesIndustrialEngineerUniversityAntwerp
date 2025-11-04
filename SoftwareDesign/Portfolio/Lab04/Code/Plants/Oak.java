// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code.Plants;
import SoftwareDesign.Portfolio.Lab04.Code.Plant;

public class Oak implements Plant {
    @Override
    public String commonName() {
        return "Oak";
    }

    @Override
    public double spacingMeters() {
        return 3.0;
    }

    @Override
    public String soilPreference() {
        return "loam";
    }
}