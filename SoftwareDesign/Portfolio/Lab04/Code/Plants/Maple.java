// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code.Plants;
import SoftwareDesign.Portfolio.Lab04.Code.Plant;

public class Maple implements Plant {
    @Override
    public String commonName() {
        return "Maple";
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