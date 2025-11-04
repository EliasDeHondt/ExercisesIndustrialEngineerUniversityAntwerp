// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code.Plants;
import SoftwareDesign.Portfolio.Lab04.Code.Plant;

public class Pine implements Plant {
    @Override
    public String commonName() {
        return "Pine";
    }

    @Override
    public double spacingMeters() {
        return 2.5;
    }

    @Override
    public String soilPreference() {
        return "sandy";
    }
}