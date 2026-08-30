package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The text rule decides where work appears on the plant map, and a wrong answer is worse than no
 * answer — it draws a job somewhere it is not happening. These are the cases that make it either
 * safe or dangerous.
 *
 * <p>{@code buildIndex(List)} touches no collaborator, so the resolver is built with a null repo.
 */
class WorkAreaLocationResolverTest {

    private final WorkAreaLocationResolver resolver = new WorkAreaLocationResolver(null);

    private static WorkArea area(long id, String name) {
        WorkArea area = new WorkArea();
        area.setId(id);
        area.setName(name);
        return area;
    }

    private WorkAreaLocationResolver.Index index(WorkArea... areas) {
        return resolver.buildIndex(List.of(areas));
    }

    @Test
    @DisplayName("an exact area name resolves to that area")
    void exactName() {
        assertThat(index(area(1, "Boiler Room")).match("Boiler Room")).isEqualTo(1L);
    }

    @Test
    @DisplayName("the PWA's composed \"<Area> - <detail>\" string resolves to the area")
    void composedPwaString() {
        // This is the whole reason the rule exists: the requester picked the area on the map, but
        // only the composed text survives when the payload reaches us without a workAreaId.
        assertThat(index(area(7, "Turbine Deck")).match("Turbine Deck - east side by the rail"))
                .isEqualTo(7L);
    }

    @Test
    @DisplayName("the longest matching name wins, not the first one found")
    void longestNameWins() {
        WorkAreaLocationResolver.Index idx = index(
                area(1, "Boiler"),
                area(2, "Boiler Feed Pump Room"));
        assertThat(idx.match("Boiler Feed Pump Room - north wall")).isEqualTo(2L);
        // ...and the short name still works on its own.
        assertThat(idx.match("Boiler - 3rd floor")).isEqualTo(1L);
    }

    @Test
    @DisplayName("a name inside a longer word is not a match")
    void respectsWordBoundaries() {
        assertThat(index(area(1, "Boiler")).match("Reboiler deck")).isNull();
        assertThat(index(area(1, "Ash")).match("Washroom")).isNull();
    }

    @Test
    @DisplayName("separators and case do not matter")
    void normalizesSeparators() {
        WorkAreaLocationResolver.Index idx = index(area(4, "Unit 1 Boiler"));
        assertThat(idx.match("UNIT-1/BOILER")).isEqualTo(4L);
        assertThat(idx.match("  unit   1 :: boiler  ")).isEqualTo(4L);
        assertThat(idx.match("Work at unit 1 boiler, west platform")).isEqualTo(4L);
    }

    @Test
    @DisplayName("names shorter than three characters are never matched")
    void ignoresVeryShortNames() {
        // "U1" appears inside ordinary location prose constantly; one false placement costs more
        // than every true one such a name would find.
        assertThat(index(area(1, "U1")).match("U1 boiler feed pump")).isNull();
    }

    @Test
    @DisplayName("no text, no areas, or no match all resolve to nothing rather than a guess")
    void resolvesToNullRatherThanGuessing() {
        WorkAreaLocationResolver.Index idx = index(area(1, "Boiler Room"));
        assertThat(idx.match(null)).isNull();
        assertThat(idx.match("   ")).isNull();
        assertThat(idx.match("somewhere nobody named")).isNull();
        assertThat(index().isEmpty()).isTrue();
        assertThat(index().match("Boiler Room")).isNull();
    }

    @Test
    @DisplayName("equally good matches break to the smaller id, so two nodes agree")
    void tieBreaksDeterministically() {
        // Duplicate names exist in this database. Both nodes must land on the same one or the map
        // shows the same permit in different places depending on which desktop you are sitting at.
        WorkAreaLocationResolver.Index idx = index(
                area(9, "Pump House"),
                area(3, "Pump House"));
        assertThat(idx.match("Pump House - south door")).isEqualTo(3L);
    }

    @Test
    @DisplayName("a null or blank area name never becomes a wildcard")
    void skipsUnnamedAreas() {
        WorkAreaLocationResolver.Index idx = index(
                area(1, null),
                area(2, "   "),
                area(3, "Coal Yard"));
        assertThat(idx.match("Coal Yard")).isEqualTo(3L);
        assertThat(idx.match("anything at all")).isNull();
    }
}
