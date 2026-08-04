package com.dk_power.power_plant_java.config.logging;

import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CommittedAsyncRequestTimeoutResolverTest {

    private final CommittedAsyncRequestTimeoutResolver resolver =
        new CommittedAsyncRequestTimeoutResolver();

    @Test
    void resolvesOnlyAsyncTimeoutsAfterTheResponseIsCommitted() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sync/updates");
        MockHttpServletResponse committedResponse = new MockHttpServletResponse();
        committedResponse.setCommitted(true);

        var handled = resolver.resolveException(
            request, committedResponse, null, new AsyncRequestTimeoutException());
        assertNotNull(handled);
        assertTrue(handled.isEmpty());

        MockHttpServletResponse uncommittedResponse = new MockHttpServletResponse();
        assertNull(resolver.resolveException(
            request, uncommittedResponse, null, new AsyncRequestTimeoutException()));

        assertNull(resolver.resolveException(
            request, committedResponse, null, new IllegalStateException("unexpected")));
    }

    @Test
    void runsBeforeSpringsDefaultExceptionResolvers() {
        assertEquals(Ordered.HIGHEST_PRECEDENCE, resolver.getOrder());
    }
}
