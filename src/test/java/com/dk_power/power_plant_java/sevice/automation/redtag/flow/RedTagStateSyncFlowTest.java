package com.dk_power.power_plant_java.sevice.automation.redtag.flow;

import com.dk_power.power_plant_java.sevice.automation.redtag.config.RedTagAutomationProperties;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;
import com.dk_power.power_plant_java.sevice.automation.redtag.core.SikuliDriver;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagRow;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagStatus;
import org.junit.jupiter.api.Test;
import org.sikuli.script.Match;
import org.sikuli.script.Location;
import org.sikuli.script.Region;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedTagStateSyncFlowTest {

    @Test
    void resetsAnAlreadyOpenViewBeforeDoubleClickingTargetStatusWord() {
        SikuliDriver driver = mock(SikuliDriver.class);
        RedTagAutomationProperties properties = new RedTagAutomationProperties();
        Match groupedStatusHeader = line(80, 90, 50, 20, "Status");
        Match statusLabel = line(120, 180, 100, 20, "Active");
        when(driver.findOpt(RedTagPattern.LIST_STATUS_COLUMN_HEADER, 2))
                .thenReturn(groupedStatusHeader);
        when(driver.findOpt(RedTagStatus.ACTIVE.collapsedPattern(), 5))
                .thenReturn(statusLabel);

        RedTagStateSyncFlow flow = new RedTagStateSyncFlow(driver, properties);

        assertThat(flow.expandTab(RedTagStatus.ACTIVE))
                .isEqualTo("ACTIVE tab expanded from reset state");
        verify(driver).dragDropTo(eq(RedTagPattern.LIST_STATUS_COLUMN_HEADER), any(Location.class));
        verify(driver).dragDrop(RedTagPattern.LIST_STATUS_COLUMN_HEADER,
                RedTagPattern.LIST_GROUPING_BAND_EMPTY);
        verify(driver).doubleClickOffset(statusLabel, statusLabel.w / 4, 0);
        verify(driver).waitFor(RedTagStatus.ACTIVE.expandedPattern(), 10);
        verify(driver, never()).exists(RedTagStatus.ACTIVE.expandedPattern(), 1.5);
    }

    @Test
    void anchorsRowsOnlyOnValidLotoNumbersAndReadsCellsByYBand() {
        SikuliDriver driver = mock(SikuliDriver.class);
        RedTagAutomationProperties properties = new RedTagAutomationProperties();
        properties.setStateSyncMaxRows(2);
        properties.setStateSyncRowsRegionHeight(500);
        properties.setStateSyncCellVerticalPadding(2);
        properties.setStateSyncDefaultRowHeight(32);
        properties.setStateSyncMaxRowHeight(64);

        when(driver.screenWidth()).thenReturn(1000);
        when(driver.screenHeight()).thenReturn(900);
        // Deliberately shuffled visual order: Job, Owner, LOTO, Lock Box.
        // Semantic extraction must follow the located header, not a fixed x order.
        when(driver.waitFor(RedTagPattern.LIST_COL_JOB_DESCRIPTION, 8))
                .thenReturn(line(100, 100, 180, 20, "Job Description"));
        when(driver.waitFor(RedTagPattern.LIST_COL_OWNER_PHOTOS, 8))
                .thenReturn(line(350, 100, 140, 20, "Owner Photos"));
        when(driver.waitFor(RedTagPattern.LIST_COL_LOTO_NUMBER, 8))
                .thenReturn(line(600, 100, 100, 20, "LOTO Number"));
        when(driver.waitFor(RedTagPattern.LIST_COL_LOCK_BOX_DESCRIPTION, 8))
                .thenReturn(line(800, 100, 180, 20, "Lock Box Description"));
        when(driver.findOpt(any(RedTagPattern.class), anyDouble())).thenReturn(null);
        when(driver.region(anyInt(), anyInt(), anyInt(), anyInt())).thenAnswer(invocation ->
                new Region(
                        invocation.getArgument(0), invocation.getArgument(1),
                        invocation.getArgument(2), invocation.getArgument(3)));

        // A wrapped/garbage OCR line appears between the two real numbers. It
        // must not create a row or shift the second row's cells.
        when(driver.readLines(any(Region.class))).thenReturn(List.of(
                line(105, 160, 70, 18, "12345"),
                line(105, 184, 120, 18, "wrapped words"),
                line(105, 210, 70, 18, "12346")));
        when(driver.readText(any(Region.class))).thenAnswer(invocation -> {
            Region cell = invocation.getArgument(0);
            boolean firstRow = cell.y < 200;
            if (cell.x < 300) return firstRow ? "Pump\ninspection" : "Valve replacement";
            if (cell.x < 600) return firstRow ? "" : "Jane Doe";
            return firstRow ? "20 Loto set" : "Box 8";
        });

        RedTagStateSyncFlow flow = new RedTagStateSyncFlow(driver, properties);
        List<RedTagRow> rows = flow.scrapeRows(RedTagStatus.ACTIVE);

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).getLotoNumber()).isEqualTo("12345");
        assertThat(rows.get(0).getJobDescription()).isEqualTo("Pump inspection");
        assertThat(rows.get(0).getLockBox()).isEqualTo("20 Loto set");
        assertThat(rows.get(0).getRequestor()).isBlank();
        assertThat(rows.get(1).getLotoNumber()).isEqualTo("12346");
        assertThat(rows.get(1).getJobDescription()).isEqualTo("Valve replacement");
        assertThat(rows.get(1).getLockBox()).isEqualTo("Box 8");
        assertThat(rows.get(1).getRequestor()).isEqualTo("Jane Doe");
        verify(driver).readLines(any(Region.class));
    }

    @Test
    void parsesOnlyLeadingFourToSixDigitLotoNumbers() {
        assertThat(RedTagStateSyncFlow.parseLotoNumber(" 1234 details")).isEqualTo("1234");
        assertThat(RedTagStateSyncFlow.parseLotoNumber("123456")).isEqualTo("123456");
        assertThat(RedTagStateSyncFlow.parseLotoNumber("description 12345")).isBlank();
        assertThat(RedTagStateSyncFlow.parseLotoNumber("1234567")).isBlank();
    }

    private static Match line(int x, int y, int width, int height, String text) {
        return new Match(x, y, width, height, 0.99, null) {
            @Override
            public String getText() {
                return text;
            }
        };
    }
}
