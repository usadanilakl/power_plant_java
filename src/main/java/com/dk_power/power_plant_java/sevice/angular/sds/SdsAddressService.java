package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Suggests the next physical filing address (book + section) for a chemical.
 * <p>
 * Derived from the synced chemical data (max book → next section in that book), floored by a config
 * baseline that seeds the current real-world physical-book position. No mutable counter is kept — a
 * stored counter would drift across offline desktops. Both hub and desktops compute the same value
 * from their synced data; concurrent-offline collisions are corrected manually by the user, who
 * approves/edits the suggested address before filing.
 */
@Service
@RequiredArgsConstructor
public class SdsAddressService {

    /** Current physical book in use (seed baseline; matters until live data overtakes it). */
    @Value("${sds.book.current-book-number:1}")
    private int currentBookNumber;

    /** Highest section already used in the current physical book (seed baseline). */
    @Value("${sds.book.current-max-section:0}")
    private int currentMaxSection;

    private final SdsChemicalRepo repo;

    public record Address(int bookNumber, int sectionNumber) {}

    /** Suggest the next address: the latest book and its next free section. */
    public Address suggestNextAddress() {
        Integer dataMaxBook = repo.findMaxBookNumber();
        int latestBook = Math.max(currentBookNumber, dataMaxBook != null ? dataMaxBook : 0);
        if (latestBook < 1) latestBook = 1;

        Integer dataMaxSection = repo.findMaxSectionInBook(latestBook);
        int maxSection = dataMaxSection != null ? dataMaxSection : 0;
        if (latestBook == currentBookNumber) {
            maxSection = Math.max(maxSection, currentMaxSection);
        }
        return new Address(latestBook, maxSection + 1);
    }
}
