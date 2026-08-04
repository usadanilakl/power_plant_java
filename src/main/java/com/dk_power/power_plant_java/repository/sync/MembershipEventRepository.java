package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.MembershipEvent;
import com.dk_power.power_plant_java.entities.sync.MembershipEvent.Op;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipEventRepository extends JpaRepository<MembershipEvent, Long> {

    Optional<MembershipEvent> findByOwnerTypeAndOwnerIdAndFieldNameAndElementIdAndOp(
            String ownerType, Long ownerId, String fieldName, Long elementId, Op op);

    List<MembershipEvent> findByOwnerTypeAndOwnerIdAndFieldName(
            String ownerType, Long ownerId, String fieldName);
}
