import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { ProjetoService } from '../services/projeto.service';
import { Tarefa } from '../models/tarefa.model';
import { Projeto } from '../models/projeto.model';

/**
 * Página para visualizar, criar e editar tarefas
 * Suporta upload de imagem, data limite e mover entre projetos
 */
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

  // Campos do formulário
  titulo: string = '';
  descricao: string = '';
  dataLimite: string = ''; // ISO string para storage
  dataLimiteFormatada: string = ''; // Formato YYYY-MM-DD para input
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
    
    // Verifica se é nova tarefa ou edição
    this.tarefaId = this.route.snapshot.paramMap.get('id');
    
    if (this.tarefaId === 'novo') {
      this.isNova = true;
      this.isEditando = true;
      
      // Verifica se há projetoId na query
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

  /**
   * Carrega uma tarefa do storage
   */
  async carregarTarefa(id: number) {
    this.tarefa = await this.tarefaService.getById(id);
    if (this.tarefa) {
      this.titulo = this.tarefa.titulo;
      this.descricao = this.tarefa.descricao;
      // Converte ISO string para formato YYYY-MM-DD do input
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

  /**
   * Inicia a edição
   */
  iniciarEdicao() {
    this.isEditando = true;
  }

  /**
   * Cancela a edição
   */
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

  /**
   * Quando a data é alterada no input
   */
  onDataChange(event: any) {
    const valor = event.detail?.value || event.target?.value || '';
    this.dataLimiteFormatada = valor;
  }

  /**
   * Salva a tarefa (cria ou atualiza)
   */
  async salvarTarefa() {
    if (!this.titulo.trim()) {
      await this.mostrarAlerta('Erro', 'Por favor, insira um título para a tarefa.');
      return;
    }

    if (!this.projetoId) {
      await this.mostrarAlerta('Erro', 'Por favor, selecione um projeto.');
      return;
    }

    // Converte a data formatada (YYYY-MM-DD) para ISO string se fornecida
    let dataLimiteISO = '';
    if (this.dataLimiteFormatada && this.dataLimiteFormatada.trim()) {
      try {
        // Adiciona hora para garantir timezone correto
        const date = new Date(this.dataLimiteFormatada + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          dataLimiteISO = date.toISOString();
        }
      } catch (e) {
        // Se houver erro na conversão, deixa vazio
        dataLimiteISO = '';
      }
    }

    if (this.isNova) {
      // Criar nova tarefa
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
      // Atualizar tarefa existente
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

  /**
   * Remove a tarefa
   */
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

  /**
   * Move a tarefa para outro projeto
   */
  async moverParaProjeto() {
    if (!this.tarefa || !this.projetoId) return;

    const sucesso = await this.tarefaService.moverParaProjeto(this.tarefa.id, this.projetoId);
    if (sucesso) {
      await this.mostrarAlerta('Sucesso', 'Tarefa movida com sucesso!');
      await this.carregarTarefa(this.tarefa.id);
    }
  }

  /**
   * Quando um arquivo é selecionado do explorador
   */
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Verifica se é uma imagem
      if (!file.type.startsWith('image/')) {
        await this.mostrarAlerta('Erro', 'Por favor, selecione um arquivo de imagem.');
        return;
      }

      // Verifica o tamanho (limite de 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await this.mostrarAlerta('Erro', 'A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.');
        return;
      }

      // Lê o arquivo e converte para base64
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


  /**
   * Remove a imagem
   */
  removerImagem() {
    this.imagem = '';
  }

  /**
   * Formata a data para exibição
   */
  formatarData(data: string): string {
    if (!data) return 'Sem data limite';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata a data do input para exibição
   */
  formatarDataInput(data: string): string {
    if (!data) return '';
    try {
      const date = new Date(data + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return data;
    }
  }

  /**
   * Limpa a data limite
   */
  limparDataLimite() {
    this.dataLimiteFormatada = '';
    this.dataLimite = '';
  }

  /**
   * Verifica se a tarefa está em atraso
   */
  isTarefaAtrasada(): boolean {
    if (!this.tarefa || !this.tarefa.dataLimite) return false;
    const dataLimite = new Date(this.tarefa.dataLimite);
    const agora = new Date();
    return dataLimite < agora;
  }

  /**
   * Obtém o nome do projeto
   */
  getNomeProjeto(projetoId: number): string {
    const projeto = this.todosProjetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Projeto desconhecido';
  }

  /**
   * Mostra um alerta simples
   */
  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
