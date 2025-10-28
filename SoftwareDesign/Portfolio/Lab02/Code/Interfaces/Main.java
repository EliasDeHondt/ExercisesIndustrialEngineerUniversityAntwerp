// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Interfaces;

public class Main {
    public Main() {}

    public static void main(String[] args) {
        Main m = new Main();
        m.run();
    }

    public void run() {
        UniversalRemote remote = new UniversalRemote();
        VolumeDevice tv = new TV();
        VolumeDevice radio = new Radio();
        VolumeDevice cdPlayer = new CDPlayer();

        remote.addDevice(tv);
        remote.addDevice(radio);
        remote.addDevice(cdPlayer);

        System.out.println("Raising volume on all devices:");
        remote.riseVolume();

        System.out.println("\nLowering volume on all devices:");
        remote.lowerVolume();
    }
}