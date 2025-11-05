// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.World;

public interface MovementStrategy {
    boolean move(World w, int dx, int dy);

    default boolean nextSelectable(World w) {
        return false;
    }
}