import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Categoria } from '../models/categoria.model';
import { Observable, from } from 'rxjs';

/**
 * Service para gerenciar CRUD de Categorias
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly STORAGE_KEY = 'categorias';
  private nextId = 1;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Inicializa o storage e carrega o próximo ID
   */
  private async init() {
    await this.storage.create();
    const categorias = await this.getAll();
    if (categorias.length > 0) {
      this.nextId = Math.max(...categorias.map(c => c.id)) + 1;
    }
  }

  /**
   * Obtém todas as categorias
   */
  async getAll(): Promise<Categoria[]> {
    const categorias = await this.storage.get(this.STORAGE_KEY);
    return categorias || [];
  }

  /**
   * Obtém uma categoria por ID
   */
  async getById(id: number): Promise<Categoria | null> {
    const categorias = await this.getAll();
    return categorias.find(c => c.id === id) || null;
  }

  /**
   * Cria uma nova categoria
   */
  async create(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    const categorias = await this.getAll();
    const novaCategoria: Categoria = {
      ...categoria,
      id: this.nextId++
    };
    categorias.push(novaCategoria);
    await this.storage.set(this.STORAGE_KEY, categorias);
    return novaCategoria;
  }

  /**
   * Atualiza uma categoria existente
   */
  async update(id: number, categoria: Partial<Categoria>): Promise<boolean> {
    const categorias = await this.getAll();
    const index = categorias.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    categorias[index] = { ...categorias[index], ...categoria };
    await this.storage.set(this.STORAGE_KEY, categorias);
    return true;
  }

  /**
   * Remove uma categoria
   */
  async delete(id: number): Promise<boolean> {
    const categorias = await this.getAll();
    const index = categorias.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    categorias.splice(index, 1);
    await this.storage.set(this.STORAGE_KEY, categorias);
    return true;
  }
}

