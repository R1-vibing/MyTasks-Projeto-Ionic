import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  standalone: false,
})
export class TaskCardComponent {
  @Input() title!: string;
  @Input() tasks: any[] = [];

  constructor(private router: Router) {}

  selectTask(task: any) {
    this.router.navigateByUrl(`/tarefa/${task.id}`);
  }

  deleteTask(taskId: number) {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
  }

  editTask(task: any) {
    this.router.navigateByUrl(`/tarefa/${task.id}`);
  }

  reorderTasks(event: any) {
    const itemToMove = this.tasks.splice(event.detail.from, 1)[0];
    this.tasks.splice(event.detail.to, 0, itemToMove);
    event.detail.complete();
  }
}
