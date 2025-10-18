// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab01.Code;

import java.util.HashMap;
import java.util.Map;

public class Booking {
    private HashMap<Integer, Hotel> hotels;
    private int hotelCount = 0;

    public Booking() {
        this.hotels = new HashMap<>();
    }

    public void addHotel(Hotel h) {
        this.hotels.put(hotelCount, h);
        hotelCount++;
    }

    public void removeHotel(Hotel h) {
        if (h == null || this.hotels.isEmpty()) return;
        Integer idToRemove = null;
        for (Map.Entry<Integer, Hotel> e : this.hotels.entrySet()) {
            if (java.util.Objects.equals(e.getValue(), h)) {
                idToRemove = e.getKey();
                break;
            }
        }
        if (idToRemove != null) this.hotels.remove(idToRemove);
    }

    public Map<Integer, Hotel> getHotels() {
        return this.hotels;
    }

    public int findCheapestHotel(long date) {
        double cheapestPrice = Double.MAX_VALUE;
        int cheapestHotelID = -1;

        for (Map.Entry<Integer, Hotel> entry : hotels.entrySet()) {
            int e_hotelID = entry.getKey();
            Hotel e_hotel = entry.getValue();

            if (e_hotel.checkAvailability(date) != -1 && e_hotel.getPricePerRoom() < cheapestPrice) {
                cheapestHotelID = e_hotelID;
                cheapestPrice = e_hotel.getPricePerRoom();
            }
        }

        return cheapestHotelID;
    }

    public int bookRoomInHotel(long date, int hotelID) {
        if (hotelID < 0 || !this.hotels.containsKey(hotelID)) return -1;

        Hotel hotel = this.hotels.get(hotelID);
        int roomID = hotel.checkAvailability(date);
        if (roomID != -1) return hotel.bookRoom(date, roomID);

        return -1;
    }

    public int bookRoomInHotel(long startDate, long endDate, int hotelID) {
        if (hotelID < 0 || !this.hotels.containsKey(hotelID)) return -1;
        if (startDate < 0 || endDate < 0 || startDate > endDate) return -1;

        Hotel hotel = this.hotels.get(hotelID);
        int roomID = hotel.checkAvailability(startDate, endDate);
        if (roomID != -1) return hotel.bookRoom(startDate, endDate, roomID);

        return -1;
    }

    public int bookRoomInCheapestHotel(long startDate, long endDate) {
        if (startDate < 0 || endDate < 0 || startDate > endDate) return -1;

        double cheapestPrice = Double.MAX_VALUE;
        int cheapestHotelID = -1;

        for (Map.Entry<Integer, Hotel> entry : hotels.entrySet()) {
            int e_hotelID = entry.getKey();
            Hotel e_hotel = entry.getValue();

            int avail = e_hotel.checkAvailability(startDate, endDate);
            if (avail >= 0 && e_hotel.getPricePerRoom() < cheapestPrice) {
                cheapestHotelID = e_hotelID;
                cheapestPrice = e_hotel.getPricePerRoom();
            }
        }

        if (cheapestHotelID != -1 && (bookRoomInHotel(startDate, endDate, cheapestHotelID) == 0)) return cheapestHotelID;
        return -1;
    }
}