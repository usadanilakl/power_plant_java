package com.dk_power.power_plant_java.config.diagnostics;

import java.security.Principal;
import java.util.Set;

public record AiDiagnosticsPrincipal(String identity, Set<AiDiagnosticsScope> scopes) implements Principal {

    public AiDiagnosticsPrincipal {
        scopes = Set.copyOf(scopes);
    }

    @Override
    public String getName() {
        return identity;
    }

    public boolean hasScope(AiDiagnosticsScope scope) {
        return scopes.contains(scope);
    }
}
