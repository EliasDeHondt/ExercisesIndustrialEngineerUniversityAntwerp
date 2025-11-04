// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code;

public interface Plant {
    String commonName();

    double spacingMeters();

    String soilPreference(); // a short note (e.g., "loam", "sandy", "clay")

    default String info() {
        return commonName() + " (" + soilPreference() + ", spacing ~" + spacingMeters() + " m)";
    }
}