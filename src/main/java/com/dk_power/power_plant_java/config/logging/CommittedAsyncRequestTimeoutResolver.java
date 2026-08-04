package com.dk_power.power_plant_java.config.logging;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

/**
 * Suppresses the pair of framework WARN messages emitted when an async/SSE
 * request times out after its response has already been committed.
 *
 * <p>An uncommitted timeout is deliberately left to Spring's default resolver,
 * which preserves the normal 503 response and warning. Every other exception
 * is also passed through unchanged.</p>
 */
@Component
@Slf4j
public class CommittedAsyncRequestTimeoutResolver implements HandlerExceptionResolver, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public ModelAndView resolveException(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception exception
    ) {
        if (!(exception instanceof AsyncRequestTimeoutException) || !response.isCommitted()) {
            return null;
        }

        log.debug("http.async.timeout_after_commit method={} path={}",
            request.getMethod(), request.getRequestURI());
        return new ModelAndView();
    }
}
