// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plants;
import SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plant;

public class Alder implements Plant {
    @Override
    public String commonName() {
        return "Alder";
    }

    @Override
    public double spacingMeters() {
        return 2.0;
    }

    @Override
    public String soilPreference() {
        return "wet";
    }
}