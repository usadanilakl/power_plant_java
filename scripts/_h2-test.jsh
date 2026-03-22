import java.sql.*;
Class.forName("org.h2.Driver");
try (Connection c = DriverManager.getConnection("jdbc:h2:mem:test_db", "sa", "")) {
  try (Statement s = c.createStatement()) {
    s.execute("CREATE TABLE REVINFO(ID INT)");
    s.execute("CREATE TABLE SAFE_WORK_AUD(ID INT)");
  }
  try (PreparedStatement ps = c.prepareStatement("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='PUBLIC' AND (TABLE_NAME='REVINFO' OR TABLE_NAME LIKE ? ESCAPE '\\\\') ORDER BY TABLE_NAME")) {
    ps.setString(1, "%\\_AUD");
    try (ResultSet rs = ps.executeQuery()) {
      while (rs.next()) {
        System.out.println(rs.getString(1));
      }
    }
  }
}
/exit
