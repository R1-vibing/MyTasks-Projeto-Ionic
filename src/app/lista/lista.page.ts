import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { ProjetoService } from '../services/projeto.service';
import { Tarefa } from '../models/tarefa.model';
import { Projeto } from '../models/projeto.model';

// Página de lista de tarefas
@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
  standalone: false,
})
export class ListaPage implements OnInit {
  tarefas: Tarefa[] = [];
  todasTarefas: Tarefa[] = [];
  tarefasAtrasadas: Tarefa[] = [];
  projetoFiltro: number | null = null;
  projetoAtual: Projeto | null = null;
  todosProjetos: Projeto[] = [];

  constructor(
    private tarefaService: TarefaService,
    private projetoService: ProjetoService,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const projetoId = params['projetoId'];
      if (projetoId) {
        this.projetoFiltro = Number(projetoId);
        this.projetoAtual = await this.projetoService.getById(this.projetoFiltro);
      }
      await this.carregarTarefas();
    });
  }

  async carregarTarefas() {
    this.todosProjetos = await this.projetoService.getAll();
    
    if (this.projetoFiltro) {
      this.tarefas = await this.tarefaService.getByProjeto(this.projetoFiltro);
    } else {
      this.tarefas = await this.tarefaService.getAll();
    }
    
    this.todasTarefas = await this.tarefaService.getAll();
    this.tarefasAtrasadas = await this.tarefaService.getTarefasAtrasadas();
  }

  isTarefaAtrasada(tarefa: Tarefa): boolean {
    if (!tarefa.dataLimite) return false;
    const dataLimite = new Date(tarefa.dataLimite);
    const agora = new Date();
    return dataLimite < agora;
  }

  formatarData(data: string): string {
    if (!data) return 'Sem data limite';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  verTarefa(tarefaId: number) {
    this.router.navigate(['/tarefa', tarefaId]);
  }

  async removerTarefa(tarefaId: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: 'Tem certeza que deseja remover esta tarefa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            const sucesso = await this.tarefaService.delete(tarefaId);
            if (sucesso) {
              await this.carregarTarefas();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async reordenarTarefas(event: any) {
    const itemToMove = this.tarefas.splice(event.detail.from, 1)[0];
    this.tarefas.splice(event.detail.to, 0, itemToMove);
    await this.tarefaService.reordenar(this.tarefas);
    event.detail.complete();
  }

  novaTarefa() {
    if (this.projetoFiltro) {
      this.router.navigate(['/tarefa', 'novo'], { queryParams: { projetoId: this.projetoFiltro } });
    } else {
      this.router.navigate(['/tarefa', 'novo']);
    }
  }

  getNomeProjeto(projetoId: number): string {
    const projeto = this.todosProjetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Projeto desconhecido';
  }
}
