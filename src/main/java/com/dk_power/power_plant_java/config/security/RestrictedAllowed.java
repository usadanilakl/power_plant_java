package com.dk_power.power_plant_java.config.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller or method as accessible by restricted external users
 * (those authenticated but without an ACCESS_TOKEN grant).
 *
 * <p>Endpoints WITHOUT this annotation require full access (ACCESS_TOKEN)
 * for external authenticated users. Secure by default.</p>
 *
 * <p>Method-level annotation takes priority over class-level.</p>
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RestrictedAllowed {
}
