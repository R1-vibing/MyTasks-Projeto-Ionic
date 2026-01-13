import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ProjetoService } from '../services/projeto.service';
import { CategoriaService } from '../services/categoria.service';
import { Projeto } from '../models/projeto.model';
import { Categoria } from '../models/categoria.model';

// Página de projetos
@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false,
})
export class ProjetosPage implements OnInit {
  projetos: Projeto[] = [];
  todasCategorias: Categoria[] = [];
  categoriaFiltro: number | null = null;
  projetoEditando: Projeto | null = null;
  nomeProjeto: string = '';
  categoriaSelecionada: number | null = null;

  constructor(
    private projetoService: ProjetoService,
    private categoriaService: CategoriaService,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    const categoriaId = this.route.snapshot.paramMap.get('categoriaId');
    if (categoriaId) {
      this.categoriaFiltro = Number(categoriaId);
      this.categoriaSelecionada = this.categoriaFiltro;
    }

    await this.carregarDados();
  }

  async carregarDados() {
    this.todasCategorias = await this.categoriaService.getAll();
    
    if (this.categoriaFiltro) {
      this.projetos = await this.projetoService.getByCategoria(this.categoriaFiltro);
    } else {
      this.projetos = await this.projetoService.getAll();
    }
  }

  async filtrarPorCategoria() {
    if (this.categoriaSelecionada) {
      this.categoriaFiltro = this.categoriaSelecionada;
      this.projetos = await this.projetoService.getByCategoria(this.categoriaSelecionada);
    } else {
      this.categoriaFiltro = null;
      this.projetos = await this.projetoService.getAll();
    }
  }

  async removerFiltro() {
    this.categoriaFiltro = null;
    this.categoriaSelecionada = null;
    this.projetos = await this.projetoService.getAll();
  }

  async adicionarProjeto() {
    if (!this.nomeProjeto.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um nome para o projeto.');
      return;
    }

    if (!this.categoriaSelecionada) {
      await this.mostrarAlerta('Erro', 'Por favor, selecione uma categoria.');
      return;
    }

    const novoProjeto = await this.projetoService.create({
      nome: this.nomeProjeto.trim(),
      categoriaId: this.categoriaSelecionada
    });

    this.projetos.push(novoProjeto);
    this.nomeProjeto = '';
    this.categoriaSelecionada = this.categoriaFiltro;
  }

  iniciarEdicao(projeto: Projeto) {
    this.projetoEditando = { ...projeto };
    this.nomeProjeto = projeto.nome;
    this.categoriaSelecionada = projeto.categoriaId;
  }

  cancelarEdicao() {
    this.projetoEditando = null;
    this.nomeProjeto = '';
    this.categoriaSelecionada = this.categoriaFiltro;
  }

  async salvarEdicao() {
    if (!this.projetoEditando || !this.nomeProjeto.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um nome válido.');
      return;
    }

    if (!this.categoriaSelecionada) {
      await this.mostrarAlerta('Erro', 'Por favor, selecione uma categoria.');
      return;
    }

    const sucesso = await this.projetoService.update(
      this.projetoEditando.id,
      {
        nome: this.nomeProjeto.trim(),
        categoriaId: this.categoriaSelecionada
      }
    );

    if (sucesso) {
      await this.carregarDados();
      this.cancelarEdicao();
    }
  }

  async removerProjeto(projeto: Projeto) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `Tem certeza que deseja remover o projeto "${projeto.nome}"? Todas as tarefas associadas também serão removidas.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            const sucesso = await this.projetoService.delete(projeto.id);
            if (sucesso) {
              await this.carregarDados();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  verTarefas(projetoId: number) {
    this.router.navigate(['/lista'], { queryParams: { projetoId } });
  }

  criarTarefa(projetoId: number) {
    this.router.navigate(['/tarefa', 'novo'], { queryParams: { projetoId } });
  }

  getNomeCategoria(categoriaId: number): string {
    const categoria = this.todasCategorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : 'Desconhecida';
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
