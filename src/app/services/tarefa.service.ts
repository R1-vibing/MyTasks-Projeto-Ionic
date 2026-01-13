import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Tarefa } from '../models/tarefa.model';

/**
 * Service para gerenciar CRUD de Tarefas
 * Isola toda a lógica de manipulação de tarefas
 */
@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private readonly STORAGE_KEY = 'tarefas';
  private nextId = 1;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Inicializa o storage e carrega o próximo ID
   */
  private async init() {
    await this.storage.create();
    const tarefas = await this.getAll();
    if (tarefas.length > 0) {
      this.nextId = Math.max(...tarefas.map(t => t.id)) + 1;
    }
  }

  /**
   * Obtém todas as tarefas
   */
  async getAll(): Promise<Tarefa[]> {
    const tarefas = await this.storage.get(this.STORAGE_KEY);
    return tarefas || [];
  }

  /**
   * Obtém tarefas de um projeto específico
   */
  async getByProjeto(projetoId: number): Promise<Tarefa[]> {
    const tarefas = await this.getAll();
    return tarefas.filter(t => t.projetoId === projetoId);
  }

  /**
   * Obtém tarefas em atraso (data limite já passou)
   */
  async getTarefasAtrasadas(): Promise<Tarefa[]> {
    const tarefas = await this.getAll();
    const agora = new Date();
    return tarefas.filter(t => {
      if (!t.dataLimite) return false;
      const dataLimite = new Date(t.dataLimite);
      return dataLimite < agora;
    });
  }

  /**
   * Obtém uma tarefa por ID
   */
  async getById(id: number): Promise<Tarefa | null> {
    const tarefas = await this.getAll();
    return tarefas.find(t => t.id === id) || null;
  }

  /**
   * Cria uma nova tarefa
   */
  async create(tarefa: Omit<Tarefa, 'id'>): Promise<Tarefa> {
    const tarefas = await this.getAll();
    const novaTarefa: Tarefa = {
      ...tarefa,
      id: this.nextId++
    };
    tarefas.push(novaTarefa);
    await this.storage.set(this.STORAGE_KEY, tarefas);
    return novaTarefa;
  }

  /**
   * Atualiza uma tarefa existente
   */
  async update(id: number, tarefa: Partial<Tarefa>): Promise<boolean> {
    const tarefas = await this.getAll();
    const index = tarefas.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    tarefas[index] = { ...tarefas[index], ...tarefa };
    await this.storage.set(this.STORAGE_KEY, tarefas);
    return true;
  }

  /**
   * Remove uma tarefa
   */
  async delete(id: number): Promise<boolean> {
    const tarefas = await this.getAll();
    const index = tarefas.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    tarefas.splice(index, 1);
    await this.storage.set(this.STORAGE_KEY, tarefas);
    return true;
  }

  /**
   * Move uma tarefa para outro projeto
   */
  async moverParaProjeto(tarefaId: number, novoProjetoId: number): Promise<boolean> {
    return await this.update(tarefaId, { projetoId: novoProjetoId });
  }

  /**
   * Reordena tarefas (atualiza a ordem no array)
   */
  async reordenar(tarefas: Tarefa[]): Promise<void> {
    await this.storage.set(this.STORAGE_KEY, tarefas);
  }
}

