import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa } from '../models/tarefa.model';

/**
 * Página de Calendário
 * Mostra as datas limite das tarefas e permite selecionar para visualizar/editar
 */
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
    // Define a data selecionada como hoje
    const hoje = new Date();
    this.dataSelecionada = hoje.toISOString().split('T')[0];
    this.filtrarTarefasPorData();
  }

  /**
   * Carrega todas as tarefas do storage
   */
  async carregarTarefas() {
    this.todasTarefas = await this.tarefaService.getAll();
    this.organizarTarefasPorData();
  }

  /**
   * Organiza tarefas por data
   */
  organizarTarefasPorData() {
    this.tarefasPorData.clear();
    
    this.todasTarefas.forEach(tarefa => {
      if (tarefa.dataLimite) {
        const data = tarefa.dataLimite.split('T')[0]; // Apenas a data, sem hora
        if (!this.tarefasPorData.has(data)) {
          this.tarefasPorData.set(data, []);
        }
        this.tarefasPorData.get(data)!.push(tarefa);
      }
    });
  }

  /**
   * Filtra tarefas pela data selecionada
   */
  filtrarTarefasPorData() {
    if (this.dataSelecionada) {
      this.tarefasDoDia = this.tarefasPorData.get(this.dataSelecionada) || [];
    } else {
      this.tarefasDoDia = [];
    }
  }

  /**
   * Quando a data é alterada no calendário
   */
  onDataChange() {
    this.filtrarTarefasPorData();
  }

  /**
   * Verifica se uma data tem tarefas
   */
  dataTemTarefas(data: string): boolean {
    return this.tarefasPorData.has(data) && this.tarefasPorData.get(data)!.length > 0;
  }

  /**
   * Obtém o número de tarefas de uma data
   */
  getNumeroTarefas(data: string): number {
    return this.tarefasPorData.get(data)?.length || 0;
  }

  /**
   * Verifica se uma tarefa está em atraso
   */
  isTarefaAtrasada(tarefa: Tarefa): boolean {
    if (!tarefa.dataLimite) return false;
    const dataLimite = new Date(tarefa.dataLimite);
    const agora = new Date();
    return dataLimite < agora;
  }

  /**
   * Formata a data para exibição
   */
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

  /**
   * Navega para visualizar/editar a tarefa
   */
  verTarefa(tarefaId: number) {
    this.router.navigate(['/tarefa', tarefaId]);
  }

  /**
   * Obtém todas as datas que têm tarefas
   */
  getDatasComTarefas(): string[] {
    return Array.from(this.tarefasPorData.keys()).sort();
  }
}
