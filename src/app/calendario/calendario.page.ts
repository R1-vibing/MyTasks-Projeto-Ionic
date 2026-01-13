import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa } from '../models/tarefa.model';

// Página de calendário
@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss'],
  standalone: false,
})
export class CalendarioPage implements OnInit {
  todasTarefas: Tarefa[] = [];
  tarefasPorData: Map<string, Tarefa[]> = new Map();
  dataSelecionada: string = '';
  tarefasDoDia: Tarefa[] = [];

  constructor(
    private tarefaService: TarefaService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.carregarTarefas();
    const hoje = new Date();
    this.dataSelecionada = hoje.toISOString().split('T')[0];
    this.filtrarTarefasPorData();
  }

  async carregarTarefas() {
    this.todasTarefas = await this.tarefaService.getAll();
    this.organizarTarefasPorData();
  }

  organizarTarefasPorData() {
    this.tarefasPorData.clear();
    
    this.todasTarefas.forEach(tarefa => {
      if (tarefa.dataLimite) {
        const data = tarefa.dataLimite.split('T')[0];
        if (!this.tarefasPorData.has(data)) {
          this.tarefasPorData.set(data, []);
        }
        this.tarefasPorData.get(data)!.push(tarefa);
      }
    });
  }

  filtrarTarefasPorData() {
    if (this.dataSelecionada) {
      this.tarefasDoDia = this.tarefasPorData.get(this.dataSelecionada) || [];
    } else {
      this.tarefasDoDia = [];
    }
  }

  onDataChange() {
    this.filtrarTarefasPorData();
  }

  dataTemTarefas(data: string): boolean {
    return this.tarefasPorData.has(data) && this.tarefasPorData.get(data)!.length > 0;
  }

  getNumeroTarefas(data: string): number {
    return this.tarefasPorData.get(data)?.length || 0;
  }

  isTarefaAtrasada(tarefa: Tarefa): boolean {
    if (!tarefa.dataLimite) return false;
    const dataLimite = new Date(tarefa.dataLimite);
    const agora = new Date();
    return dataLimite < agora;
  }

  formatarData(data: string): string {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  verTarefa(tarefaId: number) {
    this.router.navigate(['/tarefa', tarefaId]);
  }

  getDatasComTarefas(): string[] {
    return Array.from(this.tarefasPorData.keys()).sort();
  }
}
