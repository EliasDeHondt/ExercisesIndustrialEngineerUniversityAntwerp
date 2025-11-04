// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Planners;
import SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plant;
import SoftwareDesign.Portfolio.Lab04.Lab04a.Code.ReforestationPlanner;
import SoftwareDesign.Portfolio.Lab04.Lab04a.Code.Plants.Alder;


public class AlderPlanner extends ReforestationPlanner {
    @Override
    protected Plant createPlant() {
        return new Alder();
    }
}