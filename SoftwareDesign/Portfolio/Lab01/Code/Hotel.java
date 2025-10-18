// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab01.Code;

import java.util.HashMap;
import java.util.Map;

public class Hotel {
    private HashMap<Integer, Room> rooms;
    private int roomCount = 0;
    private double pricePerRoom;

    public Hotel(double pricePerRoom) {
        this.rooms = new HashMap<>();
        this.pricePerRoom = pricePerRoom;
    }

    private boolean isValidDate(long date) {
        return date >= 0L;
    }

    private boolean isValidDateRange(long startDate, long endDate) {
        return isValidDate(startDate) && isValidDate(endDate) && startDate <= endDate;
    }

    private boolean isRoomFree(Room room, long startDate, long endDate) {
        for (long d = startDate; d <= endDate; d++) {
            if (room.getBooking(d)) {
                return false;
            }
        }
        return true;
    }

    public void addRoom() {
        Room newRoom = new Room();
        this.rooms.put(roomCount, newRoom);

        this.roomCount++;
    }

    public int checkAvailability(long date) {
        int returnValue = -1;
        if (isValidDate(date) && !this.rooms.isEmpty()) {
            for (Map.Entry<Integer, Room> e : this.rooms.entrySet()) {
                int roomID = e.getKey();
                Room room = e.getValue();
                if (!room.getBooking(date)) returnValue = roomID;
            }
        }

        return returnValue;
    }

    public int checkAvailability(long startDate, long endDate) {
        if (isValidDateRange(startDate, endDate) && !this.rooms.isEmpty()) {
            for (Map.Entry<Integer, Room> e : this.rooms.entrySet()) {
                int roomID = e.getKey();
                Room room = e.getValue();
                if (isRoomFree(room, startDate, endDate)) return roomID;
            }
        }
        return -2;
    }

    public int bookRoom(long date, int roomID) {
        int result = -1; // default: failure

        if (isValidDate(date)) {
            Room room = this.rooms.get(roomID);
            if (room != null && !room.getBooking(date)) {
                room.setBooking(date, true);
                result = 0; // success
            }
        }

        return result;
    }

    public int bookRoom(long startDate, long endDate, int roomID) {
        int result = -1; // default: failure

        if (isValidDateRange(startDate, endDate)) {
            Room room = this.rooms.get(roomID);
            if (room != null && isRoomFree(room, startDate, endDate)) {
                for (long d = startDate; d <= endDate; d++) {
                    room.setBooking(d, true);
                }
                result = 0; // success
            }
        }

        return result;
    }

    public double getPricePerRoom() {
        return this.pricePerRoom;
    }
}