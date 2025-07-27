package com.dk_power.power_plant_java.entities.scheduler;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class Flow extends BaseAuditEntity {
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private Value status;

    @OneToMany(mappedBy = "flow", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Task> tasks = new HashSet<>();

    public void addTask(Task task) {
        tasks.add(task);
        task.setFlow(this);
    }

    public void removeTask(Task task) {
        tasks.remove(task);
        task.setFlow(null);
    }
}