import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Projeto } from '../models/projeto.model';
import { TarefaService } from './tarefa.service';

/**
 * Service para gerenciar CRUD de Projetos
 */
@Injectable({
  providedIn: 'root'
})
export class ProjetoService {
  private readonly STORAGE_KEY = 'projetos';
  private nextId = 1;

  constructor(
    private storage: Storage,
    private tarefaService: TarefaService
  ) {
    this.init();
  }

  /**
   * Inicializa o storage e carrega o próximo ID
   */
  private async init() {
    await this.storage.create();
    const projetos = await this.getAll();
    if (projetos.length > 0) {
      this.nextId = Math.max(...projetos.map(p => p.id)) + 1;
    }
  }

  /**
   * Obtém todos os projetos
   */
  async getAll(): Promise<Projeto[]> {
    const projetos = await this.storage.get(this.STORAGE_KEY);
    return projetos || [];
  }

  /**
   * Obtém projetos filtrados por categoria
   */
  async getByCategoria(categoriaId: number): Promise<Projeto[]> {
    const projetos = await this.getAll();
    return projetos.filter(p => p.categoriaId === categoriaId);
  }

  /**
   * Obtém um projeto por ID
   */
  async getById(id: number): Promise<Projeto | null> {
    const projetos = await this.getAll();
    return projetos.find(p => p.id === id) || null;
  }

  /**
   * Cria um novo projeto
   */
  async create(projeto: Omit<Projeto, 'id'>): Promise<Projeto> {
    const projetos = await this.getAll();
    const novoProjeto: Projeto = {
      ...projeto,
      id: this.nextId++
    };
    projetos.push(novoProjeto);
    await this.storage.set(this.STORAGE_KEY, projetos);
    return novoProjeto;
  }

  /**
   * Atualiza um projeto existente
   */
  async update(id: number, projeto: Partial<Projeto>): Promise<boolean> {
    const projetos = await this.getAll();
    const index = projetos.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    projetos[index] = { ...projetos[index], ...projeto };
    await this.storage.set(this.STORAGE_KEY, projetos);
    return true;
  }

  /**
   * Remove um projeto e todas as suas tarefas
   */
  async delete(id: number): Promise<boolean> {
    const projetos = await this.getAll();
    const index = projetos.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    // Remove todas as tarefas do projeto
    const tarefas = await this.tarefaService.getByProjeto(id);
    for (const tarefa of tarefas) {
      await this.tarefaService.delete(tarefa.id);
    }
    
    projetos.splice(index, 1);
    await this.storage.set(this.STORAGE_KEY, projetos);
    return true;
  }
}

