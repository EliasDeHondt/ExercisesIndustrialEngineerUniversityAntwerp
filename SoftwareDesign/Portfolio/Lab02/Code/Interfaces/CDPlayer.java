// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Interfaces;

class CDPlayer implements VolumeDevice {
    private int volume = 0;

    @Override
    public void volumeUp() {
        volume++;
        System.out.println("CDPlayer volume up to " + volume);
    }

    @Override
    public void volumeDown() {
        volume--;
        System.out.println("CDPlayer volume down to " + volume);
    }
}