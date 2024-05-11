package com.dk_power.power_plant_java.entities.permits.tickets;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

@Entity
@Data
@NoArgsConstructor
@Audited
public class Ticket extends BaseTicket {
}
