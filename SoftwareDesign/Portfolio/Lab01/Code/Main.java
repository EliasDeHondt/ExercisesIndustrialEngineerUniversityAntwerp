// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab01.Code;

public class Main {
    Booking booking;

    public static void main(String[] args) {
        Main main = new Main();
        main.run();
    }

    public void run() {
        System.out.println("Initializing...\n");
        initialize();

        long date = 10;

        int hotelID = booking.findCheapestHotel(date);
        System.out.println("Cheapest hotel on date " + date +" is hotel: " + hotelID);

        System.out.println("Booking hotel on date " + date);
        int returnCode = booking.bookRoomInHotel(date, hotelID);

        System.out.println("Booking room: " + (returnCode == 0 ? "successful" : "failed: returncode = " + returnCode) + "\n");

        System.out.println("Booking again a room on date 10 in hotel 2 will result in failure due to overbooking");
        returnCode = booking.bookRoomInHotel(date, hotelID);
        System.out.println("Booking room: " + (returnCode == 0 ? "successful" : "failed: returncode = " + returnCode) + "\n");
    }

    public void initialize() {

        Hotel hotel0 = new Hotel(30.0);
        hotel0.addRoom();
        hotel0.addRoom();
        hotel0.addRoom();
        hotel0.bookRoom(10, 0);
        hotel0.bookRoom(10, 1);
        hotel0.bookRoom(10, 2);
        hotel0.bookRoom(11, 0);
        hotel0.bookRoom(11, 1);
        hotel0.bookRoom(11, 2);
        hotel0.bookRoom(12, 2);

        Hotel hotel1 = new Hotel(46.99);
        hotel1.addRoom();
        hotel1.addRoom();
        hotel1.bookRoom(10, 0);
        hotel1.bookRoom(10, 1);
        hotel1.bookRoom(11, 0);
        hotel1.bookRoom(12, 1);

        Hotel hotel2 = new Hotel(40.0);
        hotel2.addRoom();
        hotel2.bookRoom(11, 0);

        booking = new Booking();
        booking.addHotel(hotel0);
        booking.addHotel(hotel1);
        booking.addHotel(hotel2);
    }
}