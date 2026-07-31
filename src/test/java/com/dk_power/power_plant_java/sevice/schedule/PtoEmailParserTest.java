package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.sevice.schedule.PtoEmailParser.ParsedPto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Locks the {@link PtoEmailParser} heuristics so future regex tuning against real mail can't silently
 * regress the extraction contract. The parser is fail-safe: it extracts confidently where it can and
 * leaves fields {@code null} otherwise (the intake service routes those to manual review).
 *
 * <p>NOTE: these fixtures are <b>representative, not captured from production</b> — the only hard
 * contract is the {@code ShowPage.do?id=N} source id. Replace/extend with a real forwarded email to
 * pin the name/date heuristics to the actual workforce-system format.
 */
@DisplayName("PtoEmailParser")
class PtoEmailParserTest {

    @Test
    @DisplayName("REAL WorkForce Software notification (Ziegler): Last,First name + for/to range + Checkpoint-wrapped id")
    void realWorkforceNotification() {
        String body = """
                Begin forwarded message:

                From: Time and Attendance System <naes.payroll@wfs.cloud>
                Date: July 29, 2026 at 7:16:42 AM CDT
                To: "Sedler, Ryan" <Ryan.Sedler@naes.com>, "Freese, Scott" <Scott.Freese@naes.com>
                Subject: Time Off Request Notification: Ziegler, Kody W

                WARNING: This email originated from outside your organization.
                Do not click links or open attachments unless you recognize the sender and know the contents are safe.

                Employee Ziegler, Kody W has submitted a time off request for 08/26/2026 to 08/27/2026. \
                https://protect.checkpoint.com/v2/r01/___https://naes.wta-us8.wfs.cloud/workforce/ShowPage.do?id=5911339749___.YzJ1Ompwb3dlcnVzYQ
                """;
        ParsedPto p = PtoEmailParser.parse("Time Off Request Notification: Ziegler, Kody W", body);

        assertThat(p.name()).isEqualTo("Kody Ziegler");           // "Last, First M" reordered
        assertThat(p.startDate()).isEqualTo(LocalDate.of(2026, 8, 26));
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2026, 8, 27));
        assertThat(p.sourceRequestId()).isEqualTo("5911339749");  // unwrapped from the Checkpoint URL
    }

    @Test
    @DisplayName("labeled Outlook-forwarded email: name + start/end + source id, chrome ignored")
    void labeledForward() {
        String body = """
                From: scheduler@workforce.com
                Sent: Monday, July 28, 2025 3:14 PM
                To: Supervisor
                Subject: PTO Request Approved

                Employee: John Smith
                Start Date: 07/28/2025
                End Date: 08/01/2025
                Status: Approved
                View request: https://workforce.example.com/ShowPage.do?id=44821&src=email
                """;
        ParsedPto p = PtoEmailParser.parse("FW: PTO Request - John Smith", body);

        assertThat(p.name()).isEqualTo("John Smith");
        assertThat(p.startDate()).isEqualTo(LocalDate.of(2025, 7, 28));
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2025, 8, 1));
        assertThat(p.sourceRequestId()).isEqualTo("44821");   // stops at '&', ignores query tail
        assertThat(p.hasDates()).isTrue();
    }

    @Test
    @DisplayName("single-day request: one date mirrors to both bounds; name from subject")
    void singleDayNameFromSubject() {
        String body = "Jane has requested 9/5/2025 off.\nRef: ShowPage.do?id=99";
        ParsedPto p = PtoEmailParser.parse("Time Off - Jane Doe", body);

        assertThat(p.name()).isEqualTo("Jane Doe");
        assertThat(p.startDate()).isEqualTo(LocalDate.of(2025, 9, 5));
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2025, 9, 5));
        assertThat(p.sourceRequestId()).isEqualTo("99");
    }

    @Test
    @DisplayName("HTML body: block tags become breaks; labels + cross-year range parse")
    void htmlBody() {
        String body = "<html><body>"
                + "<p>Employee: Bob Lee</p>"
                + "<p>Start: 12/30/2025</p>"
                + "<p>End: 1/2/2026</p>"
                + "<p><a href=\"http://wf/ShowPage.do?id=7\">req</a></p>"
                + "</body></html>";
        ParsedPto p = PtoEmailParser.parse("Vacation request", body);

        assertThat(p.name()).isEqualTo("Bob Lee");
        assertThat(p.startDate()).isEqualTo(LocalDate.of(2025, 12, 30));
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2026, 1, 2));
        assertThat(p.sourceRequestId()).isEqualTo("7");
    }

    @Test
    @DisplayName("no labels: min/max of body dates, skipping 'Sent:' chrome dates")
    void minMaxIgnoringChrome() {
        String body = """
                From: hr@x.com
                Sent: 7/1/2025 8:00 AM
                Employee: Al Green
                7/4/2025
                7/7/2025
                ShowPage.do?id=5
                """;
        ParsedPto p = PtoEmailParser.parse("PTO", body);

        assertThat(p.name()).isEqualTo("Al Green");
        assertThat(p.startDate()).isEqualTo(LocalDate.of(2025, 7, 4));   // 7/1 (Sent chrome) excluded
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2025, 7, 7));
        assertThat(p.sourceRequestId()).isEqualTo("5");
    }

    @Test
    @DisplayName("inverted labeled bounds are swapped, not left backwards")
    void invertedBoundsSwapped() {
        ParsedPto p = PtoEmailParser.parse("PTO", "Start: 8/10/2025\nEnd: 8/3/2025");

        assertThat(p.startDate()).isEqualTo(LocalDate.of(2025, 8, 3));
        assertThat(p.endDate()).isEqualTo(LocalDate.of(2025, 8, 10));
    }

    @Test
    @DisplayName("unrecognized label + generic subject: no name, no dates → empty (manual review)")
    void nothingParsable() {
        ParsedPto p = PtoEmailParser.parse("PTO question",
                "Can I take some time off next month? Thanks.");

        assertThat(p.hasName()).isFalse();
        assertThat(p.hasDates()).isFalse();
        assertThat(p.sourceRequestId()).isNull();
        assertThat(p.isEmpty()).isTrue();
    }

    @Test
    @DisplayName("reply prefix stripped before mining subject for a name")
    void replyPrefixStripped() {
        ParsedPto p = PtoEmailParser.parse("RE: Vacation for Maria Gomez", "no dates here");
        assertThat(p.name()).isEqualTo("Maria Gomez");
    }
}
