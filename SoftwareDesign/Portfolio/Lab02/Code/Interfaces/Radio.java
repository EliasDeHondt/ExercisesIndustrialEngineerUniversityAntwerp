// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Interfaces;

class Radio implements VolumeDevice {
    private int volume = 0;

    @Override
    public void volumeUp() {
        volume++;
        System.out.println("Radio volume up to " + volume);
    }

    @Override
    public void volumeDown() {
        volume--;
        System.out.println("Radio volume down to " + volume);
    }
}