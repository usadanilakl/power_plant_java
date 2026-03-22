[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$DatabasePath = "",
    [string]$User = "sa",
    [string]$Password = "password",
    [switch]$Execute,
    [switch]$Compact,
    [string]$H2Jar
)

$ErrorActionPreference = "Stop"

function Resolve-H2Jar {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        if (-not (Test-Path -LiteralPath $RequestedPath)) {
            throw "H2 jar not found: $RequestedPath"
        }
        return (Resolve-Path -LiteralPath $RequestedPath).Path
    }

    $repoRoot = Join-Path $env:USERPROFILE ".m2\repository\com\h2database\h2"
    if (-not (Test-Path -LiteralPath $repoRoot)) {
        throw "Could not find local H2 Maven cache at $repoRoot. Pass -H2Jar explicitly."
    }

    $candidate = Get-ChildItem -Path $repoRoot -Recurse -Filter "h2-*.jar" |
        Where-Object { $_.Name -notmatch "-sources|-javadoc" } |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    if (-not $candidate) {
        throw "No H2 runtime jar found under $repoRoot. Pass -H2Jar explicitly."
    }

    return $candidate.FullName
}

function Resolve-DatabaseBasePath {
    param([string]$InputPath)

    if ([string]::IsNullOrWhiteSpace($InputPath)) {
        $InputPath = Join-Path $PSScriptRoot "..\db\proddb"
    }

    $resolved = Resolve-Path -LiteralPath $InputPath -ErrorAction SilentlyContinue
    $path = if ($resolved) { $resolved.Path } else { [System.IO.Path]::GetFullPath($InputPath) }

    if ($path.EndsWith(".mv.db", [System.StringComparison]::OrdinalIgnoreCase)) {
        return $path.Substring(0, $path.Length - 6)
    }

    if ($path.EndsWith(".h2.db", [System.StringComparison]::OrdinalIgnoreCase)) {
        return $path.Substring(0, $path.Length - 6)
    }

    return $path
}

$h2JarPath = Resolve-H2Jar -RequestedPath $H2Jar
$dbBasePath = Resolve-DatabaseBasePath -InputPath $DatabasePath
$jdbcPath = ($dbBasePath -replace "\\", "/")
$jdbcUrl = "jdbc:h2:file:$jdbcPath"

$workDir = Join-Path $env:TEMP ("drop-envers-audit-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

$javaSource = Join-Path $workDir "DropEnversAuditTables.java"
$executeLiteral = if ($Execute) { "true" } else { "false" }
$compactLiteral = if ($Compact) { "true" } else { "false" }

$scriptContent = @"
import java.sql.*;
import java.util.*;

public class DropEnversAuditTables {
    public static void main(String[] args) throws Exception {
        Class.forName("org.h2.Driver");

        String jdbcUrl = "$jdbcUrl";
        String user = "$User";
        String password = "$Password";
        boolean executeDrops = $executeLiteral;
        boolean compactDb = $compactLiteral;

        List<String> tables = new ArrayList<>();
        List<String> sampleTables = new ArrayList<>();
        int totalTableCount = 0;

        try (Connection conn = DriverManager.getConnection(jdbcUrl, user, password)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) " +
                    "FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = 'PUBLIC'")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        totalTableCount = rs.getInt(1);
                    }
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT TABLE_NAME " +
                    "FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = 'PUBLIC' " +
                    "ORDER BY TABLE_NAME " +
                    "LIMIT 15")) {
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        sampleTables.add(rs.getString(1));
                    }
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT TABLE_NAME " +
                    "FROM INFORMATION_SCHEMA.TABLES " +
                    "WHERE TABLE_SCHEMA = 'PUBLIC' " +
                    "AND (TABLE_NAME = 'REVINFO' OR RIGHT(TABLE_NAME, 4) = '_AUD') " +
                    "ORDER BY TABLE_NAME")) {
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        tables.add(rs.getString(1));
                    }
                }
            }

            System.out.println("Database: " + jdbcUrl);
            System.out.println("Total PUBLIC tables: " + totalTableCount);
            System.out.println("Sample tables:");
            for (String table : sampleTables) {
                System.out.println("  " + table);
            }
            System.out.println("Matched tables: " + tables.size());
            for (String table : tables) {
                System.out.println("  " + table);
            }

            if (!executeDrops) {
                System.out.println();
                System.out.println("Dry run only. Re-run with -Execute to drop these tables.");
            } else {
                try (Statement stmt = conn.createStatement()) {
                    for (String table : tables) {
                        String sql = "DROP TABLE IF EXISTS \"" + table + "\" CASCADE";
                        System.out.println("Executing: " + sql);
                        stmt.execute(sql);
                    }

                    if (compactDb) {
                        System.out.println("Executing: SHUTDOWN COMPACT");
                        stmt.execute("SHUTDOWN COMPACT");
                    }
                }
            }
        }
    }
}
"@

Set-Content -LiteralPath $javaSource -Value $scriptContent -Encoding ASCII

try {
    Write-Host "Using H2 jar: $h2JarPath"
    Write-Host "Target DB:   $dbBasePath"

    if (-not $Execute) {
        Write-Host "Mode:        dry run"
    } elseif ($Compact) {
        Write-Host "Mode:        execute drops + compact"
    } else {
        Write-Host "Mode:        execute drops"
    }

    & java "--class-path" $h2JarPath $javaSource
    if ($LASTEXITCODE -ne 0) {
        throw "java exited with code $LASTEXITCODE"
    }
}
finally {
    Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
}
