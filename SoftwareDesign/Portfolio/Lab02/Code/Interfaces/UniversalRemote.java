// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Interfaces;
import java.util.ArrayList;
import java.util.List;

class UniversalRemote {
    private List<VolumeDevice> devices = new ArrayList<>();

    public void addDevice(VolumeDevice device) {
        devices.add(device);
    }

    public void lowerVolume() {
        for (VolumeDevice device : devices) {
            device.volumeDown();
        }
    }

    public void riseVolume() {
        for (VolumeDevice device : devices) {
            device.volumeUp();
        }
    }
}