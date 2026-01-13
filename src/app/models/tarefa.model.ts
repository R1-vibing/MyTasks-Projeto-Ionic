export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  dataLimite: string;
  imagem?: string;
  projetoId: number;
}

