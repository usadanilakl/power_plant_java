package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.util.UUID;

/**
 * Keeps an already-assigned {@link FieldChange} id; mints a random UUID otherwise.
 *
 * <p><b>Why this exists.</b> A change must carry ONE identity for its whole life, on every machine.
 * The origin already assigns a UUID at emission and it already crosses the wire — but the receivers
 * copy the payload into a fresh row, and {@code @GeneratedValue(strategy = UUID)} then mints a NEW id,
 * so the same logical change ends up with a different identity on every node. That breaks three things
 * at once: re-delivery can't be an idempotent upsert (no stable key to check), the change id can't be
 * the final tiebreak in the conflict comparator (it isn't global), and hub-side apply state can't be
 * keyed by change.
 *
 * <p><b>Why a generator rather than just setting the field.</b> Hibernate's UUID generator runs on
 * persist regardless of any value already present — verified empirically: saving a FieldChange with a
 * pre-set id returned a different one. So "preserve the origin's id" is impossible via {@code save()}
 * alone; the generator itself has to honour the assigned value. This mirrors the codebase's existing
 * {@code DevicePrefixedIdGenerator}, which does exactly this for {@code BaseIdEntity} so that entities
 * arriving from sync keep their origin ids.
 *
 * <p>Locally-emitted changes leave the id null and get a random UUID here — unchanged behaviour.
 */
public class AssignedOrRandomUuidGenerator implements IdentifierGenerator {

    @Override
    public Object generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        if (object instanceof FieldChange fc) {
            UUID existing = fc.getId();
            // A change replicated from another machine arrives with its origin id already set — keep it,
            // so this row is the SAME change everywhere rather than a local copy of it.
            if (existing != null) return existing;
        }
        return UUID.randomUUID();
    }
}
