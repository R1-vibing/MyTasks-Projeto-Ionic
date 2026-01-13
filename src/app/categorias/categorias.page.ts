import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CategoriaService } from '../services/categoria.service';
import { Categoria } from '../models/categoria.model';

// Página de categorias
@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: false,
})
export class CategoriasPage implements OnInit {
  categorias: Categoria[] = [];
  categoriaEditando: Categoria | null = null;
  nomeCategoria: string = '';

  constructor(
    private categoriaService: CategoriaService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.carregarCategorias();
  }

  async carregarCategorias() {
    this.categorias = await this.categoriaService.getAll();
  }

  async adicionarCategoria() {
    if (!this.nomeCategoria.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um nome para a categoria.');
      return;
    }

    const novaCategoria = await this.categoriaService.create({
      nome: this.nomeCategoria.trim()
    });

    this.categorias.push(novaCategoria);
    this.nomeCategoria = '';
  }

  iniciarEdicao(categoria: Categoria) {
    this.categoriaEditando = { ...categoria };
    this.nomeCategoria = categoria.nome;
  }

  cancelarEdicao() {
    this.categoriaEditando = null;
    this.nomeCategoria = '';
  }

  async salvarEdicao() {
    if (!this.categoriaEditando || !this.nomeCategoria.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um nome válido.');
      return;
    }

    const sucesso = await this.categoriaService.update(
      this.categoriaEditando.id,
      { nome: this.nomeCategoria.trim() }
    );

    if (sucesso) {
      await this.carregarCategorias();
      this.cancelarEdicao();
    }
  }

  async removerCategoria(categoria: Categoria) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `Tem certeza que deseja remover a categoria "${categoria.nome}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            const sucesso = await this.categoriaService.delete(categoria.id);
            if (sucesso) {
              await this.carregarCategorias();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
