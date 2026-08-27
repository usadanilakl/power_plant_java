package com.dk_power.power_plant_java.entities.loto;

import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToOne;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LotoBoxAssociationTest {

    @Test
    void replacingPermitBoxCannotDeleteInventoryBox() throws NoSuchFieldException {
        OneToOne association = Loto.class.getDeclaredField("lotoBox")
                .getAnnotation(OneToOne.class);

        assertThat(association.orphanRemoval()).isFalse();
        assertThat(association.cascade()).doesNotContain(CascadeType.REMOVE, CascadeType.ALL);
    }
}
