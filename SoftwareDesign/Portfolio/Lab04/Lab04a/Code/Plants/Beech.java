// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plants;
import SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plant;

public class Beech implements Plant {
    @Override
    public String commonName() {
        return "Beech";
    }

    @Override
    public double spacingMeters() {
        return 3.0;
    }

    @Override
    public String soilPreference() {
        return "well-drained";
    }
}