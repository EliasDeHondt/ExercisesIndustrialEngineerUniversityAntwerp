// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code.Planners;
import SoftwareDesign.Portfolio.Lab04.Code.Plant;
import SoftwareDesign.Portfolio.Lab04.Code.ReforestationPlanner;
import SoftwareDesign.Portfolio.Lab04.Code.Plants.Pine;

public class PinePlanner extends ReforestationPlanner {
    @Override
    protected Plant createPlant() {
        return new Pine();
    }
}