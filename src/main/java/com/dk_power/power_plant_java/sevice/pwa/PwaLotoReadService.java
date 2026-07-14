package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Tiny transactional read helper for {@link PwaLotoService}. Lives in its OWN bean on purpose: the batch submit methods
 * in PwaLotoService are intentionally non-transactional (each per-point delegate commits independently), so they must
 * NOT self-invoke a {@code @Transactional} read there — self-invocation bypasses the proxy and the lazy
 * {@code snapshots} collection would throw. Calling across beans re-applies the proxy so the read runs in a real tx.
 */
@Service
@RequiredArgsConstructor
public class PwaLotoReadService {

    private final LotoRepo lotoRepo;

    @Transactional(readOnly = true)
    public Set<Long> hungPointIds(Long lotoId) {
        LotoSnapshot s = lotoRepo.findById(lotoId).map(Loto::getLatestSnapshot).orElse(null);
        return s != null ? new HashSet<>(s.getPointHungBy().keySet()) : new HashSet<>();
    }

    @Transactional(readOnly = true)
    public Set<Long> verifiedPointIds(Long lotoId) {
        LotoSnapshot s = lotoRepo.findById(lotoId).map(Loto::getLatestSnapshot).orElse(null);
        return s != null ? new HashSet<>(s.getPointVerifiedBy().keySet()) : new HashSet<>();
    }
}
