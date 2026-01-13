import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { ProjetoService } from '../services/projeto.service';
import { Tarefa } from '../models/tarefa.model';
import { Projeto } from '../models/projeto.model';

// Página de tarefa
@Component({
  selector: 'app-tarefa',
  templateUrl: './tarefa.page.html',
  styleUrls: ['./tarefa.page.scss'],
  standalone: false,
})
export class TarefaPage implements OnInit {
  tarefaId: string | null = null;
  tarefa: Tarefa | null = null;
  isEditando = false;
  isNova = false;

  titulo: string = '';
  descricao: string = '';
  dataLimite: string = '';
  dataLimiteFormatada: string = '';
  imagem: string = '';
  projetoId: number | null = null;

  todosProjetos: Projeto[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tarefaService: TarefaService,
    private projetoService: ProjetoService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    this.todosProjetos = await this.projetoService.getAll();
    
    this.tarefaId = this.route.snapshot.paramMap.get('id');
    
    if (this.tarefaId === 'novo') {
      this.isNova = true;
      this.isEditando = true;
      
      this.route.queryParams.subscribe(params => {
        const projetoId = params['projetoId'];
        if (projetoId) {
          this.projetoId = Number(projetoId);
        }
      });
    } else if (this.tarefaId) {
      await this.carregarTarefa(Number(this.tarefaId));
    }
  }

  async carregarTarefa(id: number) {
    this.tarefa = await this.tarefaService.getById(id);
    if (this.tarefa) {
      this.titulo = this.tarefa.titulo;
      this.descricao = this.tarefa.descricao;
      if (this.tarefa.dataLimite) {
        const date = new Date(this.tarefa.dataLimite);
        this.dataLimite = this.tarefa.dataLimite;
        this.dataLimiteFormatada = date.toISOString().split('T')[0];
      } else {
        this.dataLimite = '';
        this.dataLimiteFormatada = '';
      }
      this.imagem = this.tarefa.imagem || '';
      this.projetoId = this.tarefa.projetoId;
    }
  }

  iniciarEdicao() {
    this.isEditando = true;
  }

  cancelarEdicao() {
    if (this.isNova) {
      this.router.navigate(['/lista']);
    } else {
      this.isEditando = false;
      if (this.tarefa) {
        this.carregarTarefa(this.tarefa.id);
      }
    }
  }

  onDataChange(event: any) {
    const valor = event.detail?.value || event.target?.value || '';
    this.dataLimiteFormatada = valor;
  }

  async salvarTarefa() {
    if (!this.titulo.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um título para a tarefa.');
      return;
    }

    if (!this.projetoId) {
      await this.mostrarAlerta('Erro', 'Por favor, selecione um projeto.');
      return;
    }

    let dataLimiteISO = '';
    if (this.dataLimiteFormatada && this.dataLimiteFormatada.trim()) {
      try {
        const date = new Date(this.dataLimiteFormatada + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          dataLimiteISO = date.toISOString();
        }
      } catch (e) {
        dataLimiteISO = '';
      }
    }

    if (this.isNova) {
      const novaTarefa = await this.tarefaService.create({
        titulo: this.titulo.trim(),
        descricao: this.descricao.trim(),
        dataLimite: dataLimiteISO,
        imagem: this.imagem,
        projetoId: this.projetoId
      });
      
      await this.mostrarAlerta('Sucesso', 'Tarefa criada com sucesso!');
      this.router.navigate(['/lista'], { queryParams: { projetoId: this.projetoId } });
    } else if (this.tarefa) {
      const sucesso = await this.tarefaService.update(this.tarefa.id, {
        titulo: this.titulo.trim(),
        descricao: this.descricao.trim(),
        dataLimite: dataLimiteISO,
        imagem: this.imagem,
        projetoId: this.projetoId
      });

      if (sucesso) {
        await this.mostrarAlerta('Sucesso', 'Tarefa atualizada com sucesso!');
        await this.carregarTarefa(this.tarefa.id);
        this.isEditando = false;
      }
    }
  }

  async removerTarefa() {
    if (!this.tarefa) return;

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
            const sucesso = await this.tarefaService.delete(this.tarefa!.id);
            if (sucesso) {
              await this.mostrarAlerta('Sucesso', 'Tarefa removida com sucesso!');
              this.router.navigate(['/lista']);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async moverParaProjeto() {
    if (!this.tarefa || !this.projetoId) return;

    const sucesso = await this.tarefaService.moverParaProjeto(this.tarefa.id, this.projetoId);
    if (sucesso) {
      await this.mostrarAlerta('Sucesso', 'Tarefa movida com sucesso!');
      await this.carregarTarefa(this.tarefa.id);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        await this.mostrarAlerta('Erro', 'Por favor, selecione um arquivo de imagem.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        await this.mostrarAlerta('Erro', 'A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagem = e.target.result;
      };
      reader.onerror = async () => {
        await this.mostrarAlerta('Erro', 'Erro ao ler o arquivo. Tente novamente.');
      };
      reader.readAsDataURL(file);
    }
  }


  removerImagem() {
    this.imagem = '';
  }

  formatarData(data: string): string {
    if (!data) return 'Sem data limite';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  formatarDataInput(data: string): string {
    if (!data) return '';
    try {
      const date = new Date(data + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return data;
    }
  }

  limparDataLimite() {
    this.dataLimiteFormatada = '';
    this.dataLimite = '';
  }

  isTarefaAtrasada(): boolean {
    if (!this.tarefa || !this.tarefa.dataLimite) return false;
    const dataLimite = new Date(this.tarefa.dataLimite);
    const agora = new Date();
    return dataLimite < agora;
  }

  getNomeProjeto(projetoId: number): string {
    const projeto = this.todosProjetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Projeto desconhecido';
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
