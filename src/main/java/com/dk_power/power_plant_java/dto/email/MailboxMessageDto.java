package com.dk_power.power_plant_java.dto.email;

/** A message from the shared mailbox (Inbox/Sent folder) for the Correspondence Inbox/Outbox tabs. */
public record MailboxMessageDto(
        String id,
        String subject,
        String from,
        String to,
        String date,
        boolean isRead,
        String direction,   // INBOUND | OUTBOUND
        String snippet,
        String conversationId) {}
