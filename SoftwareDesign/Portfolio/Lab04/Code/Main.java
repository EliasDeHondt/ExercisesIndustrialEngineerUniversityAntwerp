// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Code;
import SoftwareDesign.Portfolio.Lab04.Code.Planners.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Reforestation of Antwerp:");

        ReforestationPlanner antwerp1 = new OakPlanner();
        System.out.println(antwerp1.plan(1.2, "loam").getNote());

        ReforestationPlanner antwerp2 = new MaplePlanner();
        System.out.println(antwerp2.plan(2.0, "loam").getNote());

        System.out.println("\nReforestation of East-Flanders:");

        ReforestationPlanner east1 = new BeechPlanner();
        System.out.println(east1.plan(5.0, "clay").getNote());

        ReforestationPlanner east2 = new SprucePlanner();
        System.out.println(east2.plan(1.5, "clay").getNote());

        System.out.println("\nReforestation of West-Flanders:");

        ReforestationPlanner west1 = new PinePlanner();
        System.out.println(west1.plan(3.1, "sandy").getNote());

        ReforestationPlanner west2 = new WillowPlanner();
        System.out.println(west2.plan(0.8, "wet").getNote());

        ReforestationPlanner west3 = new AlderPlanner();
        System.out.println(west3.plan(2.6, "loam").getNote());
    }
}