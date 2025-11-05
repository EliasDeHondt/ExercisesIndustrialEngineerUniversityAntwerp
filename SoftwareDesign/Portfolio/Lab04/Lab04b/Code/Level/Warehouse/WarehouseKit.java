// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Warehouse;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Config.AppConfig;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Gen.WarehouseWorldGenerator;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Gen.WorldGenerator;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Level;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.LevelKit;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.PaletteBuilder;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.ThemedPaletteBuilder;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.CoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.MovementStrategy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.Warehouse.WarehouseCoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.Warehouse.WarehouseMovementStrategy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Box;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Player;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Warehouse.*;

public final class WarehouseKit extends LevelKit {
    @Override
    public RendererHints hints() {
        return () -> false;
    }

    private WarehouseKit() {}

    public static LevelKit createLevelKit() {
        return Holder.INSTANCE;
    }

    private static final class Holder {
        static final LevelKit INSTANCE = new WarehouseKit();
    }

    @Override
    public MovementStrategy movement() {
        return new WarehouseMovementStrategy();
    }

    @Override
    public WorldGenerator generator() {
        return new WarehouseWorldGenerator();
    }

    @Override
    public Level level() {
        return new WarehouseLevel();
    }

    @Override
    public GroundTile floor() {
        return new WarehouseFloor();
    }

    @Override
    public GroundTile wall() {
        return new WarehouseWall();
    }

    @Override
    public GroundTile target() {
        return new WarehouseTarget();
    }

    @Override
    public Box box() {
        return new WarehouseBox();
    }

    @Override
    public Player player() {
        return new WarehousePlayer();
    }

    @Override
    public CoveragePolicy coverage() {
        return new WarehouseCoveragePolicy();
    }

    @Override
    public PaletteBuilder paletteBuilder() {
        return new ThemedPaletteBuilder(AppConfig.get().themeWarehouse);  // <-- Fix hier!
    }
}