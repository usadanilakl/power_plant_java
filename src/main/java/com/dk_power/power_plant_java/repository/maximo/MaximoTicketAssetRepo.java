package com.dk_power.power_plant_java.repository.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoTicketAsset;
import com.dk_power.power_plant_java.entities.maximo.MaximoTicketType;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaximoTicketAssetRepo extends BaseRepository<MaximoTicketAsset> {

    /** Upsert lookup by natural key ("WO:J26-41492" / "SR:12345"). */
    Optional<MaximoTicketAsset> findFirstByTicketKey(String ticketKey);

    long countByTicketType(MaximoTicketType ticketType);

    /**
     * Search tickets by (partial) tag number — forgiving: matches the identified asset, the assetnum Maximo
     * had, any suggested candidate, or a tag pulled from the text (delimited forms via {@code likeUpper},
     * plus the delimiter-stripped {@code searchCompact} via {@code likeCompact} so "01ACCHEX01B" finds
     * "01-ACC-HEX-01B"). Both args must be upper-cased and wrapped in {@code %...%}. Newest reportdate first.
     */
    @Query("""
        select t from MaximoTicketAsset t
        where upper(t.identifiedAssetnum) like :likeUpper
           or upper(t.maximoAssetnum) like :likeUpper
           or upper(t.suggestedAssetnums) like :likeUpper
           or upper(t.extractedTags) like :likeUpper
           or upper(t.searchCompact) like :likeCompact
        order by t.reportDate desc
        """)
    List<MaximoTicketAsset> searchByTag(@Param("likeUpper") String likeUpper,
                                        @Param("likeCompact") String likeCompact, Pageable pageable);
}
