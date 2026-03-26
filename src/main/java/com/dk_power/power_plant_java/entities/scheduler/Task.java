package com.dk_power.power_plant_java.entities.scheduler;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.TaskLevel;
import com.dk_power.power_plant_java.enums.TaskType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
public class Task extends BaseAuditEntity {
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    private TaskLevel taskLevel = TaskLevel.TASK;

    @Enumerated(EnumType.STRING)
    private TaskType taskType = TaskType.ONE_TIME;

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

    @ManyToMany
    @JoinTable(
            name = "task_attachments",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "file_object_id")
    )
    private Set<FileObject> attachments = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "priority_id")
    private Value priority;

    private LocalDate dueDate;
    private Integer sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private TaskTemplate template;

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
        if (prerequisites.isEmpty()) return true;
        return prerequisites.stream()
                .allMatch(p -> p.getStatus() != null && "Completed".equals(p.getStatus().getName()));
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
