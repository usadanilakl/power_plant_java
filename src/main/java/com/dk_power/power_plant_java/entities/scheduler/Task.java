package com.dk_power.power_plant_java.entities.scheduler;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class Task extends BaseAuditEntity {
    private String description;
    private String completionLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private Value status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id")
    private Flow flow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id")
    private Task parentTask;

    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Task> subTasks = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "task_dependencies",
            joinColumns = @JoinColumn(name = "dependent_task_id"),
            inverseJoinColumns = @JoinColumn(name = "prerequisite_task_id")
    )
    private Set<Task> prerequisites = new HashSet<>();

    @ManyToMany(mappedBy = "prerequisites")
    private Set<Task> dependents = new HashSet<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskReference> references = new HashSet<>();

    @Transient
    private Set<FileObject> fileReferences = new HashSet<>();
    @Transient
    private Set<Equipment> equipmentReferences = new HashSet<>();
    @Transient
    private Set<LotoPoint> lotoPointReferences = new HashSet<>();
    @Transient
    private Set<Value> locationReferences = new HashSet<>();


    public void addSubTask(Task subTask) {
        subTasks.add(subTask);
        subTask.setParentTask(this);
    }

    public void removeSubTask(Task subTask) {
        subTasks.remove(subTask);
        subTask.setParentTask(null);
    }

    public void addPrerequisite(Task prerequisiteTask) {
        prerequisites.add(prerequisiteTask);
        prerequisiteTask.getDependents().add(this);
    }

    public void removePrerequisite(Task prerequisiteTask) {
        prerequisites.remove(prerequisiteTask);
        prerequisiteTask.getDependents().remove(this);
    }

    public boolean isReadyToExecute() {
        if (prerequisites.isEmpty()) {
            return true; // No prerequisites, so it's ready to execute
        }

        // Check if all prerequisites are in a completed status
        return prerequisites.stream().allMatch(prerequisite -> prerequisite.getStatus().getName().equals("Completed"));
    }

    public boolean isLeafTask() {
        return subTasks.isEmpty();
    }

    public void addReference(String referenceType, Long referenceId) {
        TaskReference reference = new TaskReference();
        reference.setTask(this);
        reference.setReferenceType(referenceType);
        reference.setReferenceId(referenceId);
        references.add(reference);
    }

    public void removeReference(TaskReference reference) {
        references.remove(reference);
        reference.setTask(null);
    }
}