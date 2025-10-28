// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab02.Code.Relations;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.Comparator;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        Festival festA = new Festival("FilmFest 2025");
        Festival festB = new Festival("IndieNights");

        Venue hallA = new Venue("Hall A", 3);
        Venue hallB = new Venue("Hall B", 5);

        festA.registerVenue(hallA);
        festA.registerVenue(hallB);
        festB.registerVenue(hallA); // same instance used by both

        Work sunrise = new FeatureFilm("Sunrise", 120);
        Work blink = new ShortFilm("Blink", 12);
        Work moon = new FeatureFilm("Moon", 105);

        var base = LocalDateTime.of(2025, Month.NOVEMBER, 5, 18, 0);

        var s1 = festA.getProgram().schedule(sunrise, hallA, base.plusDays(1), 3);
        var s2 = festA.getProgram().schedule(blink, hallB, base.plusDays(1).plusHours(2), 4);

        var s3 = festB.getProgram().schedule(moon, hallA, base.plusDays(2).plusHours(1), 2);

        Staff usher = new Staff("Uma");
        Staff tech = new Staff("Theo");

        s1.assign(usher);
        s1.assign(tech);
        s2.assign(tech);

        Attendee anna = new Attendee("Anna");
        Attendee bob = new Attendee("Bob");
        Attendee chris = new Attendee("Chris");

        s1.book(anna, "A1", price("12.00"));
        s1.book(bob, "A2", price("12.00"));
        s1.book(chris, "A3", price("12.00"));
        try {
            s1.book(new Attendee("Overflow"), "A4", price("12.00"));
        } catch (Exception ex) {
            System.out.println("[s1] " + ex.getMessage());
        }

        s2.book(anna, "B1", price("10.00"));

        s3.book(bob, "C1", price("11.00"));
        s3.book(anna, "C2", price("11.00"));
        try {
            s3.book(new Attendee("Overflow-2"), "C3", price("11.00"));
        } catch (Exception ex) {
            System.out.println("[s3] " + ex.getMessage());
        }

        printFestival(festA);
        printFestival(festB);
        printPersonSummaries(anna, bob, chris);
    }

    private static BigDecimal price(String s) {
        return new BigDecimal(s);
    }

    private static void printFestival(Festival f) {
        System.out.println("\n=== " + f.getName() + " ===");
        System.out.println("Venues: " + f.getVenues().size());
        var list = f.getProgram().getScreenings().stream()
                .sorted(Comparator.comparing(Screening::getStartTime))
                .collect(Collectors.toList());
        for (var sc : list) {
            System.out.println(" • " + sc.getWork().getTitle()
                    + " @ " + sc.getVenue().getName()
                    + " [" + sc.getCapacity() + "]"
                    + " crew=" + sc.getCrew().stream().map(Staff::getName).sorted().collect(Collectors.joining("+"))
                    + " bookings=" + sc.getBookings().size());
        }
    }

    private static void printPersonSummaries(Attendee a1, Attendee a2, Attendee a3) {
        System.out.println("\n=== Attendees ===");
        for (var a : new Attendee[]{a1, a2, a3}) {
            var details = a.getBookings().stream()
                    .map(b -> b.getScreening().getWork().getTitle() + "@" + b.getScreening().getVenue().getName()
                            + "(" + b.getSeatLabel() + ")")
                    .collect(Collectors.joining(", "));
            System.out.println(" - " + a.getName() + ": " + a.getBookings().size() + " -> " + details);
        }
    }
}