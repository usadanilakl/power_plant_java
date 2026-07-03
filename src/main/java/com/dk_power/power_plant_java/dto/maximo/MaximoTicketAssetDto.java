package com.dk_power.power_plant_java.dto.maximo;

import com.dk_power.power_plant_java.entities.maximo.AssetMatchConfidence;
import com.dk_power.power_plant_java.entities.maximo.MaximoTicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** Wire shape for a Maximo ticket→asset index row (search results, admin views). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaximoTicketAssetDto {
    private Long id;
    private String ticketKey;
    private MaximoTicketType ticketType;
    private String ticketId;
    private String href;
    private String title;
    private String status;
    private String siteid;
    private String reportDate;
    private String maximoAssetnum;
    private String maximoLocation;
    private String identifiedAssetnum;
    private AssetMatchConfidence confidence;
    private String matchSource;
    private List<String> suggestedAssets;   // split from the comma-joined column
    private List<String> extractedTags;     // split from the comma-joined column
    private LocalDateTime processedAt;
}
